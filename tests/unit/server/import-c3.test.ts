// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  getUser: vi.fn(), business: vi.fn(), service: vi.fn(), rpc: vi.fn(),
  readReviewed: vi.fn(), begin: vi.fn(), batch: vi.fn(), finish: vi.fn(), resume: vi.fn(),
  retryNotification: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mock.getUser } }) }));
vi.mock("@/lib/actions/business", () => ({ resolveBusinessForUser: mock.business }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: mock.service }));
vi.mock("@/lib/server/import-artifacts", () => ({ readReviewedImportPlan: mock.readReviewed }));
vi.mock("@/lib/server/import-writer", () => ({
  GovernedImportError: class GovernedImportError extends Error { constructor(public code: string) { super(code); } },
  beginGovernedImport: mock.begin, commitGovernedImportBatch: mock.batch,
  finishGovernedImport: mock.finish, resumeGovernedImport: mock.resume,
}));
vi.mock("@/lib/integrations/jobs/queue", () => ({ enqueueReminderJobs: vi.fn() }));
vi.mock("@/lib/communications/queue", () => ({ retryNotification: mock.retryNotification }));

import {
  advanceC3Import,
  C3ImportError,
  getC3ImportWorkspace,
  getC3ResultPage,
  resumeC3Import,
  startC3Import,
} from "@/lib/server/import-c3";

const businessId = "10000000-0000-4000-8000-000000000001";
const actor = "20000000-0000-4000-8000-000000000001";
const runId = "30000000-0000-4000-8000-000000000001";
const artifactId = "40000000-0000-4000-8000-000000000001";
const lease = "50000000-0000-4000-8000-000000000001";
const previewHash = "a".repeat(64), snapshotHash = "b".repeat(64), guardHash = "c".repeat(64);
const checksum = "d".repeat(64), rowHash = "e".repeat(64);
const row = {
  entityType: "customer" as const, sourceRowKey: "customer:2", sourceExternalId: "customer-001",
  name: "Synthetic Customer", email: "synthetic@example.invalid",
};
const outcome = {
  entityType: "customer" as const, sourceRowKey: "customer:2", sourceExternalId: "customer-001",
  sourceRowHash: rowHash, status: "READY" as const, plannedAction: "CREATE" as const,
  reasonCodes: [], dependencies: {},
};
const mapping = { version: "c2-mapping-v1", statusMapping: {}, links: [] };
const adapter = {
  version: "c2-csv-v1", entityType: "customer" as const, delimiter: "," as const,
  sourceTimezone: "UTC", sourceCurrency: "CAD",
  fields: {
    name: { kind: "column" as const, column: { index: 0, header: "name" } },
    email: { kind: "column" as const, column: { index: 1, header: "email" } },
  },
  references: {},
};
const normalized = {
  source: { schemaVersion: "1" as const, sourceSystem: "other_csv", sourceAccountKey: "source-account",
    sourceTimezone: "UTC", sourceCurrency: "CAD", inputChecksum: checksum },
  target: { businessId, businessTimezone: "UTC", businessCurrency: "CAD" }, rows: [row],
};
const envelope = {
  schemaVersion: "c2-reviewed-v1", review: { runId, previewHash, snapshotHash, commitGuardHash: guardHash },
  mapping, adapter,
  preview: { version: "1", previewHash, snapshotHash, normalized, outcomes: [outcome],
    counts: { READY: 1, WARNING: 0, DUPLICATE_EXISTING: 0, DUPLICATE_IN_FILE: 0,
      INVALID: 0, UNRESOLVED_REFERENCE: 0, SKIPPED: 0 } },
  rows: [{ row, outcome }], locationSlugs: [],
};

let run: Record<string, unknown>;
let artifact: Record<string, unknown>;
let commitRows: Record<string, unknown>[];
let takeovers: Record<string, unknown>[];
function query(table: string) {
  let rows = table === "data_import_runs" ? [run]
    : table === "data_import_artifacts" ? [artifact]
    : table === "data_import_row_outcomes" ? commitRows
    : table === "data_import_reminder_takeovers" ? takeovers : [];
  let fields: string[] | null = null;
  const project = (item: Record<string, unknown>) => fields
    ? Object.fromEntries(fields.map((field) => [field, item[field]]))
    : item;
  const q = {
    select: (value: string) => { fields = value.split(","); return q; },
    eq: (field: string, value: unknown) => { rows = rows.filter((item) => item[field] === value); return q; },
    in: (field: string, values: unknown[]) => { rows = rows.filter((item) => values.includes(item[field])); return q; },
    order: () => q,
    range: async (from: number, to: number) => ({
      data: rows.slice(from, to + 1).map(project),
      error: null,
      count: rows.length,
    }),
    limit: async (limit: number) => ({ data: rows.slice(0, limit).map(project), error: null }),
    maybeSingle: async () => ({ data: rows[0] ? project(rows[0]) : null, error: null }),
  };
  return q;
}

function summaryRow() {
  const counts = { CREATED: 0, LINKED: 0, SKIPPED: 0, BLOCKED: 0 };
  for (const item of commitRows) {
    const result = String(item.commit_result) as keyof typeof counts;
    if (result in counts) counts[result] += 1;
  }
  return {
    ...run,
    total_rows: 1,
    committed_rows: commitRows.length,
    created_count: counts.CREATED,
    linked_count: counts.LINKED,
    skipped_count: counts.SKIPPED,
    blocked_count: counts.BLOCKED,
    reminder_requested: takeovers.length > 0,
    unreviewed_services: 0,
    staff_needing_setup: 0,
    locations_needing_hours: 0,
    eligible_reminder_appointments: 0,
    scheduled_reminder_jobs: 0,
    failed_reminder_jobs: 0,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  run = {
    id: runId, business_id: businessId, created_by: actor, source_system: "other_csv",
    source_account_key: "source-account", schema_version: "1", input_checksum: checksum,
    source_timezone: "UTC", source_currency: "CAD", state: "previewed",
    preview_hash: previewHash, snapshot_hash: snapshotHash, commit_guard_hash: guardHash,
    created_at: "2026-09-24T12:00:00Z", previewed_at: "2026-09-24T12:01:00Z",
    commit_started_at: null, finished_at: null, lease_expires_at: null,
  };
  artifact = { id: artifactId, business_id: businessId, created_by: actor,
    import_run_id: runId, state: "reviewed_frozen",
    reviewed_expires_at: "2026-09-27T12:00:00Z" };
  commitRows = [];
  takeovers = [];
  mock.getUser.mockResolvedValue({ data: { user: { id: actor } }, error: null });
  mock.business.mockResolvedValue({ id: businessId, owner_id: actor });
  mock.service.mockReturnValue({ from: (table: string) => query(table), rpc: mock.rpc });
  mock.readReviewed.mockResolvedValue({
    bytes: Buffer.from(JSON.stringify(envelope)), sha256: "f".repeat(64),
    artifactId, importRunId: runId,
  });
  mock.begin.mockResolvedValue({ leaseToken: lease, rows: envelope.rows });
  mock.resume.mockResolvedValue(lease);
  mock.batch.mockImplementation(async () => {
    commitRows = [{
      import_run_id: runId, phase: "commit", entity_type: "customer", source_row_key: "customer:2",
      row_ordinal: 0, commit_result: "CREATED",
      target_entity_id: "60000000-0000-4000-8000-000000000001", reason_codes: [],
    }];
    return commitRows;
  });
  mock.finish.mockImplementation(async () => {
    run = { ...run, state: "completed", finished_at: "2026-09-24T12:05:00Z" };
    return "completed";
  });
  mock.rpc.mockImplementation(async (name: string) => {
    if (name === "request_data_import_reminder_takeover") {
      takeovers = [{ import_run_id: runId, business_id: businessId, requested_by: actor }];
      return { data: { importRunId: runId }, error: null };
    }
    if (name === "get_data_import_run_summaries") {
      return { data: [summaryRow()], error: null };
    }
    if (name === "get_data_import_reminder_candidates") {
      return { data: [], error: null };
    }
    return { data: null, error: null };
  });
});

it("starts from exact frozen server truth with default reminder takeover off", async () => {
  const result = await startC3Import(runId, false);
  expect(result).toMatchObject({ runId, state: "committing", leaseToken: lease, totalRows: 1 });
  expect(mock.rpc).not.toHaveBeenCalled();
  expect(mock.begin).toHaveBeenCalledWith(normalized, mapping, envelope.review);
});
it("records requested reminder takeover before the governed begin", async () => {
  await startC3Import(runId, true);
  expect(mock.rpc).toHaveBeenCalledWith("request_data_import_reminder_takeover", {
    p_business: businessId, p_actor: actor, p_run: runId,
  });
  expect(mock.rpc.mock.invocationCallOrder[0]).toBeLessThan(mock.begin.mock.invocationCallOrder[0]);
});

it("rejects artifact-run cross-binding drift before operational commit", async () => {
  mock.readReviewed.mockResolvedValueOnce({
    bytes: Buffer.from(JSON.stringify(envelope)), sha256: "f".repeat(64),
    artifactId, importRunId: "70000000-0000-4000-8000-000000000001",
  });
  await expect(startC3Import(runId, false)).rejects.toMatchObject({ code: "RUN_MISMATCH" });
  expect(mock.begin).not.toHaveBeenCalled();
});

it("rejects frozen-envelope hash drift before operational commit", async () => {
  const changed = structuredClone(envelope);
  changed.review.commitGuardHash = "9".repeat(64);
  mock.readReviewed.mockResolvedValueOnce({
    bytes: Buffer.from(JSON.stringify(changed)), sha256: "f".repeat(64),
    artifactId, importRunId: runId,
  });
  await expect(startC3Import(runId, false)).rejects.toMatchObject({ code: "RUN_MISMATCH" });
  expect(mock.begin).not.toHaveBeenCalled();
});


it("advances from durable outcome truth and finishes the exact frozen run", async () => {
  run = { ...run, state: "committing", commit_started_at: "2026-09-24T12:02:00Z",
    lease_expires_at: "2099-09-24T12:04:00Z" };
  const result = await advanceC3Import(runId, lease);
  expect(mock.batch).toHaveBeenCalledWith(runId, lease, envelope.rows);
  expect(mock.finish).toHaveBeenCalledWith(runId, lease);
  expect(result).toMatchObject({
    state: "completed",
    committedRows: 1,
    results: { created: 1, linked: 0, skipped: 0, blocked: 0 },
  });
});

it("does not steal a live lease when the browser has lost its token", async () => {
  run = { ...run, state: "committing", commit_started_at: "2026-09-24T12:02:00Z",
    lease_expires_at: "2099-09-24T12:04:00Z" };
  await expect(resumeC3Import(runId)).rejects.toSatisfy((error: unknown) =>
    error instanceof C3ImportError && error.code === "LEASE_ACTIVE"
      && error.retryAt === "2099-09-24T12:04:00Z");
  expect(mock.resume).not.toHaveBeenCalled();
});

it("resumes only after expiry using the exact frozen review and rows", async () => {
  run = { ...run, state: "committing", commit_started_at: "2026-09-24T12:02:00Z",
    lease_expires_at: "2020-09-24T12:04:00Z" };
  const result = await resumeC3Import(runId);
  expect(mock.resume).toHaveBeenCalledWith(envelope.review, envelope.rows);
  expect(result).toMatchObject({ state: "committing", leaseToken: lease, committedRows: 0, totalRows: 1 });
});

it("failed reminder jobs force needs-attention and block cutover readiness", async () => {
  takeovers = [{ import_run_id: runId, business_id: businessId, requested_by: actor }];
  run = { ...run, state: "completed", finished_at: "2026-09-24T12:05:00Z" };
  mock.rpc.mockImplementation(async (name: string) => {
    if (name === "get_data_import_run_summaries") {
      return {
        data: [{
          ...summaryRow(),
          reminder_requested: true,
          eligible_reminder_appointments: 1,
          scheduled_reminder_jobs: 1,
          failed_reminder_jobs: 1,
        }],
        error: null,
      };
    }
    if (name === "get_data_import_reminder_candidates") return { data: [], error: null };
    return { data: null, error: null };
  });

  const workspace = await getC3ImportWorkspace();
  expect(workspace.runs[0]).toMatchObject({
    reminderStatus: "needs_attention",
    cutover: { ready: false, reminderNeedsAttention: true },
  });
});

it("returns bounded row-level result details from durable commit outcomes", async () => {
  commitRows = [{
    import_run_id: runId,
    phase: "commit",
    entity_type: "appointment",
    source_row_key: "appointment:2",
    row_ordinal: 0,
    commit_result: "BLOCKED",
    target_entity_id: null,
    reason_codes: ["MISSING_REFERENCE"],
  }];

  const result = await getC3ResultPage(runId, 0);
  expect(result).toEqual({
    page: 0,
    pageSize: 25,
    total: 1,
    rows: [{
      entityType: "appointment",
      sourceRowKey: "appointment:2",
      result: "BLOCKED",
      reasonCodes: ["MISSING_REFERENCE"],
    }],
  });
});
