// @vitest-environment node
/**
 * Opt-in live Staging proof of the bounded webhook hold.
 * NEVER calls processPendingJobs (would scan the existing Staging backlog).
 * NEVER targets Production. Providers stubbed in this process only.
 */
import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { BackgroundJob } from "@/lib/types/integrations";

const STAGING_REF = "wnfahklzaxirftyskctd";
const PRODUCTION_REF = "kxcydvhswkuzepwzzinq";
const MARKER = "chasum-isolated-staging-webhook-hold-20260908";
const TEMPLATE = "chasum.isolated.webhook.hold";
const BIZ = "034dcb21-eb46-489b-adaf-2a2a3e2ae41f";
const EMAIL_TO = "isolated-webhook-hold@example.invalid";

const enabled = process.env.CHASUM_RUN_STAGING_WEBHOOK_HOLD_TEST === "1";

const stubs = vi.hoisted(() => ({
  email: vi.fn(),
  sms: vi.fn(),
  webhook: vi.fn(),
  calendar: vi.fn(),
  recurring: vi.fn(),
  waitlist: vi.fn(),
}));

vi.mock("@/lib/communications/providers", () => ({
  providerSendEmail: (...args: unknown[]) => stubs.email(...args),
  providerSendSms: (...args: unknown[]) => stubs.sms(...args),
  getEmailProvider: () => ({ name: "isolated-stub", send: stubs.email }),
  getSmsProvider: () => ({ name: "isolated-stub", send: stubs.sms }),
}));
vi.mock("@/lib/integrations/webhooks/dispatch", () => ({
  dispatchWebhooks: (...args: unknown[]) => stubs.webhook(...args),
}));
vi.mock("@/lib/integrations/calendar/sync", () => ({
  syncCalendarConnection: (...args: unknown[]) => stubs.calendar(...args),
}));
vi.mock("@/lib/integrations/automation/recurring", () => ({
  generateRecurringOccurrences: (...args: unknown[]) => stubs.recurring(...args),
}));
vi.mock("@/lib/integrations/automation/waitlist", () => ({
  notifyWaitlistForSlot: (...args: unknown[]) => stubs.waitlist(...args),
}));

import { createServiceClient } from "@/lib/supabase/service";
import { claimBackgroundJob } from "@/lib/integrations/jobs/claim";
import { processClaimedJob, selectPendingJobCandidates } from "@/lib/integrations/jobs/processor";

type FingerprintRow = {
  id: string;
  status: string;
  attempts: number;
  scheduled_at: string;
  next_retry_at: string | null;
  cancelled_at: string | null;
  job_type: string;
  started_at: string | null;
  completed_at: string | null;
};

const trackedJobIds: string[] = [];
let baselinePending: ReturnType<typeof fingerprintRows> | null = null;
let cleaned = false;

function supabaseRef(url: string | undefined): string | null {
  return String(url ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] ?? null;
}

function assertStagingOnly(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref = supabaseRef(url);
  if (ref !== STAGING_REF) {
    throw new Error(`HOLD: webhook-hold harness requires Staging ref ${STAGING_REF}; got ${ref ?? "none"}`);
  }
  if (url.includes(PRODUCTION_REF)) {
    throw new Error("HOLD: Production identity in Staging webhook-hold harness");
  }
  if (process.env.CHASUM_SUPABASE_TARGET && process.env.CHASUM_SUPABASE_TARGET !== "staging") {
    throw new Error("HOLD: CHASUM_SUPABASE_TARGET is not staging");
  }
  if (process.env.RESEND_API_KEY || process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_AUTH_TOKEN) {
    throw new Error("HOLD: provider credentials must not be present");
  }
  if (process.env.CHASUM_WORKER_WEBHOOKS_ENABLED === "true") {
    throw new Error("HOLD: webhook gate must be false/absent for this Staging proof");
  }
}

function fingerprintRows(rows: FingerprintRow[]) {
  const ordered = [...rows].sort((a, b) => a.id.localeCompare(b.id));
  const canonical = ordered
    .map((row) =>
      [
        row.id,
        row.status,
        String(row.attempts),
        row.scheduled_at,
        row.next_retry_at ?? "",
        row.cancelled_at ?? "",
        row.job_type,
        row.started_at ?? "",
        row.completed_at ?? "",
      ].join("|"),
    )
    .join("\n");
  return {
    count: ordered.length,
    sha256: createHash("sha256").update(canonical).digest("hex"),
  };
}

async function snapshotPending(client: ReturnType<typeof createServiceClient>) {
  const { data, error } = await client
    .from("background_jobs")
    .select("id,status,attempts,scheduled_at,next_retry_at,cancelled_at,job_type,started_at,completed_at")
    .eq("status", "pending")
    .order("id");
  if (error) throw new Error(`pending snapshot failed: ${error.message}`);
  const rows = ((data ?? []) as FingerprintRow[]).filter((row) => !trackedJobIds.includes(row.id));
  return fingerprintRows(rows);
}

async function insertMarked(
  client: ReturnType<typeof createServiceClient>,
  jobType: "email" | "webhook",
): Promise<BackgroundJob> {
  const payload = jobType === "webhook"
    ? {
        chasumIsolatedRuntimeMarker: MARKER,
        event: "chasum.isolated.webhook.hold",
        data: { marker: MARKER },
      }
    : {
        chasumIsolatedRuntimeMarker: MARKER,
        templateKey: TEMPLATE,
        recipient: EMAIL_TO,
        skipPreferenceCheck: true,
        sendIntentProtocol: "durable-v1",
        sendIntentId: randomUUID(),
        directContext: {
          businessId: BIZ,
          businessName: "Isolated Webhook Hold",
          customerName: "Isolated Recipient",
          staffName: "Isolated Staff",
          serviceName: "Isolated Service",
          startTime: "2026-09-08T16:00:00Z",
        },
      };
  const { data, error } = await client.from("background_jobs").insert({
    business_id: BIZ,
    job_type: jobType,
    status: "pending",
    scheduled_at: new Date().toISOString(),
    attempts: 0,
    max_attempts: 3,
    payload,
  }).select("*").single();
  if (error || !data) throw new Error(`synthetic insert failed: ${error?.message ?? "no row"}`);
  trackedJobIds.push(data.id as string);
  return data as BackgroundJob;
}

async function loadMarked(client: ReturnType<typeof createServiceClient>, id: string) {
  const { data, error } = await client.from("background_jobs").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new Error(`synthetic load failed: ${error?.message ?? "missing"}`);
  if ((data.payload as { chasumIsolatedRuntimeMarker?: string }).chasumIsolatedRuntimeMarker !== MARKER) {
    throw new Error("refusing to operate on an unmarked background job");
  }
  return data as BackgroundJob;
}

async function cleanupSynthetics(client: ReturnType<typeof createServiceClient>) {
  if (cleaned) return;
  cleaned = true;
  if (trackedJobIds.length) {
    await client.from("background_jobs").delete().in("id", trackedJobIds).contains("payload", {
      chasumIsolatedRuntimeMarker: MARKER,
    });
    await client.from("notification_logs").delete().in("job_id", trackedJobIds);
  }
  await client.from("background_jobs").delete().contains("payload", {
    chasumIsolatedRuntimeMarker: MARKER,
  });
  await client.from("communication_send_intents").delete().eq("template_key", TEMPLATE);
}

describe.skipIf(!enabled)("Staging bounded webhook hold", { timeout: 60_000, hookTimeout: 30_000 }, () => {
  let client: ReturnType<typeof createServiceClient>;

  beforeAll(async () => {
    assertStagingOnly();
    if (process.env.CHASUM_WORKER_RELIABILITY_ENABLED !== "true") {
      throw new Error("HOLD: reliability flag must be true in this local harness only");
    }
    client = createServiceClient();
    baselinePending = await snapshotPending(client);
    stubs.email.mockResolvedValue({ success: true, messageId: "stub-email-hold", provider: "isolated-stub" });
    stubs.webhook.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    if (!enabled) return;
    try {
      await cleanupSynthetics(createServiceClient());
    } catch (error) {
      console.error("synthetic cleanup error", error instanceof Error ? error.message : "unknown");
    }
  });

  it("excludes synthetic webhooks from queue selection and leaves existing Staging jobs unchanged", async () => {
    assertStagingOnly();
    const webhook = await insertMarked(client, "webhook");
    const email = await insertMarked(client, "email");
    const candidates = await selectPendingJobCandidates(client, 100);
    const candidateIds = new Set(candidates.map((row) => row.id));
    expect(candidateIds.has(webhook.id)).toBe(false);
    expect(candidateIds.has(email.id)).toBe(true);
    expect(candidates.some((row) => row.job_type === "webhook" && row.id === webhook.id)).toBe(false);

    const claimedEmail = await claimBackgroundJob(client, await loadMarked(client, email.id));
    expect(claimedEmail).not.toBeNull();
    expect(await processClaimedJob(client, claimedEmail!)).toBe(true);
    expect(stubs.email).toHaveBeenCalledTimes(1);
    expect(stubs.webhook).not.toHaveBeenCalled();
    expect((await loadMarked(client, email.id)).status).toBe("completed");

    const held = await loadMarked(client, webhook.id);
    expect(held.status).toBe("pending");
    expect(held.attempts).toBe(0);
    expect(held.started_at).toBeNull();

    await cleanupSynthetics(client);
    const after = await snapshotPending(client);
    expect(after).toEqual(baselinePending);
  });
});
