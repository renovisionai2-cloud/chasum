import { z } from "zod";
import { C2_REVIEW_SCHEMA_VERSION } from "./c2-contract";
import { csvAdapterConfigSchema } from "./csv-adapter";
import {
  assignmentTypes,
  idEntityTypes,
  mappingSchema,
  payloadSchema,
  reasonCodes,
  rowSchema,
  runStates,
  statuses,
} from "./contracts";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const key = z.string().trim().min(1).max(200);
const outcomeStatuses = [
  "READY",
  "WARNING",
  "DUPLICATE_EXISTING",
  "DUPLICATE_IN_FILE",
  "INVALID",
  "UNRESOLVED_REFERENCE",
  "SKIPPED",
] as const;
const plannedActions = ["CREATE", "LINK_EXISTING", "SKIP", "BLOCK", "REVIEW"] as const;

const resolvedReferenceSchema = z.object({
  entityType: z.enum(idEntityTypes),
  sourceRowKey: key.optional(),
  existingId: z.uuid().optional(),
}).strict();

const outcomeFields = {
  sourceRowKey: key,
  sourceExternalId: key.optional(),
  sourceRowHash: sha,
  status: z.enum(outcomeStatuses),
  plannedAction: z.enum(plannedActions),
  reasonCodes: z.array(z.enum(reasonCodes)).max(40),
  dependencies: z.record(z.string(), resolvedReferenceSchema.nullable()),
};

export const c3RowOutcomeSchema = z.union([
  z.object({ ...outcomeFields, entityType: z.enum(idEntityTypes), existingId: z.uuid().optional() }).strict(),
  z.object({ ...outcomeFields, entityType: z.enum(assignmentTypes) }).strict(),
]);

export const c3OperationalRowSchema = z.object({
  row: rowSchema,
  outcome: c3RowOutcomeSchema,
  mappedStatus: z.enum(statuses).optional(),
}).strict();

const previewSchema = z.object({
  version: z.literal("1"),
  previewHash: sha,
  snapshotHash: sha,
  normalized: payloadSchema,
  outcomes: z.array(c3RowOutcomeSchema).max(5000),
  counts: z.record(z.enum(outcomeStatuses), z.number().int().nonnegative()),
}).strict();

export const c3ReviewedEnvelopeSchema = z.object({
  schemaVersion: z.literal(C2_REVIEW_SCHEMA_VERSION),
  review: z.object({
    runId: z.uuid(),
    previewHash: sha,
    snapshotHash: sha,
    commitGuardHash: sha,
  }).strict(),
  mapping: mappingSchema,
  adapter: csvAdapterConfigSchema,
  preview: previewSchema,
  rows: z.array(c3OperationalRowSchema).max(5000),
  locationSlugs: z.array(z.string().trim().min(1).max(200)).max(5000),
}).strict();

export type C3ReviewedEnvelope = z.infer<typeof c3ReviewedEnvelopeSchema>;
export const c3RunStateSchema = z.enum(runStates);
export type C3RunState = z.infer<typeof c3RunStateSchema>;

export const c3CommitResultSchema = z.enum(["CREATED", "LINKED", "SKIPPED", "BLOCKED"]);
export type C3CommitResult = z.infer<typeof c3CommitResultSchema>;
