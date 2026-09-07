// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BackgroundJob } from "@/lib/types/integrations";
import type { SendResult, AppointmentTemplateContext } from "@/lib/communications/types";
import type { SendReliabilityContext, SendIntent, SendIntentStore } from "@/lib/communications/send-intent";

type Row = Record<string, unknown>;
type Response = { data: Row[] | Row | null; error: { code: string; message: string } | null };
type Filter = (row: Row) => boolean;
type SendInput = {
  businessId: string;
  to: string;
  templateKey: string;
  context: AppointmentTemplateContext;
  reliability: SendReliabilityContext;
};

const runtime = vi.hoisted(() => ({
  db: null as FakeDatabase | null,
  email: vi.fn<(input: SendInput) => Promise<SendResult>>(),
  sms: vi.fn<(input: SendInput) => Promise<SendResult>>(),
  loadContext: vi.fn(),
  calendar: vi.fn(), webhook: vi.fn(), recurring: vi.fn(), waitlist: vi.fn(),
  info: vi.fn(), warn: vi.fn(), error: vi.fn(),
}));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => runtime.db!.client }));
vi.mock("@/lib/communications", () => ({
  sendEmail: (input: SendInput) => runtime.email(input),
  sendSMS: (input: SendInput) => runtime.sms(input),
  computeBackoffMs: (attempt: number) => Math.min(60_000 * 5 ** Math.max(0, attempt - 1), 1_500_000),
}));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: runtime.info, warn: runtime.warn, error: runtime.error } }));
vi.mock("@/lib/notifications/booking-delivery", () => ({ loadAppointmentNotifyContext: runtime.loadContext }));
vi.mock("@/lib/integrations/calendar/apple", () => ({ generateSingleEventIcs: () => "SYNTHETIC ICS" }));
vi.mock("@/lib/integrations/calendar/sync", () => ({ syncCalendarConnection: runtime.calendar }));
vi.mock("@/lib/integrations/webhooks/dispatch", () => ({ dispatchWebhooks: runtime.webhook }));
vi.mock("@/lib/integrations/automation/recurring", () => ({ generateRecurringOccurrences: runtime.recurring }));
vi.mock("@/lib/integrations/automation/waitlist", () => ({ notifyWaitlistForSlot: runtime.waitlist }));
vi.mock("@/lib/communications/timeline", () => ({ writeCommsAudit: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/integrations/jobs/queue", () => ({ enqueueJob: vi.fn() }));

import { processJob, processPendingJobs } from "@/lib/integrations/jobs/processor";
import { claimBackgroundJob, finalizeClaimedJob } from "@/lib/integrations/jobs/claim";
import { retryNotification } from "@/lib/communications/queue";
import { runDurableSend, sendIntentKey } from "@/lib/communications/send-intent";

const BUSINESS = "02000000-0000-4000-8000-000000000001";
const OTHER_BUSINESS = "02000000-0000-4000-8000-000000000002";
const INTENT = "03000000-0000-4000-8000-000000000001";
const CUSTOMER = "04000000-0000-4000-8000-000000000001";
const APPOINTMENT = "05000000-0000-4000-8000-000000000001";

const copy = <T,>(value: T): T => structuredClone(value);
function fixture(overrides: Partial<BackgroundJob> = {}): BackgroundJob {
  return {
    id: "10000000-0000-4000-8000-000000000001", business_id: BUSINESS,
    job_type: "email", status: "pending", scheduled_at: "2026-01-01T00:00:00.000Z",
    started_at: null, completed_at: null, next_retry_at: null, cancelled_at: null,
    attempts: 0, max_attempts: 3, error_message: null, created_at: "2026-01-01T00:00:00.000Z",
    payload: {
      templateKey: "custom", recipient: "synthetic@example.invalid", sendIntentId: INTENT, sendIntentProtocol: "durable-v1",
      directContext: {
        businessId: BUSINESS, businessName: "Synthetic business", customerName: "Synthetic recipient",
        staffName: "Synthetic staff", serviceName: "Synthetic service", startTime: "2026-01-01T00:00:00Z",
      },
    },
    ...overrides,
  };
}

/**
 * A stateful PostgREST contract adapter, NOT PostgreSQL. Every UPDATE evaluates
 * the production filters against live shared state in one indivisible step.
 * Batch reads snapshot before a barrier; this forces both workers to see the
 * same pending row before either may issue its compare-and-set UPDATE.
 */
class FakeDatabase {
  tables: Record<string, Row[]>;
  candidateSnapshots: string[][] = [];
  updates: Array<{ table: string; patch: Row; matched: number }> = [];
  readBarrierCount = 0;
  private readArrivals = 0;
  private releaseReads: (() => void) | null = null;
  private barrier = new Promise<void>((resolve) => { this.releaseReads = resolve; });
  failClaim = false;
  throwClaim = false;
  failFinalize = false;
  throwFinalize = false;
  finalizeThenLoseResponse = false;
  failReceipt = false;
  failIntentRead = false;
  beforeUpdate: ((table: string, patch: Row) => void) | null = null;

  constructor(jobs: BackgroundJob[] = [fixture()]) {
    this.tables = { background_jobs: copy(jobs) as unknown as Row[], customers: [], commerce_receipts: [], communication_send_intents: [] };
  }
  get jobs(): BackgroundJob[] { return this.tables.background_jobs as unknown as BackgroundJob[]; }
  client = { from: (table: string) => new Query(this, table) };

  async execute(query: Query): Promise<Response> {
    if (query.table === "communication_send_intents" && this.failIntentRead) {
      return { data: null, error: { code: "TEST", message: "Synthetic intent read failure" } };
    }
    const rows = this.tables[query.table] ?? [];
    if (query.patch) {
      this.beforeUpdate?.(query.table, query.patch);
      if (query.table === "background_jobs" &&
          ((query.patch.status === "processing" && this.throwClaim) ||
           (query.patch.status !== "processing" && this.throwFinalize))) {
        throw new Error("Synthetic connection loss");
      }
      if ((query.table === "background_jobs" && query.patch.status === "processing" && this.failClaim) ||
          (query.table === "background_jobs" && query.patch.status !== "processing" && this.failFinalize) ||
          (query.table === "commerce_receipts" && this.failReceipt)) {
        return { data: null, error: { code: "TEST", message: "Synthetic persistence failure" } };
      }
      // No await between checking eligibility and updating: shared DB atomicity.
      const matched = rows.filter((row) => query.filters.every((filter) => filter(row)));
      for (const row of matched) Object.assign(row, copy(query.patch));
      this.updates.push({ table: query.table, patch: copy(query.patch), matched: matched.length });
      if (query.table === "background_jobs" && query.patch.status !== "processing" && this.finalizeThenLoseResponse) {
        return { data: null, error: { code: "TEST", message: "Synthetic response loss after commit" } };
      }
      return { data: query.singular ? copy(matched[0] ?? null) : copy(matched), error: null };
    }
    let data = rows.filter((row) => query.filters.every((filter) => filter(row)));
    if (query.orderColumn) data = [...data].sort((a, b) => String(a[query.orderColumn!]).localeCompare(String(b[query.orderColumn!])));
    if (query.limitCount != null) data = data.slice(0, query.limitCount);
    const snapshot = copy(data);
    if (query.table === "background_jobs" && query.limitCount != null) {
      this.candidateSnapshots.push(snapshot.map((row) => String(row.id)));
      if (this.readBarrierCount > 0) {
        this.readArrivals += 1;
        if (this.readArrivals === this.readBarrierCount) this.releaseReads!();
        await this.barrier;
      }
    }
    return { data: query.singular ? snapshot[0] ?? null : snapshot, error: null };
  }
}

class Query implements PromiseLike<Response> {
  filters: Filter[] = [];
  patch: Row | null = null;
  singular = false;
  orderColumn: string | null = null;
  limitCount: number | null = null;
  constructor(readonly db: FakeDatabase, readonly table: string) {}
  select(columns: string) { void columns; return this; }
  update(patch: Row) { this.patch = patch; return this; }
  eq(column: string, expected: unknown) {
    this.filters.push((row) => column === "payload"
      ? JSON.stringify(row[column]) === JSON.stringify(typeof expected === "string" ? JSON.parse(expected) : expected)
      : row[column] === expected);
    return this;
  }
  is(column: string, expected: unknown) { this.filters.push((row) => row[column] == expected); return this; }
  lte(column: string, expected: string) {
    this.filters.push((row) => Date.parse(String(row[column])) <= Date.parse(expected)); return this;
  }
  or(expression: string) {
    const time = expression.slice("next_retry_at.is.null,next_retry_at.lte.".length);
    this.filters.push((row) => row.next_retry_at == null || Date.parse(String(row.next_retry_at)) <= Date.parse(time));
    return this;
  }
  order(column: string) { this.orderColumn = column; return this; }
  limit(count: number) { this.limitCount = count; return this; }
  maybeSingle() { this.singular = true; return this; }
  single() { this.singular = true; return this; }
  then<TResult1 = Response, TResult2 = never>(
    fulfilled?: ((value: Response) => TResult1 | PromiseLike<TResult1>) | null,
    rejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.db.execute(this).then(fulfilled, rejected); }
}

class MemoryIntentStore implements SendIntentStore {
  rows = new Map<string, SendIntent>();
  failResultPersistence = false;
  async insert(row: SendIntent) {
    const key = `${row.business_id}/${row.intent_key}`;
    if (this.rows.has(key)) return null;
    this.rows.set(key, copy(row)); return copy(row);
  }
  async find(businessId: string, key: string) { return copy(this.rows.get(`${businessId}/${key}`) ?? null); }
  async compareAndSet(before: SendIntent, changes: Partial<SendIntent>) {
    if (this.failResultPersistence && changes.state !== "sending") throw new Error("Synthetic result-write failure");
    const key = `${before.business_id}/${before.intent_key}`;
    const live = this.rows.get(key);
    if (!live || live.state !== before.state || live.owner_id !== before.owner_id || live.attempt !== before.attempt) return null;
    Object.assign(live, copy(changes)); return copy(live);
  }
}

function useDurableProvider(store: MemoryIntentStore, provider: ReturnType<typeof vi.fn>) {
  runtime.email.mockImplementation(async (input) => {
    const result = await runDurableSend({ ...input, channel: "email" }, provider, store);
    return { ...result, ok: result.success };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "true");
  runtime.db = new FakeDatabase();
  runtime.email.mockResolvedValue({ ok: true, deliveryState: "accepted", retrySafe: false, messageId: "synthetic-provider-id" });
  runtime.sms.mockResolvedValue({ ok: true, deliveryState: "accepted", retrySafe: false });
  runtime.loadContext.mockResolvedValue(null);
  for (const handler of [runtime.calendar, runtime.webhook, runtime.recurring, runtime.waitlist]) {
    handler.mockReset().mockResolvedValue(undefined);
  }
});
afterEach(() => vi.unstubAllEnvs());

describe("atomic worker ownership", () => {
  it("forces two workers to observe the same job and only the CAS winner delivers", async () => {
    runtime.db!.readBarrierCount = 2;
    const results = await Promise.all([processPendingJobs(), processPendingJobs()]);
    expect(runtime.db!.candidateSnapshots).toEqual([[fixture().id], [fixture().id]]);
    expect(results.sort()).toEqual([0, 1]);
    expect(runtime.db!.updates.filter((u) => u.patch.status === "processing").map((u) => u.matched).sort()).toEqual([0, 1]);
    expect(runtime.email).toHaveBeenCalledTimes(1);
    expect(runtime.db!.jobs[0]).toMatchObject({ status: "completed", attempts: 1, next_retry_at: null });
  });

  it("forces two workers racing the same webhook job to dispatch once", async () => {
    runtime.db = new FakeDatabase([fixture({ job_type: "webhook", payload: { event: "appointment.created", data: {} } })]);
    runtime.db.readBarrierCount = 2;
    const results = await Promise.all([processPendingJobs(), processPendingJobs()]);
    expect(results.sort()).toEqual([0, 1]);
    expect(runtime.webhook).toHaveBeenCalledTimes(1);
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.db.jobs[0]).toMatchObject({ status: "completed", attempts: 1 });
  });

  it("does not claim or send historically completed or cancelled recovery jobs", async () => {
    const completed = Array.from({ length: 11 }, (_, i) => fixture({
      id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      status: "completed",
      completed_at: "2026-09-06T00:36:50.707Z",
      payload: { ...fixture().payload, templateKey: "appointment.confirmation" },
    }));
    const cancelled = fixture({
      id: "10000000-0000-4000-8000-000000000099",
      status: "cancelled",
      cancelled_at: "2026-09-06T00:36:50.707Z",
    });
    runtime.db = new FakeDatabase([...completed, cancelled]);
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.sms).not.toHaveBeenCalled();
    expect(runtime.webhook).not.toHaveBeenCalled();
    for (const row of completed) {
      expect(await claimBackgroundJob(runtime.db.client as never, row)).toBeNull();
    }
    expect(await claimBackgroundJob(runtime.db.client as never, cancelled)).toBeNull();
    expect(runtime.db.jobs.every((job) => job.status === "completed" || job.status === "cancelled")).toBe(true);
    expect(runtime.db.updates).toHaveLength(0);
  });

  it("blocks processing before the reliability gate and never touches storage", async () => {
    vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "false");
    await expect(processPendingJobs()).rejects.toThrow("held");
    await expect(processJob(fixture())).rejects.toThrow("held");
    expect(runtime.db!.candidateSnapshots).toHaveLength(0);
    expect(runtime.email).not.toHaveBeenCalled();
  });

  it("does not allow direct execution without an acquired claim", async () => {
    await expect(processJob(fixture())).rejects.toThrow("atomically claimed");
    expect(runtime.email).not.toHaveBeenCalled();
  });

  it("fails an unsupported job type without sending email, SMS, or webhooks", async () => {
    runtime.db = new FakeDatabase([fixture({ job_type: "not_a_real_job_type" as BackgroundJob["job_type"] })]);
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.sms).not.toHaveBeenCalled();
    expect(runtime.webhook).not.toHaveBeenCalled();
    expect(runtime.db.jobs[0]).toMatchObject({
      status: "pending", attempts: 1, completed_at: null,
    });
    expect(runtime.db.jobs[0].error_message).toMatch(/Unknown job type/);
    runtime.db.jobs[0].attempts = 2;
    runtime.db.jobs[0].scheduled_at = "2026-01-01T00:00:00Z";
    runtime.db.jobs[0].next_retry_at = null;
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.db.jobs[0]).toMatchObject({ status: "failed", attempts: 3, next_retry_at: null });
    expect(runtime.email).not.toHaveBeenCalled();
  });

  it("fails a malformed email job without contacting a provider", async () => {
    runtime.db = new FakeDatabase([fixture({
      payload: {
        sendIntentId: INTENT,
        sendIntentProtocol: "durable-v1",
        templateKey: "custom",
      },
    })]);
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.sms).not.toHaveBeenCalled();
    expect(runtime.db.jobs[0]).toMatchObject({
      status: "failed", attempts: 1, next_retry_at: null,
    });
    expect(runtime.db.jobs[0].error_message).toBe("reconciliation_required:execution_outcome_unconfirmed");
  });

  it("propagates a claim DB failure without provider execution", async () => {
    runtime.db!.failClaim = true;
    await expect(processPendingJobs()).rejects.toThrow("claim could not be confirmed");
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.db!.jobs[0].status).toBe("pending");
    expect(runtime.error).toHaveBeenCalledWith("worker", "claim_persistence_failed", expect.any(Object));
  });

  it("observes an uncertain claim transport outcome and never dispatches", async () => {
    runtime.db!.throwClaim = true;
    await expect(processPendingJobs()).rejects.toThrow("claim could not be confirmed");
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.error).toHaveBeenCalledWith("worker", "claim_persistence_failed", expect.objectContaining({ databaseCode: "transport_failure" }));
  });

  it.each(["cancelled", "completed", "processing"] as const)("cannot reclaim a %s candidate", async (status) => {
    const row = fixture({ status });
    runtime.db = new FakeDatabase([row]);
    const claimed = await claimBackgroundJob(runtime.db.client as never, row);
    expect(claimed).toBeNull();
    expect(runtime.db.updates).toHaveLength(0);
  });

  it.each([
    { attempts: 3, max_attempts: 3 },
    { scheduled_at: "2999-01-01T00:00:00Z" },
    { next_retry_at: "2999-01-01T00:00:00Z" },
    { cancelled_at: "2026-01-01T00:00:00Z" },
  ])("preserves eligibility at the claim boundary: %j", async (overrides) => {
    const row = fixture(overrides);
    runtime.db = new FakeDatabase([row]);
    expect(await claimBackgroundJob(runtime.db.client as never, row)).toBeNull();
    expect(runtime.db.updates).toHaveLength(0);
  });

  it.each([
    { status: "cancelled" }, { attempts: 3 }, { max_attempts: 0 },
    { business_id: OTHER_BUSINESS }, { next_retry_at: "2999-01-01T00:00:00Z" },
    { scheduled_at: "2999-01-01T00:00:00Z" }, { cancelled_at: "2026-01-01T00:00:00Z" },
  ])("checks live eligibility, not just the selected snapshot: %j", async (changes) => {
    const snapshot = copy(runtime.db!.jobs[0]);
    Object.assign(runtime.db!.jobs[0], changes);
    expect(await claimBackgroundJob(runtime.db!.client as never, snapshot)).toBeNull();
    expect(runtime.email).not.toHaveBeenCalled();
  });

  it("fences finalization against a different owner without overwriting state", async () => {
    const claim = await claimBackgroundJob(runtime.db!.client as never, copy(runtime.db!.jobs[0]));
    runtime.db!.jobs[0].error_message = "worker_claim:another-owner";
    await expect(finalizeClaimedJob(runtime.db!.client as never, claim!, {
      status: "completed", completed_at: new Date().toISOString(), error_message: null, next_retry_at: null,
    })).rejects.toThrow("requires reconciliation");
    expect(runtime.db!.jobs[0].error_message).toBe("worker_claim:another-owner");
  });
});

describe("worker delivery failure boundaries", () => {
  it.each([
    ["calendar_sync", "calendar"], ["webhook", "webhook"],
    ["recurring", "recurring"], ["waitlist_notify", "waitlist"],
  ] as const)("preserves baseline bounded retries for noncommunication %s errors", async (jobType, handler) => {
    runtime.db!.jobs[0].job_type = jobType;
    if (jobType === "waitlist_notify") runtime.db!.jobs[0].payload.appointmentId = APPOINTMENT;
    runtime[handler].mockRejectedValue(new Error("Synthetic integration failure"));
    const before = Date.now();
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.db!.jobs[0]).toMatchObject({
      status: "pending", attempts: 1, error_message: "Synthetic integration failure", completed_at: null,
    });
    expect(Date.parse(runtime.db!.jobs[0].next_retry_at!)).toBeGreaterThanOrEqual(before + 60_000);
    expect(runtime.email).not.toHaveBeenCalled();
    runtime.db!.jobs[0].attempts = 2;
    runtime.db!.jobs[0].scheduled_at = "2026-01-01T00:00:00Z";
    runtime.db!.jobs[0].next_retry_at = null;
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.db!.jobs[0]).toMatchObject({ status: "failed", attempts: 3, next_retry_at: null });
    expect(runtime[handler]).toHaveBeenCalledTimes(2);
    if (jobType === "waitlist_notify") {
      expect(runtime.waitlist).toHaveBeenCalledWith(BUSINESS, APPOINTMENT, fixture().id);
    }
  });

  it("holds an unprotected legacy job without inferring sent status from missing logs", async () => {
    delete runtime.db!.jobs[0].payload.sendIntentId;
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.db!.jobs[0]).toMatchObject({ status: "failed", next_retry_at: null, error_message: "reconciliation_required:legacy_send_intent_missing" });
  });

  it("holds a pre-enable job with a new-looking UUID but no durable protocol marker", async () => {
    // A flag-off inline send could already have succeeded while its queue write
    // failed. Merely generating a UUID did not establish a pre-provider guard.
    delete runtime.db!.jobs[0].payload.sendIntentProtocol;
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.db!.jobs[0].error_message).toBe("reconciliation_required:legacy_send_intent_missing");
  });

  it("retries only explicit confirmed non-acceptance with exponential scheduling", async () => {
    runtime.email.mockResolvedValue({ ok: false, deliveryState: "rejected", retrySafe: true });
    const before = Date.now();
    expect(await processPendingJobs()).toBe(0);
    const row = runtime.db!.jobs[0];
    expect(row).toMatchObject({ status: "pending", attempts: 1, completed_at: null, error_message: "retry_safe:provider_confirmed_not_accepted" });
    expect(row.scheduled_at).toBe(row.next_retry_at);
    expect(Date.parse(row.next_retry_at!)).toBeGreaterThanOrEqual(before + 60_000);
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).toHaveBeenCalledTimes(1);
  });

  it("stops at max_attempts without incrementing it again", async () => {
    runtime.db!.jobs[0].attempts = 2;
    runtime.email.mockResolvedValue({ ok: false, deliveryState: "rejected", retrySafe: true });
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.db!.jobs[0]).toMatchObject({ status: "failed", attempts: 3, next_retry_at: null });
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).toHaveBeenCalledTimes(1);
  });

  it.each([
    { ok: false, deliveryState: "unknown", retrySafe: false, reconciliationRequired: true },
    { ok: false, deliveryState: "rejected", retrySafe: true, reconciliationRequired: true },
    { ok: false, error: "old adapter has no acceptance classification" },
  ] satisfies SendResult[])("holds ambiguous/unpersisted outcomes without retry: %j", async (result) => {
    runtime.email.mockResolvedValue(result);
    await processPendingJobs();
    expect(runtime.db!.jobs[0]).toMatchObject({ status: "failed", next_retry_at: null });
    expect(runtime.db!.jobs[0].error_message).toMatch(/^reconciliation_required:/);
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).toHaveBeenCalledTimes(1);
  });

  it("keeps accepted delivery completed despite a reported bookkeeping warning", async () => {
    runtime.email.mockResolvedValue({ ok: true, deliveryState: "accepted", reconciliationRequired: true, retrySafe: false });
    expect(await processPendingJobs()).toBe(1);
    expect(runtime.db!.jobs[0].status).toBe("completed");
    expect(runtime.warn).toHaveBeenCalledWith("worker", "accepted_delivery_bookkeeping_unconfirmed", expect.any(Object));
  });

  it("preserves provider acceptance when receipt metadata update fails", async () => {
    runtime.db!.jobs[0].payload.templateKey = "commerce.receipt";
    runtime.db!.jobs[0].payload.receiptId = "06000000-0000-4000-8000-000000000001";
    runtime.db!.failReceipt = true;
    expect(await processPendingJobs()).toBe(1);
    expect(runtime.db!.jobs[0].status).toBe("completed");
    expect(runtime.email).toHaveBeenCalledTimes(1);
    expect(runtime.error).toHaveBeenCalledWith("worker", "receipt_delivery_bookkeeping_unconfirmed", expect.objectContaining({ accepted: true }));
  });

  it("does not turn a completion-write error into a provider retry", async () => {
    runtime.db!.failFinalize = true;
    await expect(processPendingJobs()).rejects.toThrow("finalization requires reconciliation");
    expect(runtime.db!.jobs[0]).toMatchObject({ status: "processing", attempts: 1 });
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).toHaveBeenCalledTimes(1);
    expect(runtime.db!.updates.filter((u) => u.patch.status === "pending")).toHaveLength(0);
  });

  it("logs and surfaces finalization connection loss without rescheduling", async () => {
    runtime.db!.throwFinalize = true;
    await expect(processPendingJobs()).rejects.toThrow("finalization requires reconciliation");
    expect(runtime.db!.jobs[0].status).toBe("processing");
    expect(runtime.email).toHaveBeenCalledTimes(1);
    expect(runtime.error).toHaveBeenCalledWith("worker", "job_finalization_unconfirmed", expect.objectContaining({ databaseCode: "transport_failure" }));
  });

  it("reports lost commit acknowledgement while the completed row prevents another send", async () => {
    runtime.db!.finalizeThenLoseResponse = true;
    await expect(processPendingJobs()).rejects.toThrow("requires reconciliation");
    expect(runtime.db!.jobs[0].status).toBe("completed");
    expect(await processPendingJobs()).toBe(0);
    expect(runtime.email).toHaveBeenCalledTimes(1);
  });

  it("also surfaces failed/hold-state finalization errors", async () => {
    runtime.email.mockResolvedValue({ ok: false, deliveryState: "unknown", retrySafe: false });
    runtime.db!.failFinalize = true;
    await expect(processPendingJobs()).rejects.toThrow("requires reconciliation");
    expect(runtime.db!.jobs[0].status).toBe("processing");
    expect(runtime.error).toHaveBeenCalledWith("worker", "job_finalization_unconfirmed", expect.any(Object));
  });
});

describe("durable intent integration with worker re-entry", () => {
  it("same owned job dispatched twice reaches the provider once through the real durable guard", async () => {
    const store = new MemoryIntentStore();
    const provider = vi.fn().mockResolvedValue({ success: true, provider: "synthetic", messageId: "synthetic-id" });
    useDurableProvider(store, provider);
    const claim = await claimBackgroundJob(runtime.db!.client as never, copy(runtime.db!.jobs[0]));
    const outcomes = await Promise.allSettled([processJob(claim!), processJob(claim!)]);
    expect(outcomes.map((outcome) => outcome.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("failure after provider accepted but before result persistence leaves a durable no-replay guard", async () => {
    const store = new MemoryIntentStore();
    store.failResultPersistence = true;
    const provider = vi.fn().mockResolvedValue({ success: true, provider: "synthetic", messageId: "synthetic-id" });
    useDurableProvider(store, provider);
    const claim = await claimBackgroundJob(runtime.db!.client as never, copy(runtime.db!.jobs[0]));
    await processJob(claim!);
    expect([...store.rows.values()][0].state).toBe("sending");
    // A fresh worker invocation/service wrapper shares only durable store state.
    useDurableProvider(store, provider);
    await expect(processJob(claim!)).rejects.toThrow("provider_outcome_unconfirmed");
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("crash after durable acceptance before job finalization does not resend on re-entry", async () => {
    const store = new MemoryIntentStore();
    const provider = vi.fn().mockResolvedValue({ success: true, provider: "synthetic", messageId: "synthetic-id" });
    useDurableProvider(store, provider);
    const claim = await claimBackgroundJob(runtime.db!.client as never, copy(runtime.db!.jobs[0]));
    await processJob(claim!); // Crash boundary: finalization intentionally never called.
    useDurableProvider(store, provider);
    await processJob(claim!);
    expect(provider).toHaveBeenCalledTimes(1);
    expect([...store.rows.values()][0].state).toBe("accepted");
  });

  it("does not suppress two distinct occurrence IDs sharing an old weak event key", async () => {
    const first = fixture();
    first.payload.idempotencyKey = "old-weak-appointment-rescheduled-key";
    const second = fixture({ id: "10000000-0000-4000-8000-000000000002", payload: {
      ...copy(first.payload), sendIntentId: "03000000-0000-4000-8000-000000000002",
    } });
    runtime.db = new FakeDatabase([first, second]);
    const provider = vi.fn().mockResolvedValue({ success: true, provider: "synthetic", messageId: "synthetic-id" });
    useDurableProvider(new MemoryIntentStore(), provider);
    expect(await processPendingJobs()).toBe(2);
    expect(provider).toHaveBeenCalledTimes(2);
  });

  it("confirmed rejection persists and permits a later safe provider attempt", async () => {
    const store = new MemoryIntentStore();
    const provider = vi.fn().mockResolvedValueOnce({ success: false, provider: "synthetic", retrySafe: true })
      .mockResolvedValueOnce({ success: true, provider: "synthetic", messageId: "synthetic-id" });
    useDurableProvider(store, provider);
    await processPendingJobs();
    expect([...store.rows.values()][0].state).toBe("rejected");
    runtime.db!.jobs[0].next_retry_at = "2026-01-01T00:00:00Z";
    runtime.db!.jobs[0].scheduled_at = "2026-01-01T00:00:00Z";
    expect(await processPendingJobs()).toBe(1);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(runtime.db!.jobs[0].attempts).toBe(2);
  });
});

describe("tenant and reminder boundaries", () => {
  it("rejects a direct context from another tenant before delivery", async () => {
    (runtime.db!.jobs[0].payload.directContext as Row).businessId = OTHER_BUSINESS;
    await processPendingJobs();
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.db!.jobs[0].error_message).toBe("reconciliation_required:context_tenant_mismatch");
  });

  it("rejects a customer belonging to another tenant", async () => {
    (runtime.db!.jobs[0].payload.directContext as Row).customerId = CUSTOMER;
    runtime.db!.tables.customers = [{ id: CUSTOMER, business_id: OTHER_BUSINESS }];
    await processPendingJobs();
    expect(runtime.email).not.toHaveBeenCalled();
    expect(runtime.db!.jobs[0].error_message).toBe("reconciliation_required:customer_tenant_unverified");
  });

  it("passes tenant scope to appointment context and retains reminder identity", async () => {
    runtime.db!.jobs[0].job_type = "reminder";
    runtime.db!.jobs[0].payload = { appointmentId: APPOINTMENT, channel: "email", sendIntentId: INTENT, sendIntentProtocol: "durable-v1", recipient: "frozen@example.invalid" };
    runtime.loadContext.mockResolvedValue({
      businessId: BUSINESS, appointmentId: APPOINTMENT, businessName: "Synthetic business",
      customerName: "Synthetic customer", customerId: CUSTOMER, customerEmail: "current@example.invalid",
      staffName: "Synthetic staff", serviceName: "Synthetic service", startTime: "2026-01-01T00:00:00Z",
    });
    runtime.db!.tables.customers = [{ id: CUSTOMER, business_id: BUSINESS }];
    expect(await processPendingJobs()).toBe(1);
    expect(runtime.loadContext).toHaveBeenCalledWith(APPOINTMENT, BUSINESS);
    expect(runtime.email).toHaveBeenCalledWith(expect.objectContaining({
      to: "frozen@example.invalid", templateKey: "appointment.reminder",
      reliability: { intentId: INTENT, jobId: fixture().id, attempt: 1, source: "worker" },
    }));
  });

  it("rejects an unverified rich appointment context from another tenant", async () => {
    runtime.db!.jobs[0].payload = { appointmentId: APPOINTMENT, templateKey: "appointment.confirmation", sendIntentId: INTENT, sendIntentProtocol: "durable-v1" };
    runtime.loadContext.mockResolvedValue({ businessId: OTHER_BUSINESS, customerEmail: "foreign@example.invalid", customerId: null });
    await processPendingJobs();
    expect(runtime.email).not.toHaveBeenCalled();
  });
});

describe("manual queue retry safeguards", () => {
  function retryableFixture() {
    runtime.db!.jobs[0].status = "failed";
    runtime.db!.jobs[0].attempts = 1;
    runtime.db!.jobs[0].error_message = "retry_safe:provider_confirmed_not_accepted";
    runtime.db!.tables.communication_send_intents = [{
      id: "07000000-0000-4000-8000-000000000001", business_id: BUSINESS,
      intent_key: sendIntentKey(INTENT, "email", "custom"), state: "rejected",
    }];
  }

  it.each(["completed", "cancelled", "processing", "pending"] as const)("never reactivates a %s row", async (status) => {
    retryableFixture(); runtime.db!.jobs[0].status = status;
    expect((await retryNotification(BUSINESS, fixture().id)).ok).toBe(false);
    expect(runtime.db!.jobs[0].status).toBe(status);
  });
  it.each(["sending", "unknown", "accepted"])("refuses a durable %s intent even with a stale safe marker", async (state) => {
    retryableFixture(); runtime.db!.tables.communication_send_intents[0].state = state;
    expect((await retryNotification(BUSINESS, fixture().id)).ok).toBe(false);
    expect(runtime.db!.jobs[0].status).toBe("failed");
  });
  it("refuses exhausted jobs and unknown failures", async () => {
    retryableFixture(); runtime.db!.jobs[0].attempts = 3;
    expect((await retryNotification(BUSINESS, fixture().id)).ok).toBe(false);
    runtime.db!.jobs[0].attempts = 1;
    runtime.db!.jobs[0].error_message = "reconciliation_required:provider_outcome_unconfirmed";
    expect((await retryNotification(BUSINESS, fixture().id)).ok).toBe(false);
  });
  it("allows a checked retry with confirmed rejection and attempts remaining", async () => {
    retryableFixture();
    expect(await retryNotification(BUSINESS, fixture().id)).toEqual({ ok: true });
    expect(runtime.db!.jobs[0]).toMatchObject({ status: "pending", attempts: 1, next_retry_at: null });
  });
  it("rejects a concurrent terminal-state change without clearing cancellation", async () => {
    retryableFixture();
    runtime.db!.beforeUpdate = () => { runtime.db!.jobs[0].status = "cancelled"; runtime.db!.jobs[0].cancelled_at = "2026-01-01T00:00:00Z"; };
    expect((await retryNotification(BUSINESS, fixture().id)).ok).toBe(false);
    expect(runtime.db!.jobs[0]).toMatchObject({ status: "cancelled", cancelled_at: "2026-01-01T00:00:00Z" });
  });
  it("denies another tenant and fails closed when intent evidence cannot be read", async () => {
    retryableFixture();
    expect((await retryNotification(OTHER_BUSINESS, fixture().id)).ok).toBe(false);
    runtime.db!.failIntentRead = true;
    expect((await retryNotification(BUSINESS, fixture().id)).ok).toBe(false);
    expect(runtime.db!.jobs[0].status).toBe("failed");
  });
});
