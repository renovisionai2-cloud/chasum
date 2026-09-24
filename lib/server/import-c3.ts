import "server-only";

import { z } from "zod";
import { resolveBusinessForUser } from "@/lib/actions/business";
import {
  c3CommitResultSchema,
  c3ReviewedEnvelopeSchema,
  c3RunStateSchema,
  type C3ReviewedEnvelope,
} from "@/lib/imports/c3-contract";
import { enqueueReminderJobs } from "@/lib/integrations/jobs/queue";
import { readReviewedImportPlan } from "@/lib/server/import-artifacts";
import {
  beginGovernedImport,
  commitGovernedImportBatch,
  finishGovernedImport,
  GovernedImportError,
  resumeGovernedImport,
} from "@/lib/server/import-writer";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const uuid = z.uuid();
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const terminalStates = new Set(["completed", "completed_with_errors", "failed", "cancelled"]);
const activeStates = new Set(["previewed", "committing"]);

const runRowSchema = z.object({
  id: z.uuid(),
  business_id: z.uuid(),
  created_by: z.uuid(),
  source_system: z.string(),
  source_account_key: z.string(),
  schema_version: z.string(),
  input_checksum: sha,
  source_timezone: z.string(),
  source_currency: z.string(),
  state: c3RunStateSchema,
  preview_hash: sha.nullable(),
  snapshot_hash: sha.nullable(),
  commit_guard_hash: sha.nullable(),
  created_at: z.string(),
  previewed_at: z.string().nullable(),
  commit_started_at: z.string().nullable(),
  finished_at: z.string().nullable(),
  lease_expires_at: z.string().nullable(),
}).strict();

const artifactLinkSchema = z.object({
  id: z.uuid(),
  import_run_id: z.uuid().nullable(),
  state: z.string(),
  reviewed_expires_at: z.string().nullable(),
}).strict();

const runSummaryRpcSchema = runRowSchema.extend({
  total_rows: z.number().int().nonnegative(),
  committed_rows: z.number().int().nonnegative(),
  created_count: z.number().int().nonnegative(),
  linked_count: z.number().int().nonnegative(),
  skipped_count: z.number().int().nonnegative(),
  blocked_count: z.number().int().nonnegative(),
  reminder_requested: z.boolean(),
  unreviewed_services: z.number().int().nonnegative(),
  staff_needing_setup: z.number().int().nonnegative(),
  locations_needing_hours: z.number().int().nonnegative(),
  eligible_reminder_appointments: z.number().int().nonnegative(),
  scheduled_reminder_jobs: z.number().int().nonnegative(),
}).strict();

const reminderCandidateSchema = z.object({
  appointmentId: z.uuid(),
  reminderAt: z.string(),
}).strict();

export type C3ResultRow = {
  entityType: string;
  sourceRowKey: string;
  result: z.infer<typeof c3CommitResultSchema>;
  reasonCodes: string[];
};

export type C3ReminderStatus = "off" | "pending" | "scheduled" | "partial" | "needs_attention";

export type C3RunSummary = {
  runId: string;
  state: z.infer<typeof c3RunStateSchema>;
  sourceSystem: string;
  createdAt: string;
  previewedAt: string | null;
  commitStartedAt: string | null;
  finishedAt: string | null;
  leaseExpiresAt: string | null;
  artifactId: string | null;
  reviewedExpiresAt: string | null;
  reminderRequested: boolean;
  reminderStatus: C3ReminderStatus;
  totalRows: number;
  committedRows: number;
  results: { created: number; linked: number; skipped: number; blocked: number };
  cutover?: C3CutoverReadiness;
};

export type C3CutoverReadiness = {
  ready: boolean;
  blockedRows: number;
  unreviewedServices: number;
  staffNeedingSetup: number;
  locationsNeedingHours: number;
  reminderNeedsAttention: boolean;
};

export class C3ImportError extends Error {
  constructor(
    public readonly code:
      | "OWNER_REQUIRED"
      | "INVALID_INPUT"
      | "RUN_NOT_FOUND"
      | "RUN_MISMATCH"
      | "REVIEW_UNAVAILABLE"
      | "LEASE_ACTIVE"
      | "LEASE_UNAVAILABLE"
      | "NOT_CANCELLABLE"
      | "UNAVAILABLE",
    public readonly retryAt?: string,
  ) {
    super(code);
  }
}

async function ownerContext() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) throw new C3ImportError("OWNER_REQUIRED");
  const business = await resolveBusinessForUser(user.id);
  if (!business || business.owner_id !== user.id) throw new C3ImportError("OWNER_REQUIRED");
  return { actor: user.id, business, service: createServiceClient() };
}

type Owner = Awaited<ReturnType<typeof ownerContext>>;

async function runForOwner(auth: Owner, runIdInput: unknown) {
  const runId = uuid.parse(runIdInput);
  const { data, error } = await auth.service
    .from("data_import_runs")
    .select("id,business_id,created_by,source_system,source_account_key,schema_version,input_checksum,source_timezone,source_currency,state,preview_hash,snapshot_hash,commit_guard_hash,created_at,previewed_at,commit_started_at,finished_at,lease_expires_at")
    .eq("id", runId)
    .eq("business_id", auth.business.id)
    .eq("created_by", auth.actor)
    .maybeSingle();
  if (error) throw new C3ImportError("UNAVAILABLE");
  if (!data) throw new C3ImportError("RUN_NOT_FOUND");
  return runRowSchema.parse(data);
}

async function artifactForRun(auth: Owner, runId: string) {
  const { data, error } = await auth.service
    .from("data_import_artifacts")
    .select("id,import_run_id,state,reviewed_expires_at")
    .eq("business_id", auth.business.id)
    .eq("created_by", auth.actor)
    .eq("import_run_id", runId)
    .maybeSingle();
  if (error) throw new C3ImportError("UNAVAILABLE");
  return data ? artifactLinkSchema.parse(data) : null;
}

function parseEnvelope(bytes: Uint8Array): C3ReviewedEnvelope {
  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch {
    throw new C3ImportError("REVIEW_UNAVAILABLE");
  }
  const parsed = c3ReviewedEnvelopeSchema.safeParse(json);
  if (!parsed.success) throw new C3ImportError("REVIEW_UNAVAILABLE");
  const value = parsed.data;
  if (
    value.review.previewHash !== value.preview.previewHash
    || value.review.snapshotHash !== value.preview.snapshotHash
    || value.rows.length !== value.preview.normalized.rows.length
    || value.rows.length !== value.preview.outcomes.length
  ) {
    throw new C3ImportError("RUN_MISMATCH");
  }
  for (let index = 0; index < value.rows.length; index += 1) {
    const operational = value.rows[index];
    const normalized = value.preview.normalized.rows[index];
    const previewOutcome = value.preview.outcomes[index];
    if (
      operational.row.entityType !== normalized.entityType
      || operational.row.sourceRowKey !== normalized.sourceRowKey
      || operational.outcome.entityType !== previewOutcome.entityType
      || operational.outcome.sourceRowKey !== previewOutcome.sourceRowKey
    ) {
      throw new C3ImportError("RUN_MISMATCH");
    }
  }
  return value;
}

async function frozenRun(auth: Owner, runIdInput: unknown) {
  const run = await runForOwner(auth, runIdInput);
  const artifact = await artifactForRun(auth, run.id);
  if (!artifact) throw new C3ImportError("REVIEW_UNAVAILABLE");
  const reviewed = await readReviewedImportPlan(artifact.id);
  if (!reviewed.importRunId || reviewed.importRunId !== run.id || artifact.import_run_id !== run.id) {
    throw new C3ImportError("RUN_MISMATCH");
  }
  const envelope = parseEnvelope(reviewed.bytes);
  const source = envelope.preview.normalized.source;
  const target = envelope.preview.normalized.target;
  if (
    envelope.review.runId !== run.id
    || envelope.review.previewHash !== run.preview_hash
    || envelope.review.snapshotHash !== run.snapshot_hash
    || envelope.review.commitGuardHash !== run.commit_guard_hash
    || target.businessId !== auth.business.id
    || source.schemaVersion !== run.schema_version
    || source.sourceSystem !== run.source_system
    || source.sourceAccountKey !== run.source_account_key
    || source.inputChecksum.toLowerCase() !== run.input_checksum
    || source.sourceTimezone !== run.source_timezone
    || source.sourceCurrency.toUpperCase() !== run.source_currency
  ) {
    throw new C3ImportError("RUN_MISMATCH");
  }
  return { run, artifact, envelope };
}

function reminderStatusFromSummary(
  row: z.infer<typeof runSummaryRpcSchema>,
): C3ReminderStatus {
  if (!row.reminder_requested) return "off";
  if (row.eligible_reminder_appointments === 0) return "scheduled";
  const expected = row.eligible_reminder_appointments * 2;
  if (row.scheduled_reminder_jobs >= expected) return "scheduled";
  if (row.scheduled_reminder_jobs > 0) return "partial";
  return "pending";
}

function cutoverFromSummary(
  row: z.infer<typeof runSummaryRpcSchema>,
  reminderStatus: C3ReminderStatus,
): C3CutoverReadiness {
  const reminderNeedsAttention = ["pending", "partial", "needs_attention"].includes(reminderStatus);
  return {
    ready: row.blocked_count === 0
      && row.unreviewed_services === 0
      && row.staff_needing_setup === 0
      && row.locations_needing_hours === 0
      && !reminderNeedsAttention,
    blockedRows: row.blocked_count,
    unreviewedServices: row.unreviewed_services,
    staffNeedingSetup: row.staff_needing_setup,
    locationsNeedingHours: row.locations_needing_hours,
    reminderNeedsAttention,
  };
}

async function runSummaryRows(auth: Owner) {
  const { data, error } = await auth.service.rpc("get_data_import_run_summaries", {
    p_business: auth.business.id,
    p_actor: auth.actor,
    p_limit: 20,
  });
  if (error) throw new C3ImportError("UNAVAILABLE");
  return z.array(runSummaryRpcSchema).max(20).parse(data ?? []);
}

async function summaryRowForRun(auth: Owner, runId: string) {
  const row = (await runSummaryRows(auth)).find((item) => item.id === runId);
  if (!row) throw new C3ImportError("RUN_NOT_FOUND");
  return row;
}

async function artifactsForRuns(auth: Owner, runIds: string[]) {
  if (runIds.length === 0) return new Map<string, z.infer<typeof artifactLinkSchema>>();
  const { data, error } = await auth.service
    .from("data_import_artifacts")
    .select("id,import_run_id,state,reviewed_expires_at")
    .eq("business_id", auth.business.id)
    .eq("created_by", auth.actor)
    .in("import_run_id", runIds);
  if (error) throw new C3ImportError("UNAVAILABLE");
  return new Map(
    z.array(artifactLinkSchema).parse(data ?? [])
      .filter((item) => item.import_run_id)
      .map((item) => [item.import_run_id!, item]),
  );
}

function publicSummary(
  row: z.infer<typeof runSummaryRpcSchema>,
  artifact: z.infer<typeof artifactLinkSchema> | null,
  reminderOverride?: C3ReminderStatus,
): C3RunSummary {
  const reminderStatus = reminderOverride ?? reminderStatusFromSummary(row);
  const summary: C3RunSummary = {
    runId: row.id,
    state: row.state,
    sourceSystem: row.source_system,
    createdAt: row.created_at,
    previewedAt: row.previewed_at,
    commitStartedAt: row.commit_started_at,
    finishedAt: row.finished_at,
    leaseExpiresAt: row.lease_expires_at,
    artifactId: artifact?.id ?? null,
    reviewedExpiresAt: artifact?.reviewed_expires_at ?? null,
    reminderRequested: row.reminder_requested,
    reminderStatus,
    totalRows: row.total_rows,
    committedRows: row.committed_rows,
    results: {
      created: row.created_count,
      linked: row.linked_count,
      skipped: row.skipped_count,
      blocked: row.blocked_count,
    },
  };
  if (terminalStates.has(row.state) && row.state !== "cancelled") {
    summary.cutover = cutoverFromSummary(row, reminderStatus);
  }
  return summary;
}

async function scheduleReminderTakeover(auth: Owner, runId: string) {
  const summary = await summaryRowForRun(auth, runId);
  if (!summary.reminder_requested) return { requested: false, scheduled: 0, failed: 0 };
  if (!terminalStates.has(summary.state) || summary.state === "cancelled") {
    throw new C3ImportError("INVALID_INPUT");
  }
  const { data, error } = await auth.service.rpc("get_data_import_reminder_candidates", {
    p_business: auth.business.id,
    p_actor: auth.actor,
    p_run: runId,
    p_limit: 25,
  });
  if (error) throw new C3ImportError("UNAVAILABLE");
  const candidates = z.array(reminderCandidateSchema).max(25).parse(data ?? []);
  let scheduled = 0;
  let failed = 0;
  for (const candidate of candidates) {
    const reminderAt = new Date(candidate.reminderAt);
    if (Number.isNaN(reminderAt.getTime())) {
      failed += 1;
      continue;
    }
    try {
      await enqueueReminderJobs(
        auth.business.id,
        candidate.appointmentId,
        reminderAt,
        { importRunId: runId },
      );
      scheduled += 1;
    } catch {
      failed += 1;
    }
  }
  return { requested: true, scheduled, failed };
}

export async function getC3ImportWorkspace() {
  const auth = await ownerContext();
  const rows = await runSummaryRows(auth);
  const artifacts = await artifactsForRuns(auth, rows.map((row) => row.id));
  return {
    serverNow: new Date().toISOString(),
    runs: rows.map((row) => publicSummary(row, artifacts.get(row.id) ?? null)),
  };
}

export async function getC3ResultPage(runIdInput: unknown, pageInput: unknown) {
  const auth = await ownerContext();
  const runId = uuid.parse(runIdInput);
  const page = z.number().int().min(0).max(199).parse(pageInput);
  await runForOwner(auth, runId);
  const from = page * 25;
  const to = from + 24;
  const { data, error, count } = await auth.service
    .from("data_import_row_outcomes")
    .select("entity_type,source_row_key,commit_result,reason_codes", { count: "exact" })
    .eq("import_run_id", runId)
    .eq("phase", "commit")
    .order("row_ordinal", { ascending: true })
    .range(from, to);
  if (error) throw new C3ImportError("UNAVAILABLE");
  const rows = z.array(z.object({
    entity_type: z.string(),
    source_row_key: z.string(),
    commit_result: c3CommitResultSchema,
    reason_codes: z.array(z.string()),
  }).strict()).parse(data ?? []);
  return {
    page,
    pageSize: 25,
    total: count ?? rows.length,
    rows: rows.map((row): C3ResultRow => ({
      entityType: row.entity_type,
      sourceRowKey: row.source_row_key,
      result: row.commit_result,
      reasonCodes: row.reason_codes,
    })),
  };
}

export async function startC3Import(runIdInput: unknown, reminderTakeoverInput: unknown) {
  const auth = await ownerContext();
  const runId = uuid.parse(runIdInput);
  const reminderTakeover = z.boolean().parse(reminderTakeoverInput);
  const frozen = await frozenRun(auth, runId);
  if (frozen.run.state !== "previewed") throw new C3ImportError("LEASE_UNAVAILABLE");
  if (reminderTakeover) {
    const { error } = await auth.service.rpc("request_data_import_reminder_takeover", {
      p_business: auth.business.id,
      p_actor: auth.actor,
      p_run: runId,
    });
    if (error) throw new C3ImportError("UNAVAILABLE");
  }
  let begun: Awaited<ReturnType<typeof beginGovernedImport>>;
  try {
    begun = await beginGovernedImport(
      frozen.envelope.preview.normalized,
      frozen.envelope.mapping,
      frozen.envelope.review,
    );
  } catch (error) {
    if (error instanceof GovernedImportError) {
      throw new C3ImportError(error.code === "REPREVIEW_REQUIRED" ? "RUN_MISMATCH" : "LEASE_UNAVAILABLE");
    }
    throw error;
  }
  return {
    runId,
    state: "committing" as const,
    leaseToken: begun.leaseToken,
    totalRows: frozen.envelope.rows.length,
    committedRows: 0,
  };
}

async function committedPrefix(auth: Owner, runId: string, totalRows: number) {
  const summary = await summaryRowForRun(auth, runId);
  if (summary.total_rows !== totalRows || summary.committed_rows > totalRows) {
    throw new C3ImportError("RUN_MISMATCH");
  }
  return summary.committed_rows;
}

async function terminalResponse(auth: Owner, runId: string) {
  let summary = await summaryRowForRun(auth, runId);
  let reminderOverride: C3ReminderStatus | undefined;
  if (summary.reminder_requested && terminalStates.has(summary.state) && summary.state !== "cancelled") {
    const scheduling = await scheduleReminderTakeover(auth, runId);
    summary = await summaryRowForRun(auth, runId);
    reminderOverride = reminderStatusFromSummary(summary);
    if (scheduling.failed > 0 && reminderOverride !== "scheduled") reminderOverride = "needs_attention";
  }
  const artifact = await artifactForRun(auth, runId);
  return publicSummary(summary, artifact, reminderOverride);
}

export async function advanceC3Import(runIdInput: unknown, leaseTokenInput: unknown) {
  const auth = await ownerContext();
  const runId = uuid.parse(runIdInput);
  const leaseToken = uuid.parse(leaseTokenInput);
  const run = await runForOwner(auth, runId);
  if (terminalStates.has(run.state)) return terminalResponse(auth, runId);
  if (run.state !== "committing") throw new C3ImportError("LEASE_UNAVAILABLE");
  const frozen = await frozenRun(auth, runId);
  const committed = await committedPrefix(auth, runId, frozen.envelope.rows.length);
  const batch = frozen.envelope.rows.slice(committed, committed + 50);
  if (batch.length > 0) {
    try {
      await commitGovernedImportBatch(runId, leaseToken, batch);
    } catch (error) {
      if (error instanceof GovernedImportError) throw new C3ImportError("LEASE_UNAVAILABLE");
      throw error;
    }
  }
  const after = await committedPrefix(auth, runId, frozen.envelope.rows.length);
  if (after < frozen.envelope.rows.length) {
    return {
      runId,
      state: "committing" as const,
      leaseToken,
      committedRows: after,
      totalRows: frozen.envelope.rows.length,
    };
  }
  try {
    await finishGovernedImport(runId, leaseToken);
  } catch (error) {
    const current = await runForOwner(auth, runId);
    if (!terminalStates.has(current.state)) {
      if (error instanceof GovernedImportError) throw new C3ImportError("LEASE_UNAVAILABLE");
      throw error;
    }
  }
  return terminalResponse(auth, runId);
}

export async function resumeC3Import(runIdInput: unknown) {
  const auth = await ownerContext();
  const runId = uuid.parse(runIdInput);
  const run = await runForOwner(auth, runId);
  if (terminalStates.has(run.state)) return terminalResponse(auth, runId);
  if (run.state !== "committing") throw new C3ImportError("LEASE_UNAVAILABLE");
  if (run.lease_expires_at && Date.parse(run.lease_expires_at) > Date.now()) {
    throw new C3ImportError("LEASE_ACTIVE", run.lease_expires_at);
  }
  const frozen = await frozenRun(auth, runId);
  let leaseToken: string;
  try {
    leaseToken = await resumeGovernedImport(frozen.envelope.review, frozen.envelope.rows);
  } catch (error) {
    if (error instanceof GovernedImportError) throw new C3ImportError("LEASE_UNAVAILABLE");
    throw error;
  }
  const committed = await committedPrefix(auth, runId, frozen.envelope.rows.length);
  return {
    runId,
    state: "committing" as const,
    leaseToken,
    committedRows: committed,
    totalRows: frozen.envelope.rows.length,
  };
}

export async function cancelC3Import(runIdInput: unknown) {
  const auth = await ownerContext();
  const runId = uuid.parse(runIdInput);
  const { data, error } = await auth.service.rpc("cancel_data_import_run", {
    p_business: auth.business.id,
    p_actor: auth.actor,
    p_run: runId,
  });
  if (error) {
    if (/IMPORT_RUN_NOT_CANCELLABLE/.test(error.message)) throw new C3ImportError("NOT_CANCELLABLE");
    if (/IMPORT_OWNER_REQUIRED|IMPORT_RUN_AUTHORITY/.test(error.message)) throw new C3ImportError("OWNER_REQUIRED");
    throw new C3ImportError("UNAVAILABLE");
  }
  if (data !== "cancelled") throw new C3ImportError("UNAVAILABLE");
  return terminalResponse(auth, runId);
}

export async function retryC3ReminderTakeover(runIdInput: unknown) {
  const auth = await ownerContext();
  const runId = uuid.parse(runIdInput);
  const run = await runForOwner(auth, runId);
  if (!terminalStates.has(run.state) || run.state === "cancelled") throw new C3ImportError("INVALID_INPUT");
  const summary = await summaryRowForRun(auth, runId);
  if (!summary.reminder_requested) throw new C3ImportError("INVALID_INPUT");
  await scheduleReminderTakeover(auth, runId);
  return terminalResponse(auth, runId);
}

export function isC3ActiveState(state: string) {
  return activeStates.has(state);
}
