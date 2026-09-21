// @vitest-environment node
import { describe, expect, it } from "vitest";
import { previewImport, sourceRowHash } from "@/lib/imports/preview";
import { canonicalSerialize } from "@/lib/imports/hash";
import { resolveTimestamp } from "@/lib/imports/timezone";
import type { CanonicalPayload, ImportRow, MappingConfig, TargetSnapshot } from "@/lib/imports/contracts";
const business = "11111111-1111-4111-8111-111111111111", id = "22222222-2222-4222-8222-222222222222";
const ref = (sourceRowKey: string) => ({ sourceRowKey });
const customer: ImportRow = { entityType: "customer", sourceRowKey: "customer-1", name: "Synthetic Person", email: "person@example.test" };
function fixture() {
    const payload: CanonicalPayload = { source: { schemaVersion: "1", sourceSystem: "fixture", sourceAccountKey: "workspace-1", sourceTimezone: "America/Toronto", sourceCurrency: "cad", inputChecksum: "a".repeat(64) }, target: { businessId: business, businessTimezone: "America/Toronto", businessCurrency: "CAD" }, rows: [
            { entityType: "location", sourceRowKey: "location-1", name: "Synthetic location" },
            { entityType: "service", sourceRowKey: "service-1", name: "Synthetic service", durationMinutes: 30, priceCents: 2500, currency: "CAD", primaryLocation: ref("location-1") },
            { entityType: "staff", sourceRowKey: "staff-1", name: "Synthetic staff", primaryLocation: ref("location-1") },
            { entityType: "staffService", sourceRowKey: "assignment-1", staff: ref("staff-1"), service: ref("service-1") },
            customer,
            { entityType: "appointment", sourceRowKey: "appointment-1", location: ref("location-1"), service: ref("service-1"), staff: ref("staff-1"), customer: ref("customer-1"), start: "2027-01-20T12:30", end: "2027-01-20T13:00", sourceStatus: "booked", financials: { kind: "NONE" } },
        ] };
    const snapshot: TargetSnapshot = { businessId: business, entities: [], sourceRefs: [] };
    const mapping: MappingConfig = { version: "1", statusMapping: { booked: "confirmed" }, links: [] };
    return { payload: structuredClone(payload), snapshot, mapping };
}
const run = (f = fixture()) => previewImport(f.payload, f.snapshot, f.mapping, "2026-09-21T00:00:00Z");
const row = (p: ReturnType<typeof run>, key = "customer-1") => p.outcomes.find(o => o.sourceRowKey === key)!;
function change(key: string, update: Record<string, unknown>) { const f = fixture(); Object.assign(f.payload.rows.find(r => r.sourceRowKey === key)!, update); return f; }
describe("pure import preview", () => {
    it("resolves same-payload dependencies without writes", () => { const p = run(); expect(p.counts.READY).toBe(6); expect(row(p, "appointment-1").dependencies.staff).toEqual({ entityType: "staff", sourceRowKey: "staff-1" }); });
    it.each(["sourceAccountKey", "sourceSystem", "inputChecksum"])("requires source %s", field => { const f = fixture(); delete (f.payload.source as unknown as Record<string, unknown>)[field]; expect(() => run(f)).toThrow("INVALID_ROOT"); });
    it("requires target Business", () => { const f = fixture(); f.payload.target.businessId = ""; expect(() => run(f)).toThrow("INVALID_ROOT"); });
    it("normalizes currency and email", () => { const p = run(change("customer-1", { email: " Person@Example.Test " })); expect(p.normalized.source.sourceCurrency).toBe("CAD"); expect(p.normalized.rows.find(r => r.entityType === "customer")).toMatchObject({ email: "person@example.test" }); });
    it.each([undefined, "", "bad-email"])("rejects unsupported email %s", email => { const p = run(change("customer-1", { email })); expect(row(p).reasonCodes).toContain("CUSTOMER_EMAIL_UNSUPPORTED"); expect(row(p, "appointment-1").status).toBe("UNRESOLVED_REFERENCE"); expect(JSON.stringify(p)).not.toContain("chasum.local"); });
    it("links exact existing customer email", () => { const f = fixture(); f.snapshot.entities.push({ id, businessId: business, entityType: "customer", version: "1", name: customer.name, email: "PERSON@example.test" }); expect(row(run(f)).plannedAction).toBe("LINK_EXISTING"); });
    it("conflicting identity blocks downstream resolution", () => { const f = fixture(); f.snapshot.entities.push({ id, businessId: business, entityType: "customer", version: "1", name: "Different person", email: "person@example.test" }); const p = run(f); expect(row(p).reasonCodes).toContain("IDENTITY_CONFLICT"); expect(row(p, "appointment-1").plannedAction).toBe("BLOCK"); });
    it.each(["staff", "service", "location"] as const)("name alone cannot auto-link %s", type => { const f = fixture(); const source = f.payload.rows.find(r => r.entityType === type)!; f.snapshot.entities.push({ id, businessId: business, entityType: type, version: "1", name: "name" in source ? source.name : "" }); expect(row(run(f), source.sourceRowKey).plannedAction).toBe("REVIEW"); });
    it("staff email is candidate only", () => { const f = change("staff-1", { email: "shared@example.test" }); f.snapshot.entities.push({ id, businessId: business, entityType: "staff", version: "1", email: "shared@example.test" }); expect(row(run(f), "staff-1").plannedAction).toBe("REVIEW"); });
    it.each([0, -1, 0.5])("rejects duration %s", durationMinutes => expect(row(run(change("service-1", { durationMinutes })), "service-1").reasonCodes).toContain("INVALID_DURATION"));
    it("blocks service currency mismatch", () => expect(row(run(change("service-1", { currency: "USD" })), "service-1").reasonCodes).toContain("CURRENCY_MISMATCH"));
    it.each(["staff", "service", "customer", "location"])("appointment requires %s", field => expect(row(run(change("appointment-1", { [field]: undefined })), "appointment-1").status).toBe("UNRESOLVED_REFERENCE"));
    it("assignment requires parents", () => expect(row(run(change("assignment-1", { staff: ref("missing") })), "assignment-1").status).toBe("UNRESOLVED_REFERENCE"));
    it("duplicate assignments block all copies", () => { const f = fixture(); f.payload.rows.push({ ...f.payload.rows[3], sourceRowKey: "assignment-2" }); const p = run(f); expect(row(p, "assignment-1").status).toBe("DUPLICATE_IN_FILE"); expect(row(p, "assignment-2").status).toBe("DUPLICATE_IN_FILE"); expect(row(p, "appointment-1").reasonCodes).toContain("ASSIGNMENT_REQUIRED"); });
    it.each(["sourceRowKey", "sourceExternalId", "email"])("detects in-file duplicate %s without choosing first", field => { const f = fixture(); if (field === "sourceExternalId")
        Object.assign(f.payload.rows[4], { sourceExternalId: "external-1" }); f.payload.rows.push({ ...f.payload.rows[4], sourceRowKey: field === "sourceRowKey" ? "customer-1" : "customer-2" }); const p = run(f); expect(p.outcomes.filter(o => o.entityType === "customer").every(o => o.status === "DUPLICATE_IN_FILE")).toBe(true); });
    it("unmapped status blocks", () => expect(row(run(change("appointment-1", { sourceStatus: "surprise" })), "appointment-1").reasonCodes).toContain("UNMAPPED_STATUS"));
    it("does not accept past appointments", () => expect(row(run(change("appointment-1", { start: "2020-01-01T12:00Z", end: "2020-01-01T13:00Z" })), "appointment-1").reasonCodes).toContain("NOT_FUTURE"));
    it("checks assignment truth", () => { const f = fixture(); f.payload.rows = f.payload.rows.filter(r => r.entityType !== "staffService"); expect(row(run(f), "appointment-1").reasonCodes).toContain("ASSIGNMENT_REQUIRED"); });
    it("detects intra-file overlaps", () => { const f = fixture(); f.payload.rows.push({ ...f.payload.rows[5], sourceRowKey: "appointment-2" }); expect(row(run(f), "appointment-1").reasonCodes).toContain("APPOINTMENT_OVERLAP"); });
    it("rejects foreign snapshot", () => { const f = fixture(); f.snapshot.entities.push({ id, businessId: id, entityType: "customer", version: "1" }); expect(() => run(f)).toThrow("TARGET_MISMATCH"); });
    it("rejects malformed snapshot appointment", () => { const f = fixture(); f.snapshot.entities.push({ id, businessId: business, entityType: "appointment", version: "1" }); expect(() => run(f)).toThrow("INVALID_SNAPSHOT"); });
    it("source refs use account and business namespace", () => { const f = change("customer-1", { sourceExternalId: "source-1" }); f.snapshot.entities.push({ id, businessId: business, entityType: "customer", version: "1" }); f.snapshot.sourceRefs.push({ businessId: business, sourceSystem: "fixture", sourceAccountKey: "workspace-1", entityType: "customer", sourceExternalId: "source-1", sourceRowHash: sourceRowHash(f.payload.rows[4]), chasumEntityId: id }); expect(row(run(f)).plannedAction).toBe("LINK_EXISTING"); f.snapshot.sourceRefs[0].sourceAccountKey = "different"; expect(row(run(f)).plannedAction).toBe("CREATE"); });
    it("changed source hash requires review", () => { const f = change("staff-1", { sourceExternalId: "source-1" }); f.snapshot.entities.push({ id, businessId: business, entityType: "staff", version: "1" }); f.snapshot.sourceRefs.push({ businessId: business, sourceSystem: "fixture", sourceAccountKey: "workspace-1", entityType: "staff", sourceExternalId: "source-1", sourceRowHash: "0".repeat(64), chasumEntityId: id }); expect(row(run(f), "staff-1").reasonCodes).toContain("SOURCE_ID_CHANGED"); });
    it("durable outcomes exclude raw PII", () => { const p = run(); const s = JSON.stringify(p.outcomes); expect(s).not.toContain("person@example.test"); expect(s).not.toContain("Synthetic Person"); });
    it("does not mutate input", () => { const f = fixture(); const before = structuredClone(f); run(f); expect(f).toEqual(before); });
});
describe("timezone truth", () => {
    it.each([
        ["2027-01-20T12:30", "2027-01-20T17:30:00.000Z"],
        ["2027-11-07T01:30-04:00", "2027-11-07T05:30:00.000Z"],
        ["2027-11-07T01:30-05:00", "2027-11-07T06:30:00.000Z"],
    ])("resolves %s explicitly", (value, iso) => expect(resolveTimestamp(value, "America/Toronto")).toEqual({ iso }));
    it.each([
        ["2027-03-14T02:30", "DST_NONEXISTENT"], ["2027-11-07T01:30", "DST_AMBIGUOUS"],
        ["2027-02-30T12:00", "INVALID_TIMESTAMP"], ["2027-01-20", "INVALID_TIMESTAMP"], ["2027-01-20T25:00", "INVALID_TIMESTAMP"],
    ])("rejects ambiguous/invalid %s", (value, error) => expect(resolveTimestamp(value, "America/Toronto")).toEqual({ error }));
});
const exact = { kind: "EXACT" as const, currency: "CAD", priceCents: 1800, taxCents: 234, discountCents: 0, depositCents: 500, amountPaidCents: 0, amountRefundedCents: 0 };
describe("financial truth", () => {
    it("preserves exact money independently of current service price", () => { const p = run(change("appointment-1", { financials: exact })); expect(row(p, "appointment-1").status).toBe("READY"); expect(p.normalized.rows.find(r => r.entityType === "appointment")).toMatchObject({ financials: exact }); });
    it.each([{ kind: "UNRECONCILED" }, { ...exact, currency: "USD" }, { ...exact, amountPaidCents: 500 }])("requires explicit reconciliation %j", financials => expect(row(run(change("appointment-1", { financials })), "appointment-1").reasonCodes).toContain("FINANCIAL_RECONCILIATION_REQUIRED"));
    it.each([-1, 0.5, Number.MAX_SAFE_INTEGER])("rejects invalid amount %s", priceCents => expect(row(run(change("appointment-1", { financials: { ...exact, priceCents } })), "appointment-1").reasonCodes).toContain("INVALID_MONEY"));
    it("missing financial state is never defaulted", () => expect(() => run(change("appointment-1", { financials: undefined }))).toThrow("INVALID_ROOT"));
});
describe("hash contract", () => {
    it("ignores object order and unordered collections", () => { const f = fixture(), p = run(f); f.payload.rows.reverse(); const reversed = JSON.parse(JSON.stringify(f.payload, (k, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).reverse()) : v)); expect(previewImport(reversed, f.snapshot, f.mapping, "2026-09-22T00:00:00Z").previewHash).toBe(p.previewHash); });
    it("stable on repeat", () => expect(run()).toEqual(run()));
    it.each(["input", "account", "business", "mapping", "status", "snapshot"])("binds material %s change", field => {
        const f = fixture(), old = run(f).previewHash;
        if (field === "input")
            Object.assign(f.payload.rows[4], { name: "Changed" });
        if (field === "account")
            f.payload.source.sourceAccountKey = "other";
        if (field === "business") {
            f.payload.target.businessId = id;
            f.snapshot.businessId = id;
        }
        if (field === "mapping")
            f.mapping.version = "2";
        if (field === "status")
            f.mapping.statusMapping.booked = "pending";
        if (field === "snapshot")
            f.snapshot.entities.push({ id, businessId: business, entityType: "location", version: "2", name: "Other" });
        expect(run(f).previewHash).not.toBe(old);
    });
    it("rejects nonfinite serialization", () => expect(() => canonicalSerialize(NaN)).toThrow());
});
describe("resolved target truth", () => {
    it("staff authoritative source ref supports existing dependencies", () => {
        const f = change("staff-1", { sourceExternalId: "staff-external" });
        f.snapshot.entities.push({ id, businessId: business, entityType: "staff", version: "1" });
        f.snapshot.sourceRefs.push({ businessId: business, sourceSystem: "fixture", sourceAccountKey: "workspace-1", entityType: "staff", sourceExternalId: "staff-external", sourceRowHash: sourceRowHash(f.payload.rows[2]), chasumEntityId: id });
        const p = run(f);
        expect(row(p, "staff-1").plannedAction).toBe("LINK_EXISTING");
        expect(row(p, "appointment-1").dependencies.staff?.existingId).toBe(id);
    });
    it("existing appointment overlap warns and adjacent intervals do not", () => {
        const f = change("staff-1", { sourceExternalId: "staff-external" });
        f.snapshot.entities.push({ id, businessId: business, entityType: "staff", version: "1" });
        f.snapshot.sourceRefs.push({ businessId: business, sourceSystem: "fixture", sourceAccountKey: "workspace-1", entityType: "staff", sourceExternalId: "staff-external", sourceRowHash: sourceRowHash(f.payload.rows[2]), chasumEntityId: id });
        f.snapshot.entities.push({ id: "33333333-3333-4333-8333-333333333333", businessId: business, entityType: "appointment", version: "1", staffId: id, start: "2027-01-20T17:45:00Z", end: "2027-01-20T18:15:00Z", status: "confirmed" });
        expect(row(run(f), "appointment-1").reasonCodes).toContain("APPOINTMENT_OVERLAP");
        f.snapshot.entities[1].start = "2027-01-20T18:00:00Z";
        expect(row(run(f), "appointment-1").reasonCodes).not.toContain("APPOINTMENT_OVERLAP");
    });
    it("canonical normalized timestamps can be previewed again", () => {
        const f = fixture(), p = run(f);
        expect(previewImport(p.normalized, f.snapshot, f.mapping, "2026-09-21T00:00:00Z").previewHash).toBe(p.previewHash);
    });
    it("assignment duplicates recognize source and explicit-existing aliases", () => {
        const f = fixture();
        f.snapshot.entities.push({ id, businessId: business, entityType: "staff", version: "1" });
        f.mapping.links.push({ entityType: "staff", sourceRowKey: "staff-1", existingId: id });
        f.payload.rows.push({ entityType: "staffService", sourceRowKey: "assignment-2", staff: { existingId: id }, service: ref("service-1") });
        expect(row(run(f), "assignment-1").reasonCodes).toContain("DUPLICATE_ASSIGNMENT");
    });
    it("unresolved location assignment blocks its row", () => {
        const f = fixture();
        f.payload.rows.push({ entityType: "serviceLocation", sourceRowKey: "sl-1", service: ref("service-1"), location: ref("missing") });
        expect(row(run(f), "sl-1").status).toBe("UNRESOLVED_REFERENCE");
    });
    it("source ref and email cannot link different customers", () => {
        const f = change("customer-1", { sourceExternalId: "customer-external" });
        f.snapshot.entities.push({ id, businessId: business, entityType: "customer", version: "1" }, { id: "33333333-3333-4333-8333-333333333333", businessId: business, entityType: "customer", version: "1", email: "person@example.test" });
        f.snapshot.sourceRefs.push({ businessId: business, sourceSystem: "fixture", sourceAccountKey: "workspace-1", entityType: "customer", sourceExternalId: "customer-external", sourceRowHash: sourceRowHash(f.payload.rows[4]), chasumEntityId: id });
        expect(row(run(f)).plannedAction).toBe("REVIEW");
    });
    it("snapshot version changes bind hash", () => {
        const f = fixture();
        f.snapshot.entities.push({ id, businessId: business, entityType: "location", version: "1" });
        const old = run(f).previewHash;
        f.snapshot.entities[0].version = "2";
        expect(run(f).previewHash).not.toBe(old);
    });
    it("UI source label does not affect hash", () => {
        const f = fixture(), old = run(f).previewHash;
        f.payload.source.sourceLabel = "Display only";
        expect(run(f).previewHash).toBe(old);
    });
    it("unknown canonical fields fail closed", () => expect(() => run(change("customer-1", { businessId: id }))).toThrow("INVALID_ROOT"));
});
it("duplicate location slug blocks both creates", () => {
    const f = change("location-1", { slug: "main" });
    f.payload.rows.push({ entityType: "location", sourceRowKey: "location-2", slug: "main", name: "Other location" });
    expect(row(run(f), "location-1").reasonCodes).toContain("DUPLICATE_LOCATION_SLUG");
});
it("rejects currencies outside the current cents model", () => {
    const f = fixture(); f.payload.source.sourceCurrency = "JPY";
    expect(() => run(f)).toThrow("INVALID_CURRENCY");
});
it("repeated external ID is detected independently of email", () => {
    const f = change("customer-1", { sourceExternalId: "external" });
    f.payload.rows.push({ ...customer, sourceRowKey: "customer-2", sourceExternalId: "external", email: "different@example.test" });
    expect(row(run(f)).reasonCodes).toContain("DUPLICATE_SOURCE_ID");
});
it("conflicting known customer phone requires review", () => {
    const f = change("customer-1", { phone: "5550100" });
    f.snapshot.entities.push({ id, businessId: business, entityType: "customer", version: "1", name: "Synthetic Person", email: "person@example.test", phone: "5550199" });
    expect(row(run(f)).reasonCodes).toContain("IDENTITY_CONFLICT");
});
