import { z } from "zod";
export const entityTypes = ["location", "service", "staff", "serviceLocation", "staffLocation", "staffService", "customer", "appointment"] as const;
export type EntityType = typeof entityTypes[number];
export const idEntityTypes = ["location", "service", "staff", "customer", "appointment"] as const;
export type IdEntityType = typeof idEntityTypes[number];
export const assignmentTypes = ["serviceLocation", "staffLocation", "staffService"] as const;
export type AssignmentEntityType = typeof assignmentTypes[number];
export const statuses = ["pending", "confirmed", "arrived", "waiting", "in_progress", "cancelled", "completed", "no_show"] as const;
export const runStates = ["uploaded", "previewed", "committing", "completed", "completed_with_errors", "failed", "cancelled"] as const;
const text = z.string().trim();
const key = text.min(1).max(200);
export const referenceSchema = z.union([
    z.object({ sourceRowKey: key }).strict(),
    z.object({ existingId: z.uuid() }).strict(),
]);
export type Reference = z.infer<typeof referenceSchema>;
const identity = { sourceRowKey: key, sourceExternalId: key.optional() };
// Numeric/domain validation belongs to row outcomes, not a coercing parser.
// EXACT price is pre-discount, tax-exclusive minor units; no inferred tax semantics.
const financialSchema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("NONE") }).strict(),
    z.object({ kind: z.literal("UNRECONCILED") }).strict(),
    z.object({ kind: z.literal("EXACT"), currency: text, priceCents: z.number(), taxCents: z.number(), discountCents: z.number(), depositCents: z.number(), amountPaidCents: z.number(), amountRefundedCents: z.number() }).strict(),
]);
export const rowSchema = z.discriminatedUnion("entityType", [
    z.object({ ...identity, entityType: z.literal("location"), name: text, slug: text.optional(), timezone: text.optional(), address: text.optional(), phone: text.optional() }).strict(),
    z.object({ ...identity, entityType: z.literal("service"), name: text, durationMinutes: z.number(), priceCents: z.number(), currency: text, primaryLocation: referenceSchema.optional() }).strict(),
    z.object({ ...identity, entityType: z.literal("staff"), name: text, email: text.optional(), phone: text.optional(), primaryLocation: referenceSchema.optional() }).strict(),
    z.object({ ...identity, entityType: z.literal("customer"), name: text, email: text.optional(), phone: text.optional() }).strict(),
    z.object({ ...identity, entityType: z.literal("serviceLocation"), service: referenceSchema, location: referenceSchema }).strict(),
    z.object({ ...identity, entityType: z.literal("staffLocation"), staff: referenceSchema, location: referenceSchema }).strict(),
    z.object({ ...identity, entityType: z.literal("staffService"), staff: referenceSchema, service: referenceSchema }).strict(),
    z.object({ ...identity, entityType: z.literal("appointment"), location: referenceSchema.optional(), service: referenceSchema.optional(), staff: referenceSchema.optional(), customer: referenceSchema.optional(), start: text, end: text, timezone: text.optional(), sourceStatus: text, financials: financialSchema, notes: text.optional() }).strict(),
]);
export type ImportRow = z.infer<typeof rowSchema>;
// inputChecksum is supplied source metadata, not authentication or proof of bytes.
// Future upload server computes it from received bytes; B binds it during recomputation.
export const payloadSchema = z.object({
    source: z.object({ schemaVersion: z.literal("1"), sourceSystem: key, sourceAccountKey: key, sourceLabel: text.optional(), sourceTimezone: text, sourceCurrency: text, inputChecksum: z.string().regex(/^[a-fA-F0-9]{64}$/) }).strict(),
    target: z.object({ businessId: z.uuid(), businessTimezone: text, businessCurrency: text }).strict(),
    rows: z.array(rowSchema).max(5000),
}).strict();
export type CanonicalPayload = z.infer<typeof payloadSchema>;
export const mappingSchema = z.object({
    version: key,
    statusMapping: z.record(z.string(), z.enum(statuses)),
    links: z.array(z.object({ entityType: z.enum(idEntityTypes), sourceRowKey: key, existingId: z.uuid() }).strict()),
}).strict();
export type MappingConfig = z.infer<typeof mappingSchema>;
export const assignmentSchema = z.discriminatedUnion("entityType", [
    z.object({ entityType: z.literal("serviceLocation"), serviceId: z.uuid(), locationId: z.uuid() }).strict(),
    z.object({ entityType: z.literal("staffLocation"), staffId: z.uuid(), locationId: z.uuid() }).strict(),
    z.object({ entityType: z.literal("staffService"), staffId: z.uuid(), serviceId: z.uuid() }).strict(),
]);
export type TargetAssignment = z.infer<typeof assignmentSchema>;
export const snapshotSchema = z.object({
    businessId: z.uuid(),
    entities: z.array(z.object({
        id: z.uuid(), businessId: z.uuid(), entityType: z.enum(idEntityTypes), version: key,
        name: text.optional(), email: text.optional(), phone: text.optional(), slug: text.optional(), address: text.optional(),
        primaryLocationId: z.uuid().optional(), durationMinutes: z.number().optional(), priceCents: z.number().optional(),
        start: text.optional(), end: text.optional(), staffId: z.uuid().optional(), status: z.enum(statuses).optional(),
    }).strict()),
    assignments: z.array(assignmentSchema),
    // Option A: durable UUID source refs exclude composite assignments.
    sourceRefs: z.array(z.object({ businessId: z.uuid(), sourceSystem: key, sourceAccountKey: key, entityType: z.enum(idEntityTypes), sourceExternalId: key, sourceRowHash: z.string().regex(/^[a-f0-9]{64}$/), chasumEntityId: z.uuid() }).strict()),
}).strict();
export type TargetSnapshot = z.infer<typeof snapshotSchema>;
export const reasonCodes = ["INVALID_ROOT", "INVALID_ROW", "INVALID_SNAPSHOT", "TARGET_MISMATCH", "NAME_REQUIRED", "CUSTOMER_EMAIL_UNSUPPORTED", "INVALID_EMAIL", "INVALID_DURATION", "INVALID_MONEY", "INVALID_CURRENCY", "CURRENCY_MISMATCH", "INVALID_TIMEZONE", "INVALID_TIMESTAMP", "DST_NONEXISTENT", "DST_AMBIGUOUS", "NOT_FUTURE", "INVALID_RANGE", "UNMAPPED_STATUS", "FINANCIAL_RECONCILIATION_REQUIRED", "DUPLICATE_ROW_KEY", "DUPLICATE_SOURCE_ID", "DUPLICATE_EMAIL", "DUPLICATE_LOCATION_SLUG", "DUPLICATE_ASSIGNMENT", "MISSING_REFERENCE", "BLOCKED_PARENT", "SOURCE_REF_MATCH", "SOURCE_ID_CHANGED", "EXPLICIT_LINK", "CUSTOMER_EMAIL_MATCH", "IDENTITY_CONFLICT", "EXISTING_CANDIDATE", "AMBIGUOUS_MATCH", "ASSIGNMENT_EXISTS", "ASSIGNMENT_REQUIRED", "APPOINTMENT_OVERLAP"] as const;
export type ReasonCode = typeof reasonCodes[number];
export type OutcomeStatus = "READY" | "WARNING" | "DUPLICATE_EXISTING" | "DUPLICATE_IN_FILE" | "INVALID" | "UNRESOLVED_REFERENCE" | "SKIPPED";
export type PlannedAction = "CREATE" | "LINK_EXISTING" | "SKIP" | "BLOCK" | "REVIEW";
export type ResolvedReference = {
    entityType: IdEntityType;
    sourceRowKey?: string;
    existingId?: string;
};
/** Pseudonymous locators/hashes still require access control; never retain raw PII here. */
interface OutcomeFields {
    sourceRowKey: string;
    sourceExternalId?: string;
    sourceRowHash: string;
    status: OutcomeStatus;
    plannedAction: PlannedAction;
    reasonCodes: ReasonCode[];
    dependencies: Record<string, ResolvedReference | null>;
}
export type RowOutcome = OutcomeFields & (
    { entityType: IdEntityType; existingId?: string } |
    { entityType: AssignmentEntityType; existingId?: never }
);
export interface Preview {
    version: "1";
    previewHash: string;
    snapshotHash: string;
    normalized: CanonicalPayload;
    outcomes: RowOutcome[];
    counts: Record<OutcomeStatus, number>;
}
