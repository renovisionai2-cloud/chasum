import { z } from "zod";
import { assignmentTypes, entityTypes, mappingSchema, payloadSchema, snapshotSchema, type EntityType, type IdEntityType, type TargetAssignment, type ImportRow, type Preview, type ReasonCode, type Reference, type ResolvedReference, type RowOutcome } from "./contracts";
import { canonicalSerialize, hash, unordered } from "./hash";
import { normalizeTimezone, resolveTimestamp } from "./timezone";
export class ImportContractError extends Error {
    constructor(public readonly code: ReasonCode) { super(code); }
}
const email = (s: string) => s.trim().toLowerCase();
const money = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= 2147483647;
const currency = (s: string) => s.trim().toUpperCase();
const validCurrency = (s: string) => /^[A-Z]{3}$/.test(s) && Intl.supportedValuesOf("currency").includes(s) && new Intl.NumberFormat("en", { style: "currency", currency: s }).resolvedOptions().maximumFractionDigits === 2;
const rowId = (r: {
    entityType: EntityType;
    sourceRowKey: string;
}) => canonicalSerialize([r.entityType, r.sourceRowKey]);
const endpoints = (a: TargetAssignment): Record<string, string> => {
    switch (a.entityType) {
        case "staffService": return { staff: a.staffId, service: a.serviceId };
        case "staffLocation": return { staff: a.staffId, location: a.locationId };
        case "serviceLocation": return { service: a.serviceId, location: a.locationId };
    }
};
export function sourceRowHash(row: ImportRow): string {
    // Locator changes are not changes to operational content. Hash is never identity.
    const { sourceRowKey: _key, sourceExternalId: _id, ...content } = normalizeRow(row);
    void _key;
    void _id;
    return hash(content);
}
function normalizeRow(row: ImportRow): ImportRow {
    const r = { ...row };
    if ("email" in r && r.email !== undefined)
        r.email = email(r.email);
    if ("currency" in r)
        r.currency = currency(r.currency);
    if ("timezone" in r && r.timezone)
        r.timezone = normalizeTimezone(r.timezone) ?? r.timezone;
    if (r.entityType === "appointment" && r.financials.kind === "EXACT")
        r.financials = { ...r.financials, currency: currency(r.financials.currency) };
    return r;
}
/** Pure domain entry: snapshot is trusted server input in later packages, NEVER upload authority. */
export function previewImport(input: unknown, targetSnapshot: unknown, mappingInput: unknown, asOf: string): Preview {
    const parsed = payloadSchema.safeParse(input), snap = snapshotSchema.safeParse(targetSnapshot), config = mappingSchema.safeParse(mappingInput);
    if (!parsed.success || !config.success)
        throw new ImportContractError("INVALID_ROOT");
    if (!snap.success)
        throw new ImportContractError("INVALID_SNAPSHOT");
    const normalized = parsed.data, snapshot = snap.data, mapping = config.data;
    const now = resolveTimestamp(asOf, "UTC");
    if (now.error || !/(Z|[+-]\d{2}:\d{2})$/.test(asOf))
        throw new ImportContractError("INVALID_TIMESTAMP");
    normalized.source.sourceCurrency = currency(normalized.source.sourceCurrency);
    normalized.target.businessCurrency = currency(normalized.target.businessCurrency);
    normalized.source.inputChecksum = normalized.source.inputChecksum.toLowerCase();
    for (const zone of [normalized.source.sourceTimezone, normalized.target.businessTimezone])
        if (!normalizeTimezone(zone))
            throw new ImportContractError("INVALID_TIMEZONE");
    normalized.source.sourceTimezone = normalizeTimezone(normalized.source.sourceTimezone)!;
    normalized.target.businessTimezone = normalizeTimezone(normalized.target.businessTimezone)!;
    if (!validCurrency(normalized.source.sourceCurrency) || !validCurrency(normalized.target.businessCurrency))
        throw new ImportContractError("INVALID_CURRENCY");
    if (snapshot.businessId !== normalized.target.businessId || snapshot.entities.some(e => e.businessId !== snapshot.businessId) || snapshot.sourceRefs.some(r => r.businessId !== snapshot.businessId))
        throw new ImportContractError("TARGET_MISMATCH");
    const ids = snapshot.entities.map(e => canonicalSerialize([e.entityType, e.id]));
    if (new Set(ids).size !== ids.length)
        throw new ImportContractError("INVALID_SNAPSHOT");
    for (const assignment of snapshot.assignments) {
        if (Object.entries(endpoints(assignment)).some(([type, id]) => !snapshot.entities.some(e => e.entityType === type && e.id === id)))
            throw new ImportContractError("INVALID_SNAPSHOT");
    }
    if (new Set(snapshot.assignments.map(a => canonicalSerialize(a))).size !== snapshot.assignments.length)
        throw new ImportContractError("INVALID_SNAPSHOT");
    for (const e of snapshot.entities) {
        if (e.email)
            e.email = email(e.email);
        if (e.entityType === "appointment") {
            if (!e.start || !e.end || !e.staffId || !e.status)
                throw new ImportContractError("INVALID_SNAPSHOT");
            const a = resolveTimestamp(e.start, "UTC"), b = resolveTimestamp(e.end, "UTC");
            if (a.error || b.error || !/(Z|[+-]\d{2}:\d{2})$/.test(e.start) || !/(Z|[+-]\d{2}:\d{2})$/.test(e.end) || a.iso! >= b.iso!)
                throw new ImportContractError("INVALID_SNAPSHOT");
            e.start = a.iso;
            e.end = b.iso;
        }
    }
    normalized.rows = normalized.rows.map(normalizeRow);
    const rows = normalized.rows;
    if (mapping.links.some(l => !rows.some(r => rowId(r) === rowId(l))))
        throw new ImportContractError("INVALID_ROOT");
    const results = rows.map((r): RowOutcome => ({ entityType: r.entityType, sourceRowKey: r.sourceRowKey, ...(r.sourceExternalId ? { sourceExternalId: r.sourceExternalId } : {}), sourceRowHash: sourceRowHash(r), status: "READY", plannedAction: "CREATE", reasonCodes: [], dependencies: {} }));
    const setExistingId = (i: number, id: string) => {
        const o = results[i];
        if (o.entityType === "serviceLocation" || o.entityType === "staffLocation" || o.entityType === "staffService")
            throw new ImportContractError("INVALID_ROOT");
        o.existingId = id;
    };
    const add = (i: number, reason: ReasonCode, status: RowOutcome["status"] = "INVALID", action: RowOutcome["plannedAction"] = "BLOCK") => {
        const o = results[i];
        o.reasonCodes.push(reason);
        // Invalid/duplicate/unresolved states cannot be downgraded by later warnings.
        const rank = { READY: 0, SKIPPED: 1, DUPLICATE_EXISTING: 2, WARNING: 3, UNRESOLVED_REFERENCE: 4, INVALID: 5, DUPLICATE_IN_FILE: 6 };
        if (rank[status] >= rank[o.status]) {
            o.status = status;
            o.plannedAction = action;
        }
    };
    const duplicate = (key: (r: ImportRow) => string | undefined, reason: ReasonCode) => {
        const groups = new Map<string, number[]>();
        rows.forEach((r, i) => { const k = key(r); if (k !== undefined)
            groups.set(k, [...(groups.get(k) ?? []), i]); });
        for (const group of groups.values())
            if (group.length > 1)
                group.forEach(i => add(i, reason, "DUPLICATE_IN_FILE"));
    };
    duplicate(r => r.sourceRowKey, "DUPLICATE_ROW_KEY");
    duplicate(r => r.sourceExternalId ? canonicalSerialize([r.entityType, r.sourceExternalId]) : undefined, "DUPLICATE_SOURCE_ID");
    duplicate(r => r.entityType === "customer" && r.email ? email(r.email) : undefined, "DUPLICATE_EMAIL");
    duplicate(r => r.entityType === "location" && r.slug ? r.slug : undefined, "DUPLICATE_LOCATION_SLUG");
    const existing = (type: EntityType, id: string) => snapshot.entities.find(e => e.entityType === type && e.id === id);
    const refsFor = (r: ImportRow) => snapshot.sourceRefs.filter(s => s.sourceSystem === normalized.source.sourceSystem && s.sourceAccountKey === normalized.source.sourceAccountKey && s.entityType === r.entityType && s.sourceExternalId === r.sourceExternalId);
    for (const [i, r] of rows.entries()) {
        if ("name" in r && !r.name)
            add(i, "NAME_REQUIRED");
        if (r.entityType === "customer" && (!r.email || !z.email().safeParse(r.email).success))
            add(i, "CUSTOMER_EMAIL_UNSUPPORTED");
        if (r.entityType === "staff" && r.email && !z.email().safeParse(r.email).success)
            add(i, "INVALID_EMAIL");
        if (r.entityType === "location" && r.timezone && !normalizeTimezone(r.timezone))
            add(i, "INVALID_TIMEZONE");
        if (r.entityType === "service") {
            if (!Number.isSafeInteger(r.durationMinutes) || r.durationMinutes <= 0)
                add(i, "INVALID_DURATION");
            if (!money(r.priceCents))
                add(i, "INVALID_MONEY");
            if (!validCurrency(r.currency))
                add(i, "INVALID_CURRENCY");
            if (r.currency !== normalized.target.businessCurrency || r.currency !== normalized.source.sourceCurrency)
                add(i, "CURRENCY_MISMATCH");
        }
        if (r.entityType === "appointment") {
            if (!Object.hasOwn(mapping.statusMapping, r.sourceStatus))
                add(i, "UNMAPPED_STATUS");
            const zone = r.timezone ?? normalized.source.sourceTimezone;
            const a = resolveTimestamp(r.start, zone, r.timezone !== undefined), b = resolveTimestamp(r.end, zone, r.timezone !== undefined);
            if (r.timezone && !normalizeTimezone(r.timezone))
                add(i, "INVALID_TIMEZONE");
            if (a.error)
                add(i, a.error);
            if (b.error)
                add(i, b.error);
            if (a.iso && b.iso) {
                r.start = a.iso;
                r.end = b.iso;
                // The normalized representation uses UTC, including its explicit zone.
                // Validate original offset/zone truth BEFORE normalizing; re-preview is stable.
                if (r.timezone !== undefined) r.timezone = "UTC";
                if (a.iso >= b.iso)
                    add(i, "INVALID_RANGE");
                if (a.iso <= now.iso!)
                    add(i, "NOT_FUTURE");
            }
            const f = r.financials;
            if (f.kind === "UNRECONCILED")
                add(i, "FINANCIAL_RECONCILIATION_REQUIRED", "WARNING", "REVIEW");
            if (f.kind === "EXACT") {
                if (!validCurrency(f.currency))
                    add(i, "INVALID_CURRENCY");
                const amounts = [f.priceCents, f.taxCents, f.discountCents, f.depositCents, f.amountPaidCents, f.amountRefundedCents];
                if (amounts.some(n => !money(n)) || f.discountCents > f.priceCents || f.amountRefundedCents > f.amountPaidCents || !money(f.priceCents - f.discountCents + f.taxCents))
                    add(i, "INVALID_MONEY");
                if (f.currency !== normalized.target.businessCurrency || f.currency !== normalized.source.sourceCurrency) {
                    add(i, "CURRENCY_MISMATCH", "WARNING", "REVIEW");
                    add(i, "FINANCIAL_RECONCILIATION_REQUIRED", "WARNING", "REVIEW");
                }
                // Paid/refunded snapshots need ledger-aware representation in B, not synthetic payments.
                if (f.amountPaidCents > 0 || f.amountRefundedCents > 0 || f.depositCents > f.priceCents - f.discountCents + f.taxCents)
                    add(i, "FINANCIAL_RECONCILIATION_REQUIRED", "WARNING", "REVIEW");
            }
        }
        results[i].sourceRowHash = sourceRowHash(r);
        const prior = r.sourceExternalId ? refsFor(r) : [];
        const explicit = mapping.links.filter(l => rowId(l) === rowId(r));
        if (prior.length > 1 || explicit.length > 1) {
            add(i, "AMBIGUOUS_MATCH", "WARNING", "REVIEW");
            continue;
        }
        if (prior.length && explicit.length && prior[0].chasumEntityId !== explicit[0].existingId) {
            add(i, "IDENTITY_CONFLICT", "WARNING", "REVIEW");
            continue;
        }
        const id = prior[0]?.chasumEntityId ?? explicit[0]?.existingId;
        if (id && r.entityType === "customer" && r.email && snapshot.entities.some(e => e.entityType === "customer" && e.email === r.email && e.id !== id)) {
            add(i, "IDENTITY_CONFLICT", "WARNING", "REVIEW");
            continue;
        }
        if (id) {
            if (!existing(r.entityType, id)) {
                add(i, "MISSING_REFERENCE", "UNRESOLVED_REFERENCE");
                continue;
            }
            setExistingId(i, id);
            if (prior[0] && prior[0].sourceRowHash !== results[i].sourceRowHash)
                add(i, "SOURCE_ID_CHANGED", "WARNING", "REVIEW");
            else
                add(i, prior.length ? "SOURCE_REF_MATCH" : "EXPLICIT_LINK", "DUPLICATE_EXISTING", "LINK_EXISTING");
        }
        else if (r.entityType === "customer" && r.email) {
            const matches = snapshot.entities.filter(e => e.entityType === "customer" && e.email === r.email);
            if (matches.length > 1)
                add(i, "AMBIGUOUS_MATCH", "WARNING", "REVIEW");
            else if (matches.length === 1) {
                setExistingId(i, matches[0].id);
                add(i, "CUSTOMER_EMAIL_MATCH", "DUPLICATE_EXISTING", "LINK_EXISTING");
                if (matches[0].name !== r.name || (matches[0].phone && r.phone && matches[0].phone !== r.phone))
                    add(i, "IDENTITY_CONFLICT", "WARNING", "REVIEW");
            }
        }
        else if ("name" in r) {
            const candidate = snapshot.entities.some(e => e.entityType === r.entityType && (e.name?.toLowerCase() === r.name.toLowerCase() || (r.entityType === "staff" && r.email && e.email === r.email) || (r.entityType === "location" && r.slug && r.slug === e.slug)));
            if (candidate)
                add(i, "EXISTING_CANDIDATE", "WARNING", "REVIEW");
        }
    }
    const usable = (o: RowOutcome) => o.plannedAction === "CREATE" && o.status === "READY" || o.plannedAction === "LINK_EXISTING";
    const resolve = (ref: Reference | undefined, type: IdEntityType): ResolvedReference | null => {
        if (!ref)
            return null;
        if ("existingId" in ref)
            return existing(type, ref.existingId) ? { entityType: type, existingId: ref.existingId } : null;
        const matches = results.filter(o => o.entityType === type && o.sourceRowKey === ref.sourceRowKey);
        if (matches.length !== 1 || !usable(matches[0]))
            return null;
        return matches[0].existingId ? { entityType: type, existingId: matches[0].existingId } : { entityType: type, sourceRowKey: ref.sourceRowKey };
    };
    const token = (r: ResolvedReference) => canonicalSerialize([r.entityType, r.existingId ?? r.sourceRowKey]);
    for (const type of entityTypes) {
        for (const [i, r] of rows.entries()) {
            if (r.entityType !== type)
                continue;
            const deps: Record<string, [
                Reference | undefined,
                IdEntityType
            ]> = {};
            if (r.entityType === "service" || r.entityType === "staff")
                deps.primaryLocation = [r.primaryLocation, "location"];
            if (r.entityType === "serviceLocation") {
                deps.service = [r.service, "service"];
                deps.location = [r.location, "location"];
            }
            if (r.entityType === "staffLocation") {
                deps.staff = [r.staff, "staff"];
                deps.location = [r.location, "location"];
            }
            if (r.entityType === "staffService") {
                deps.staff = [r.staff, "staff"];
                deps.service = [r.service, "service"];
            }
            if (r.entityType === "appointment") {
                deps.location = [r.location, "location"];
                deps.service = [r.service, "service"];
                deps.staff = [r.staff, "staff"];
                deps.customer = [r.customer, "customer"];
            }
            for (const [name, [ref, expected]] of Object.entries(deps)) {
                const resolved = resolve(ref, expected);
                results[i].dependencies[name] = resolved;
                if (!resolved)
                    add(i, ref ? "BLOCKED_PARENT" : "MISSING_REFERENCE", "UNRESOLVED_REFERENCE");
            }
        }
        if (assignmentTypes.includes(type as typeof assignmentTypes[number])) {
            const pairs = new Map<string, number[]>();
            for (const [i, r] of rows.entries())
                if (r.entityType === type) {
                    const dep = results[i].dependencies;
                    if (Object.values(dep).some(x => !x))
                        continue;
                    const pair = canonicalSerialize(Object.fromEntries(Object.entries(dep).map(([k, v]) => [k, token(v!)])));
                    pairs.set(pair, [...(pairs.get(pair) ?? []), i]);
                    const match = snapshot.assignments.some(e => e.entityType === type && Object.entries(dep).every(([k, v]) => v?.existingId === endpoints(e)[k]));
                    if (match) {
                        add(i, "ASSIGNMENT_EXISTS", "DUPLICATE_EXISTING", "SKIP");
                    }
                }
            for (const indices of pairs.values())
                if (indices.length > 1)
                    indices.forEach(i => add(i, "DUPLICATE_ASSIGNMENT", "DUPLICATE_IN_FILE"));
        }
    }
    const hasAssignment = (type: EntityType, a: ResolvedReference, b: ResolvedReference) => {
        const names = type === "staffService" ? ["staff", "service"] : type === "staffLocation" ? ["staff", "location"] : ["service", "location"];
        return snapshot.assignments.some(e => e.entityType === type && a.existingId && b.existingId && endpoints(e)[names[0]] === a.existingId && endpoints(e)[names[1]] === b.existingId) || results.some(o => o.entityType === type && usable(o) && o.dependencies[names[0]] && o.dependencies[names[1]] && token(o.dependencies[names[0]]!) === token(a) && token(o.dependencies[names[1]]!) === token(b));
    };
    const atLocation = (entity: ResolvedReference, loc: ResolvedReference) => {
        const primary = entity.existingId ? existing(entity.entityType, entity.existingId)?.primaryLocationId : undefined;
        const planned = results.find(o => o.entityType === entity.entityType && o.sourceRowKey === entity.sourceRowKey)?.dependencies.primaryLocation;
        return primary && loc.existingId === primary || planned && token(planned) === token(loc) || hasAssignment(entity.entityType === "staff" ? "staffLocation" : "serviceLocation", entity, loc);
    };
    for (const [i, r] of rows.entries())
        if (r.entityType === "appointment") {
            const { staff, service, location } = results[i].dependencies;
            if (staff && service && location && (!atLocation(staff, location) || !atLocation(service, location) || !hasAssignment("staffService", staff, service)))
                add(i, "ASSIGNMENT_REQUIRED", "UNRESOLVED_REFERENCE");
        }
    // Existing snapshot collisions are independent of in-file eligibility.
    for (const [i, r] of rows.entries())
        if (r.entityType === "appointment") {
            const { staff } = results[i].dependencies;
            const mapped = mapping.statusMapping[r.sourceStatus];
            const active = mapped && !["cancelled"].includes(mapped);
            if (active && staff) {
                const overlaps = snapshot.entities.some(e => e.entityType === "appointment" && e.id !== results[i].existingId && e.staffId === staff.existingId && !["cancelled"].includes(e.status!) && r.start < e.end! && e.start! < r.end);
                if (overlaps)
                    add(i, "APPOINTMENT_OVERLAP", "WARNING", "REVIEW");
            }
        }
    // Freeze the operational write set before warning either side of a collision.
    // Invalid, unresolved, review-only and existing-link rows cannot create new occupancy.
    const eligible = rows.map((r, i) => r.entityType === "appointment" && results[i].status === "READY" && results[i].plannedAction === "CREATE" && mapping.statusMapping[r.sourceStatus] !== "cancelled");
    for (const [i, r] of rows.entries()) {
        if (!eligible[i] || r.entityType !== "appointment") continue;
        const staff = results[i].dependencies.staff!;
        const inFile = rows.some((other, j) => j !== i && eligible[j] && other.entityType === "appointment" && token(results[j].dependencies.staff!) === token(staff) && r.start < other.end && other.start < r.end);
        if (inFile) add(i, "APPOINTMENT_OVERLAP", "WARNING", "REVIEW");
    }
    for (const o of results)
        o.reasonCodes = [...new Set(o.reasonCodes)].sort();
    normalized.rows = unordered(rows);
    const outcomes = unordered(results);
    const snapshotHash = hash({ ...snapshot, entities: unordered(snapshot.entities), assignments: unordered(snapshot.assignments), sourceRefs: unordered(snapshot.sourceRefs) });
    const counts: Preview["counts"] = { READY: 0, WARNING: 0, DUPLICATE_EXISTING: 0, DUPLICATE_IN_FILE: 0, INVALID: 0, UNRESOLVED_REFERENCE: 0, SKIPPED: 0 };
    outcomes.forEach(o => counts[o.status]++);
    // asOf changes only eligibility outcomes, not the hash when reviewed truth is unchanged.
    const { sourceLabel: _label, ...source } = normalized.source;
    void _label;
    const previewHash = hash({ version: "1", normalized: { ...normalized, source }, mapping: { ...mapping, links: unordered(mapping.links) }, snapshotHash, outcomes });
    return { version: "1", previewHash, snapshotHash, normalized, outcomes, counts };
}
