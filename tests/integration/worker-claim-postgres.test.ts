// @vitest-environment node
/**
 * Opt-in local DML test against the existing disposable rehearsal DB clone.
 * NEVER applies a migration or accepts a URL/host/credential from the environment.
 * The intent ledger is intentionally absent: this proves real PostgreSQL queue
 * CAS/finalization, with a provider stub, not execution of the prepared migration.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { BackgroundJob } from "@/lib/types/integrations";
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/communications", () => ({ sendEmail: vi.fn(), sendSMS: vi.fn(), computeBackoffMs: () => 60_000 }));
vi.mock("@/lib/integrations/calendar/apple", () => ({ generateSingleEventIcs: vi.fn() }));
vi.mock("@/lib/integrations/calendar/sync", () => ({ syncCalendarConnection: vi.fn() }));
vi.mock("@/lib/integrations/webhooks/dispatch", () => ({ dispatchWebhooks: vi.fn() }));
vi.mock("@/lib/integrations/automation/recurring", () => ({ generateRecurringOccurrences: vi.fn() }));
vi.mock("@/lib/integrations/automation/waitlist", () => ({ notifyWaitlistForSlot: vi.fn() }));
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/communications";
import { processPendingJobs } from "@/lib/integrations/jobs/processor";
import { claimBackgroundJob, finalizeClaimedJob } from "@/lib/integrations/jobs/claim";

const enabled = process.env.CHASUM_RUN_LOCAL_PG_CLAIM_TEST === "1";
const exec = promisify(execFile);
const socket = "/private/tmp/chasum-029-rehearsal/socket";
const dbName = "rehearsal_worker_claim";
const businessId = "02000000-0000-4000-8000-000000000003";
const quote = (value: unknown): string => value == null ? "NULL" : typeof value === "number" ? String(value) : `'${String(value).replaceAll("'", "''")}'`;
const column = (name: string) => {
  if (!["id", "business_id", "status", "attempts", "max_attempts", "cancelled_at", "scheduled_at", "next_retry_at", "started_at", "completed_at", "error_message"].includes(name)) throw Error("Unsupported test column");
  return `"${name}"`;
};
async function sql(statement: string): Promise<string> {
  const { stdout } = await exec("/opt/homebrew/opt/postgresql@17/bin/psql", [
    "-X", "-w", "-A", "-t", "-q", "-v", "ON_ERROR_STOP=1", "-h", socket,
    "-p", "55479", "-U", "rehearsal_owner", "-d", dbName, "-c", statement,
  ], { timeout: 10_000, env: { PATH: "/usr/bin:/bin", PGPASSFILE: "/private/tmp/chasum-029-rehearsal/empty-pgpass", PGSERVICEFILE: "/private/tmp/chasum-029-rehearsal/empty-pgservice" } });
  return stdout.trim();
}
const values = async (statement: string): Promise<BackgroundJob[]> => JSON.parse(await sql(`SELECT coalesce(json_agg(t),'[]'::json) FROM (${statement}) t;`));

/** Translates the production Supabase query's predicates directly into SQL. */
class Query {
  filters: string[] = [];
  changes?: Record<string, unknown>;
  max = 50;
  constructor(private adapter: Adapter) {}
  select() { return this; }
  update(changes: Record<string, unknown>) { this.changes = changes; return this; }
  eq(key: string, value: unknown) { this.filters.push(`${column(key)}=${quote(value)}`); return this; }
  is(key: string, value: unknown) { if (value !== null) throw Error("Only NULL supported"); this.filters.push(`${column(key)} IS NULL`); return this; }
  lte(key: string, value: unknown) { this.filters.push(`${column(key)}<=${quote(value)}`); return this; }
  or(expression: string) {
    const prefix = "next_retry_at.is.null,next_retry_at.lte.";
    if (!expression.startsWith(prefix)) throw Error("Unsupported test OR");
    this.filters.push(`(next_retry_at IS NULL OR next_retry_at<=${quote(expression.slice(prefix.length))})`); return this;
  }
  order() { return this; }
  limit(n: number) { if (!Number.isInteger(n) || n < 1 || n > 100) throw Error("Invalid test limit"); this.max = n; return this; }
  then(resolve: (value: { data: BackgroundJob[]; error: null }) => unknown, reject: (error: unknown) => unknown) {
    return this.run().then(resolve, reject);
  }
  async run() {
    const where = this.filters.join(" AND ") || "true";
    let data: BackgroundJob[];
    if (this.changes) {
      const set = Object.entries(this.changes).map(([key, value]) => `${column(key)}=${quote(value)}`).join(",");
      data = JSON.parse(await sql(`WITH changed AS (UPDATE public.background_jobs SET ${set} WHERE ${where} RETURNING *) SELECT coalesce(json_agg(changed),'[]'::json) FROM changed;`));
      if (this.changes.status === "processing") this.adapter.claimCounts.push(data.length);
    } else {
      data = await values(`SELECT * FROM public.background_jobs WHERE ${where} ORDER BY scheduled_at LIMIT ${this.max}`);
      if (this.adapter.barrier) await this.adapter.barrier(data);
    }
    return { data, error: null as null };
  }
}
class Adapter {
  claimCounts: number[] = [];
  barrier?: (rows: BackgroundJob[]) => Promise<void>;
  from(table: string) { if (table !== "background_jobs") throw Error("Non-queue SQL prohibited by test adapter"); return new Query(this); }
}

describe.skipIf(!enabled)("actual PostgreSQL worker ownership", () => {
  const inserted: string[] = [];
  let adapter: Adapter;
  beforeAll(async () => {
    const identity = JSON.parse(await sql("SELECT json_build_object('database',current_database(),'local',inet_server_addr() IS NULL,'directory',current_setting('data_directory'),'new_migration_absent',to_regclass('public.communication_send_intents') IS NULL);"));
    expect(identity).toEqual({ database: dbName, local: true, directory: "/private/tmp/chasum-029-rehearsal/pgdata", new_migration_absent: true });
  });
  beforeEach(() => {
    vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "true"); adapter = new Adapter();
    vi.mocked(createServiceClient).mockReturnValue(adapter as never);
    vi.mocked(sendEmail).mockReset().mockResolvedValue({ ok: true, deliveryState: "accepted", provider: "local-stub", messageId: "synthetic-only" });
  });
  afterEach(async () => {
    // Delete only fresh synthetic rows this test inserted, never historical jobs.
    for (const id of inserted.splice(0)) await sql(`DELETE FROM public.background_jobs WHERE id=${quote(id)} AND business_id=${quote(businessId)};`);
    vi.unstubAllEnvs();
  });
  async function seed(changes: Partial<BackgroundJob> = {}) {
    const id = randomUUID(); inserted.push(id);
    const payload = { sendIntentId: randomUUID(), sendIntentProtocol: "durable-v1", templateKey: "custom", recipient: "owned@example.invalid", directContext: { businessId, businessName: "Fictional", customerName: "Synthetic", staffName: "Synthetic", serviceName: "Synthetic", startTime: "2026-09-01T00:00:00Z" } };
    await sql(`INSERT INTO public.background_jobs(id,business_id,job_type,payload,status,scheduled_at,attempts,max_attempts,next_retry_at,cancelled_at) VALUES(${quote(id)},${quote(businessId)},'email',${quote(JSON.stringify(payload))}::jsonb,${quote(changes.status ?? "pending")},${quote(changes.scheduled_at ?? "2026-08-01T00:00:00Z")},${changes.attempts ?? 0},${changes.max_attempts ?? 3},${quote(changes.next_retry_at)},${quote(changes.cancelled_at)});`);
    return (await values(`SELECT * FROM public.background_jobs WHERE id=${quote(id)}`))[0];
  }

  it("two worker executions read the same candidate; one PostgreSQL UPDATE wins and only winner sends", async () => {
    const job = await seed();
    const snapshots: BackgroundJob[][] = [];
    let release!: () => void; const gate = new Promise<void>((r) => { release = r; });
    adapter.barrier = async (rows) => { snapshots.push(rows); if (snapshots.length === 2) release(); await gate; };
    const results = await Promise.all([processPendingJobs(1), processPendingJobs(1)]);
    expect(snapshots).toHaveLength(2);
    expect(snapshots.map((rows) => rows[0].id)).toEqual([job.id, job.id]);
    expect(snapshots.map((rows) => rows[0].status)).toEqual(["pending", "pending"]);
    expect(adapter.claimCounts.sort()).toEqual([0, 1]);
    expect(results.sort()).toEqual([0, 1]);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [final] = await values(`SELECT * FROM public.background_jobs WHERE id=${quote(job.id)}`);
    expect(final).toMatchObject({ status: "completed", attempts: 1 });
  });

  it("database rejects a stale candidate after eligibility changes", async () => {
    const job = await seed();
    await sql(`UPDATE public.background_jobs SET next_retry_at=now()+interval '1 day' WHERE id=${quote(job.id)};`);
    expect(await claimBackgroundJob(adapter as never, job)).toBeNull();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each(["cancelled", "completed"] as const)("stale read cannot reclaim a now-%s row", async (status) => {
    const job = await seed();
    await sql(`UPDATE public.background_jobs SET status=${quote(status)} WHERE id=${quote(job.id)};`);
    expect(await claimBackgroundJob(adapter as never, job)).toBeNull();
  });

  it("fenced finalization cannot overwrite changed ownership", async () => {
    const job = await seed(); const claim = await claimBackgroundJob(adapter as never, job);
    expect(claim).not.toBeNull();
    await sql(`UPDATE public.background_jobs SET error_message='worker_claim:replacement' WHERE id=${quote(job.id)};`);
    await expect(finalizeClaimedJob(adapter as never, claim!, { status: "completed", completed_at: new Date().toISOString(), next_retry_at: null, error_message: null })).rejects.toThrow("reconciliation");
    expect((await values(`SELECT * FROM public.background_jobs WHERE id=${quote(job.id)}`))[0]).toMatchObject({ status: "processing", error_message: "worker_claim:replacement" });
  });
});
