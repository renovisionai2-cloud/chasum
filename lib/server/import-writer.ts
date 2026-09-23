import "server-only";

import { z } from "zod";
import { resolveBusinessForUser } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { payloadSchema, snapshotSchema } from "@/lib/imports/contracts";
import { buildOperationalPlan, type OperationalRow } from "@/lib/imports/operational-plan";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const reviewSchema = z.object({
  runId: z.uuid(), previewHash: sha, snapshotHash: sha, commitGuardHash: sha,
}).strict();
export type ImportReview = z.infer<typeof reviewSchema>;
const contextSchema = z.object({
  business: z.object({ id: z.uuid(), timezone: z.string(), currency: z.string(), planKey: z.string() }),
  capacity: z.object({ maxLocations: z.number().int().nullable(), maxStaff: z.number().int().nullable(), activeLocations: z.number().int(), activeStaff: z.number().int() }),
  snapshot: snapshotSchema,
  fingerprint: sha,
});

export class GovernedImportError extends Error {
  constructor(public readonly code: "OWNER_REQUIRED" | "REPREVIEW_REQUIRED" | "LEASE_UNAVAILABLE" | "UNAVAILABLE" | "INVALID_INPUT") {
    super({
      OWNER_REQUIRED: "Only the primary business owner can commit an import.",
      REPREVIEW_REQUIRED: "Business data or the reviewed import has changed. Review a fresh preview before importing.",
      LEASE_UNAVAILABLE: "This import is active in another session or its lease has expired. Resume it after the active lease ends.",
      UNAVAILABLE: "The import could not continue. Keep the reviewed source and retry this run; committed rows are protected from duplication.",
      INVALID_INPUT: "The import source or review is invalid. Prepare a fresh preview.",
    }[code]);
  }
}
function rpcError(error: { message: string } | null): void {
  if (!error) return;
  if (/IMPORT_OWNER_REQUIRED|IMPORT_RUN_AUTHORITY/.test(error.message)) throw new GovernedImportError("OWNER_REQUIRED");
  if (/IMPORT_REPREVIEW_REQUIRED|IMPORT_ROW_NOT_REVIEWED/.test(error.message)) throw new GovernedImportError("REPREVIEW_REQUIRED");
  if (/IMPORT_LEASE_LOST|IMPORT_RUN_NOT_CLAIMABLE/.test(error.message)) throw new GovernedImportError("LEASE_UNAVAILABLE");
  // Never log or return database errors, row contents, contact data or credentials.
  throw new GovernedImportError("UNAVAILABLE");
}

/** Uncached session verification on EVERY entry, including batch and finish. */
async function ownerContext() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) throw new GovernedImportError("OWNER_REQUIRED");
  const business = await resolveBusinessForUser(user.id);
  if (!business || business.owner_id !== user.id) throw new GovernedImportError("OWNER_REQUIRED");
  return { actor: user.id, businessId: business.id, service: createServiceClient() };
}
async function currentPlan(input: unknown, mapping: unknown) {
  const auth = await ownerContext();
  const { data, error } = await auth.service.rpc("get_data_import_context", { p_business: auth.businessId, p_actor: auth.actor });
  rpcError(error);
  const context = contextSchema.parse(data);
  const payload = payloadSchema.parse(input);
  if (payload.target.businessId !== auth.businessId) throw new GovernedImportError("OWNER_REQUIRED");
  // Business timezone/currency are authoritative server truth, never upload claims.
  payload.target = { businessId: auth.businessId, businessTimezone: context.business.timezone, businessCurrency: context.business.currency };
  const plan = buildOperationalPlan(payload, context.snapshot, mapping, new Date().toISOString().replace(/\.\d{3}Z$/, "Z"));
  return { auth, context, plan };
}

/** Internal server seam only: no route, Server Action, upload or public UI. */
export async function prepareGovernedImport(input: unknown, mapping: unknown) {
  const { auth, context, plan } = await currentPlan(input, mapping);
  const { data, error } = await auth.service.rpc("prepare_data_import_run", {
    p_business: auth.businessId, p_actor: auth.actor, p_source: plan.preview.normalized.source,
    p_preview_hash: plan.preview.previewHash, p_snapshot_hash: plan.preview.snapshotHash,
    p_target_fingerprint: context.fingerprint, p_rows: plan.rows,
  });
  rpcError(error);
  const prepared = z.object({ runId: z.uuid(), commitGuardHash: sha }).parse(data);
  return {
    review: { ...prepared, previewHash: plan.preview.previewHash, snapshotHash: plan.preview.snapshotHash } satisfies ImportReview,
    plan,
    capacity: context.capacity,
  };
}

/** Explicit reviewed begin: reauthenticate, rebuild snapshot and rerun A immediately. */
export async function beginGovernedImport(input: unknown, mapping: unknown, reviewed: ImportReview) {
  const review = reviewSchema.parse(reviewed);
  const { auth, plan } = await currentPlan(input, mapping);
  if (plan.preview.previewHash !== review.previewHash || plan.preview.snapshotHash !== review.snapshotHash)
    throw new GovernedImportError("REPREVIEW_REQUIRED");
  const { data, error } = await auth.service.rpc("begin_data_import_commit", {
    p_business: auth.businessId, p_actor: auth.actor, p_run: review.runId,
    p_preview_hash: review.previewHash, p_snapshot_hash: review.snapshotHash,
    p_commit_guard_hash: review.commitGuardHash, p_rows: plan.rows, p_resume: false,
  });
  rpcError(error);
  return { leaseToken: z.uuid().parse(data), rows: plan.rows };
}

/** Re-upload the SAME reviewed operational plan; DB verifies EVERY row commitment.
 * Never rebuild it against self-mutated target truth. This cannot start a new run.
 */
export async function resumeGovernedImport(reviewed: ImportReview, rows: OperationalRow[]) {
  const review = reviewSchema.parse(reviewed);
  const auth = await ownerContext();
  const { data, error } = await auth.service.rpc("begin_data_import_commit", {
    p_business: auth.businessId, p_actor: auth.actor, p_run: review.runId,
    p_preview_hash: review.previewHash, p_snapshot_hash: review.snapshotHash,
    p_commit_guard_hash: review.commitGuardHash, p_rows: rows, p_resume: true,
  });
  rpcError(error);
  return z.uuid().parse(data);
}

/** Zero rows renews the lease. At most 50 reviewed rows, in dependency order. */
export async function commitGovernedImportBatch(runId: string, leaseToken: string, rows: OperationalRow[]) {
  z.uuid().parse(runId); z.uuid().parse(leaseToken);
  if (!Array.isArray(rows) || rows.length > 50) throw new GovernedImportError("INVALID_INPUT");
  const auth = await ownerContext();
  const { data, error } = await auth.service.rpc("commit_data_import_batch", {
    p_business: auth.businessId, p_actor: auth.actor, p_run: runId, p_token: leaseToken, p_rows: rows,
  });
  rpcError(error);
  return data as Array<Record<string, unknown>>;
}

export async function finishGovernedImport(runId: string, leaseToken: string, abort = false) {
  z.uuid().parse(runId); z.uuid().parse(leaseToken);
  const auth = await ownerContext();
  const { data, error } = await auth.service.rpc("finish_data_import_run", {
    p_business: auth.businessId, p_actor: auth.actor, p_run: runId, p_token: leaseToken, p_abort: abort,
  });
  rpcError(error);
  return z.enum(["completed", "completed_with_errors", "failed"]).parse(data);
}
