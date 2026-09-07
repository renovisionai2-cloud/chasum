// @vitest-environment node
/**
 * Opt-in live Staging application harness.
 * NEVER scans the pending queue. NEVER calls processPendingJobs.
 * NEVER targets Production. Provider adapters are stubbed in this process only.
 *
 * Enable with CHASUM_RUN_STAGING_ISOLATED_WORKER_TEST=1 and Staging-only env
 * (see scripts/run-staging-isolated-worker-runtime.mjs).
 */
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { BackgroundJob } from "@/lib/types/integrations";

const STAGING_REF = "wnfahklzaxirftyskctd";
const PRODUCTION_REF = "kxcydvhswkuzepwzzinq";
const MARKER = "chasum-isolated-staging-runtime-20260907";
const TEMPLATE = "chasum.isolated.runtime";
const BIZ_A = "034dcb21-eb46-489b-adaf-2a2a3e2ae41f";
const BIZ_B = "724d9ecd-438d-439e-952e-2d8c4ab4486c";
const EMAIL_TO = "isolated-runtime@example.invalid";
const SMS_TO = "+15555550100";

const enabled = process.env.CHASUM_RUN_STAGING_ISOLATED_WORKER_TEST === "1";

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
import { processClaimedJob, processJob } from "@/lib/integrations/jobs/processor";
import { createSendIntentStore, sendIntentKey } from "@/lib/communications/send-intent";
import { markRelatedJobs } from "@/lib/notifications/booking-delivery";

type FingerprintRow = {
  id: string;
  status: string;
  attempts: number;
  scheduled_at: string;
  next_retry_at: string | null;
  cancelled_at: string | null;
  job_type: string;
  business_id: string | null;
  started_at: string | null;
  completed_at: string | null;
};

const trackedJobIds: string[] = [];
const trackedIntentIds: string[] = [];
let baselinePending: ReturnType<typeof fingerprintRows> | null = null;
let baselineAll: ReturnType<typeof fingerprintRows> | null = null;
let cleaned = false;

function supabaseRef(url: string | undefined): string | null {
  const match = String(url ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

function assertStagingOnly(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref = supabaseRef(url);
  if (ref !== STAGING_REF) {
    throw new Error(`HOLD: isolated harness requires Staging ref ${STAGING_REF}; got ${ref ?? "none"}`);
  }
  if (url.includes(PRODUCTION_REF) || process.env.SUPABASE_SERVICE_ROLE_KEY === undefined) {
    throw new Error("HOLD: Production identity or missing Staging service role");
  }
  if (process.env.CHASUM_SUPABASE_TARGET && process.env.CHASUM_SUPABASE_TARGET !== "staging") {
    throw new Error("HOLD: CHASUM_SUPABASE_TARGET is not staging");
  }
  if (process.env.RESEND_API_KEY || process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_AUTH_TOKEN) {
    throw new Error("HOLD: provider credentials must not be present in the isolated harness process");
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
        row.business_id ?? "",
        row.started_at ?? "",
        row.completed_at ?? "",
      ].join("|"),
    )
    .join("\n");
  return {
    count: ordered.length,
    sha256: createHash("sha256").update(canonical).digest("hex"),
    idSha256: createHash("sha256").update(ordered.map((row) => row.id).join(",")).digest("hex"),
  };
}

function directContext(businessId: string) {
  return {
    businessId,
    businessName: "Isolated Runtime Synthetic",
    customerName: "Isolated Recipient",
    staffName: "Isolated Staff",
    serviceName: "Isolated Service",
    startTime: "2026-09-07T16:00:00Z",
    customMessage: "chasum isolated staging runtime — stub provider only",
  };
}

async function snapshotExisting(client: ReturnType<typeof createServiceClient>, pendingOnly: boolean) {
  let query = client
    .from("background_jobs")
    .select("id,status,attempts,scheduled_at,next_retry_at,cancelled_at,job_type,business_id,started_at,completed_at")
    .order("id");
  if (pendingOnly) query = query.eq("status", "pending");
  const { data, error } = await query;
  if (error) throw new Error(`existing-queue snapshot failed: ${error.message}`);
  const rows = (data ?? []) as FingerprintRow[];
  const unmarked = trackedJobIds.length
    ? rows.filter((row) => !trackedJobIds.includes(row.id))
    : rows;
  return fingerprintRows(unmarked);
}

async function insertJob(
  client: ReturnType<typeof createServiceClient>,
  overrides: Partial<BackgroundJob> & { payload?: Record<string, unknown> } = {},
): Promise<BackgroundJob> {
  const sendIntentId = typeof overrides.payload?.sendIntentId === "string"
    ? overrides.payload.sendIntentId
    : randomUUID();
  const businessId = overrides.business_id ?? BIZ_A;
  const payload: Record<string, unknown> = {
    chasumIsolatedRuntimeMarker: MARKER,
    templateKey: TEMPLATE,
    recipient: EMAIL_TO,
    skipPreferenceCheck: true,
    sendIntentProtocol: "durable-v1",
    sendIntentId,
    directContext: directContext(businessId),
  };
  for (const [key, value] of Object.entries(overrides.payload ?? {})) {
    if (value === undefined) delete payload[key];
    else payload[key] = value;
  }
  const row = {
    business_id: businessId,
    job_type: overrides.job_type ?? "email",
    status: overrides.status ?? "pending",
    scheduled_at: overrides.scheduled_at ?? new Date().toISOString(),
    started_at: overrides.started_at ?? null,
    completed_at: overrides.completed_at ?? null,
    next_retry_at: overrides.next_retry_at ?? null,
    cancelled_at: overrides.cancelled_at ?? null,
    attempts: overrides.attempts ?? 0,
    max_attempts: overrides.max_attempts ?? 3,
    error_message: overrides.error_message ?? null,
    payload,
  };
  const { data, error } = await client.from("background_jobs").insert(row).select("*").single();
  if (error || !data) throw new Error(`synthetic insert failed: ${error?.message ?? "no row"}`);
  trackedJobIds.push(data.id as string);
  return data as BackgroundJob;
}

async function loadMarked(
  client: ReturnType<typeof createServiceClient>,
  id: string,
): Promise<BackgroundJob> {
  const { data, error } = await client.from("background_jobs").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new Error(`synthetic load failed: ${error?.message ?? "missing"}`);
  if ((data.payload as { chasumIsolatedRuntimeMarker?: string }).chasumIsolatedRuntimeMarker !== MARKER) {
    throw new Error("refusing to operate on an unmarked background job");
  }
  return data as BackgroundJob;
}

async function driveMarked(
  client: ReturnType<typeof createServiceClient>,
  id: string,
): Promise<{ claimed: Awaited<ReturnType<typeof claimBackgroundJob>>; succeeded: boolean }> {
  const candidate = await loadMarked(client, id);
  const claimed = await claimBackgroundJob(client, candidate);
  if (!claimed) return { claimed: null, succeeded: false };
  const succeeded = await processClaimedJob(client, claimed);
  return { claimed, succeeded };
}

async function loadIntent(
  client: ReturnType<typeof createServiceClient>,
  businessId: string,
  intentId: string,
  channel: "email" | "sms",
) {
  const key = sendIntentKey(intentId, channel, TEMPLATE);
  const { data, error } = await client
    .from("communication_send_intents")
    .select("id,business_id,intent_key,state,attempt,owner_id,provider,provider_message_id,failure_code,source")
    .eq("business_id", businessId)
    .eq("intent_key", key)
    .maybeSingle();
  if (error) throw new Error(`intent load failed: ${error.message}`);
  if (data?.id) trackedIntentIds.push(data.id as string);
  return data;
}

async function cleanupSynthetics(client: ReturnType<typeof createServiceClient>) {
  if (cleaned) return;
  cleaned = true;
  if (trackedJobIds.length) {
    await client.from("background_jobs").delete().in("id", trackedJobIds).contains("payload", {
      chasumIsolatedRuntimeMarker: MARKER,
    });
    await client.from("notification_logs").delete().in("job_id", trackedJobIds);
    await client.from("communications_audit_log").delete().in("entity_id", trackedJobIds);
  }
  await client.from("background_jobs").delete().contains("payload", {
    chasumIsolatedRuntimeMarker: MARKER,
  });
  await client.from("notification_logs").delete().eq("recipient", EMAIL_TO);
  await client.from("notification_logs").delete().eq("recipient", SMS_TO);
  if (trackedIntentIds.length) {
    await client.from("communication_send_intents").delete().in("id", trackedIntentIds);
  }
  await client.from("communication_send_intents").delete().eq("template_key", TEMPLATE);
}

describe.skipIf(!enabled)("isolated Staging application worker runtime", { timeout: 120_000, hookTimeout: 60_000 }, () => {
  let client: ReturnType<typeof createServiceClient>;

  beforeAll(async () => {
    assertStagingOnly();
    if (process.env.CHASUM_WORKER_RELIABILITY_ENABLED !== "true") {
      throw new Error("HOLD: harness process must set CHASUM_WORKER_RELIABILITY_ENABLED=true locally only");
    }
    client = createServiceClient();
    const { error: intentErr } = await client.from("communication_send_intents").select("id").limit(1);
    if (intentErr) throw new Error(`HOLD: communication_send_intents unavailable: ${intentErr.message}`);
    baselinePending = await snapshotExisting(client, true);
    baselineAll = await snapshotExisting(client, false);
    if (baselinePending.count !== 20) {
      throw new Error(`HOLD: expected 20 unmarked pending jobs, found ${baselinePending.count}`);
    }
    stubs.email.mockResolvedValue({ success: true, messageId: "stub-email-1", provider: "isolated-stub" });
    stubs.sms.mockResolvedValue({ success: true, messageId: "stub-sms-1", provider: "isolated-stub" });
    stubs.webhook.mockResolvedValue(undefined);
    stubs.calendar.mockResolvedValue(undefined);
    stubs.recurring.mockResolvedValue(undefined);
    stubs.waitlist.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    if (!enabled) return;
    try {
      await cleanupSynthetics(createServiceClient());
    } catch (error) {
      console.error("synthetic cleanup error", error instanceof Error ? error.message : "unknown");
    }
  });

  it("executes required live Staging application scenarios against synthetic rows only", async () => {
    assertStagingOnly();
    const report: Record<string, unknown> = {
      baselinePending,
      baselineAll,
    };

    // 1 + 2. Normal email accept, then duplicate application attempt.
    const intentA = randomUUID();
    const emailJob = await insertJob(client, { payload: { sendIntentId: intentA } });
    const first = await driveMarked(client, emailJob.id);
    expect(first.claimed).not.toBeNull();
    expect(first.succeeded).toBe(true);
    expect(stubs.email).toHaveBeenCalledTimes(1);
    const afterFirst = await loadMarked(client, emailJob.id);
    expect(afterFirst.status).toBe("completed");
    const accepted = await loadIntent(client, BIZ_A, intentA, "email");
    expect(accepted?.state).toBe("accepted");
    expect(accepted?.attempt).toBe(1);

    const duplicateJob = await insertJob(client, { payload: { sendIntentId: intentA } });
    const duplicate = await driveMarked(client, duplicateJob.id);
    expect(duplicate.claimed).not.toBeNull();
    expect(duplicate.succeeded).toBe(true);
    expect(stubs.email).toHaveBeenCalledTimes(1);
    const dupIntent = await loadIntent(client, BIZ_A, intentA, "email");
    expect(dupIntent?.id).toBe(accepted?.id);
    expect(dupIntent?.state).toBe("accepted");
    expect(dupIntent?.attempt).toBe(1);
    report.emailAccept = { providerCalls: stubs.email.mock.calls.length, state: accepted?.state };
    report.emailDuplicate = { providerCalls: stubs.email.mock.calls.length, suppressed: true };

    // 3. Claim race: one winner, one send.
    stubs.email.mockClear();
    const raceJob = await insertJob(client);
    const raceSnap = await loadMarked(client, raceJob.id);
    const [raceOne, raceTwo] = await Promise.all([
      claimBackgroundJob(client, raceSnap),
      claimBackgroundJob(client, raceSnap),
    ]);
    const raceWins = [raceOne, raceTwo].filter(Boolean);
    expect(raceWins).toHaveLength(1);
    expect([raceOne, raceTwo].filter((row) => row == null)).toHaveLength(1);
    expect(await processClaimedJob(client, raceWins[0]!)).toBe(true);
    expect(stubs.email).toHaveBeenCalledTimes(1);
    expect((await loadMarked(client, raceJob.id)).status).toBe("completed");
    report.claimRace = { winners: raceWins.length, providerCalls: stubs.email.mock.calls.length };

    // 4. Provider rejected then governed retry.
    stubs.email.mockReset();
    stubs.email
      .mockResolvedValueOnce({ success: false, retrySafe: true, error: "stub_rejected", provider: "isolated-stub" })
      .mockResolvedValueOnce({ success: true, messageId: "stub-email-retry", provider: "isolated-stub" });
    const retryJob = await insertJob(client);
    const rejectedDrive = await driveMarked(client, retryJob.id);
    expect(rejectedDrive.succeeded).toBe(false);
    const afterReject = await loadMarked(client, retryJob.id);
    expect(afterReject.status).toBe("pending");
    expect(afterReject.attempts).toBe(1);
    const rejectedIntent = await loadIntent(client, BIZ_A, afterReject.payload.sendIntentId as string, "email");
    expect(rejectedIntent?.state).toBe("rejected");
    const nowIso = new Date().toISOString();
    const { error: retryReadyError } = await client
      .from("background_jobs")
      .update({ next_retry_at: nowIso, scheduled_at: nowIso })
      .eq("id", retryJob.id)
      .contains("payload", { chasumIsolatedRuntimeMarker: MARKER });
    if (retryReadyError) throw new Error(retryReadyError.message);
    const retryDrive = await driveMarked(client, retryJob.id);
    expect(retryDrive.succeeded).toBe(true);
    expect(stubs.email).toHaveBeenCalledTimes(2);
    const afterRetry = await loadIntent(client, BIZ_A, afterReject.payload.sendIntentId as string, "email");
    expect(afterRetry?.state).toBe("accepted");
    expect(afterRetry?.attempt).toBe(2);
    expect((await loadMarked(client, retryJob.id)).status).toBe("completed");
    report.rejectedThenRetry = { providerCalls: stubs.email.mock.calls.length, finalState: afterRetry?.state };

    // 5. Unknown / timeout: no automatic retry.
    stubs.email.mockReset();
    stubs.email.mockImplementationOnce(async () => {
      throw new Error("stub_timeout");
    });
    const unknownJob = await insertJob(client);
    const unknownDrive = await driveMarked(client, unknownJob.id);
    expect(unknownDrive.succeeded).toBe(false);
    const afterUnknown = await loadMarked(client, unknownJob.id);
    expect(afterUnknown.status).toBe("failed");
    expect(String(afterUnknown.error_message)).toMatch(/reconciliation_required/);
    const unknownIntent = await loadIntent(client, BIZ_A, afterUnknown.payload.sendIntentId as string, "email");
    expect(["unknown", "sending"]).toContain(unknownIntent?.state);
    expect(stubs.email).toHaveBeenCalledTimes(1);
    report.unknownTimeout = {
      jobStatus: afterUnknown.status,
      intentState: unknownIntent?.state,
      providerCalls: stubs.email.mock.calls.length,
    };

    // 6. Accepted, then finalization ownership failure / crash before finalize.
    stubs.email.mockReset();
    stubs.email.mockResolvedValue({ success: true, messageId: "stub-email-crash", provider: "isolated-stub" });
    const crashJob = await insertJob(client);
    const crashCandidate = await loadMarked(client, crashJob.id);
    const crashClaim = await claimBackgroundJob(client, crashCandidate);
    expect(crashClaim).not.toBeNull();
    await processJob(crashClaim!);
    expect(stubs.email).toHaveBeenCalledTimes(1);
    const crashIntent = await loadIntent(client, BIZ_A, crashJob.payload.sendIntentId as string, "email");
    expect(crashIntent?.state).toBe("accepted");
    await processJob(crashClaim!);
    expect(stubs.email).toHaveBeenCalledTimes(1);
    const tampered = { ...crashClaim!, error_message: `worker_claim:${randomUUID()}` };
    await expect(processClaimedJob(client, tampered)).rejects.toThrow(/reconciliation/);
    expect(stubs.email).toHaveBeenCalledTimes(1);
    const afterCrash = await loadMarked(client, crashJob.id);
    expect(afterCrash.status).toBe("processing");
    report.crashBoundary = {
      jobStatus: afterCrash.status,
      intentState: crashIntent?.state,
      providerCalls: stubs.email.mock.calls.length,
      finalizationThrew: true,
    };

    // 7. Completed / cancelled refuse claim and never send.
    stubs.email.mockClear();
    const completedJob = await insertJob(client, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    const cancelledJob = await insertJob(client, {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    });
    expect(await claimBackgroundJob(client, await loadMarked(client, completedJob.id))).toBeNull();
    expect(await claimBackgroundJob(client, await loadMarked(client, cancelledJob.id))).toBeNull();
    expect(stubs.email).not.toHaveBeenCalled();
    expect(stubs.sms).not.toHaveBeenCalled();
    expect((await loadMarked(client, completedJob.id)).status).toBe("completed");
    expect((await loadMarked(client, cancelledJob.id)).status).toBe("cancelled");
    report.completedCancelled = { providerCalls: stubs.email.mock.calls.length };

    // 8. Malformed / unsupported fail closed.
    stubs.email.mockClear();
    stubs.webhook.mockClear();
    const malformed = await insertJob(client, {
      payload: {
        sendIntentProtocol: "durable-v1",
        sendIntentId: randomUUID(),
        templateKey: TEMPLATE,
        chasumIsolatedRuntimeMarker: MARKER,
        recipient: undefined,
        directContext: undefined,
        skipPreferenceCheck: undefined,
      },
    });
    const malformedDrive = await driveMarked(client, malformed.id);
    expect(malformedDrive.succeeded).toBe(false);
    expect(stubs.email).not.toHaveBeenCalled();
    const afterMalformed = await loadMarked(client, malformed.id);
    expect(afterMalformed.status).toBe("failed");
    const unsupported = await insertJob(client, {
      job_type: "calendar_sync",
      payload: { connectionId: "not-a-uuid", chasumIsolatedRuntimeMarker: MARKER },
    });
    stubs.calendar.mockRejectedValueOnce(new Error("calendar_unsupported_synthetic"));
    const unsupportedDrive = await driveMarked(client, unsupported.id);
    expect(unsupportedDrive.succeeded).toBe(false);
    expect(stubs.email).not.toHaveBeenCalled();
    expect(stubs.sms).not.toHaveBeenCalled();
    expect(stubs.webhook).not.toHaveBeenCalled();
    report.malformedUnsupported = {
      malformedStatus: afterMalformed.status,
      unsupportedStatus: (await loadMarked(client, unsupported.id)).status,
      providerCalls: stubs.email.mock.calls.length,
    };

    // 9. Tenant isolation: same intent id, two businesses, no cross-write.
    stubs.email.mockReset();
    stubs.email.mockResolvedValue({ success: true, messageId: "stub-email-tenant", provider: "isolated-stub" });
    const sharedIntent = randomUUID();
    const tenantA = await insertJob(client, { business_id: BIZ_A, payload: { sendIntentId: sharedIntent } });
    const tenantB = await insertJob(client, {
      business_id: BIZ_B,
      payload: { sendIntentId: sharedIntent, recipient: EMAIL_TO, directContext: directContext(BIZ_B) },
    });
    expect((await driveMarked(client, tenantA.id)).succeeded).toBe(true);
    expect((await driveMarked(client, tenantB.id)).succeeded).toBe(true);
    expect(stubs.email).toHaveBeenCalledTimes(2);
    const intentRowA = await loadIntent(client, BIZ_A, sharedIntent, "email");
    const intentRowB = await loadIntent(client, BIZ_B, sharedIntent, "email");
    expect(intentRowA?.id).toBeTruthy();
    expect(intentRowB?.id).toBeTruthy();
    expect(intentRowA?.id).not.toBe(intentRowB?.id);
    expect(intentRowA?.business_id).toBe(BIZ_A);
    expect(intentRowB?.business_id).toBe(BIZ_B);
    const store = createSendIntentStore();
    const crossed = await store.compareAndSet(
      { ...(intentRowA as never), business_id: BIZ_B },
      { provider_message_id: "should-not-write" },
    );
    expect(crossed).toBeNull();
    const intentAAfterCross = await loadIntent(client, BIZ_A, sharedIntent, "email");
    const intentBAfterCross = await loadIntent(client, BIZ_B, sharedIntent, "email");
    expect(intentAAfterCross?.provider_message_id).toBe(intentRowA?.provider_message_id);
    expect(intentBAfterCross?.provider_message_id).toBe(intentRowB?.provider_message_id);
    report.tenantIsolation = {
      providerCalls: stubs.email.mock.calls.length,
      distinctIntentRows: intentRowA?.id !== intentRowB?.id,
      crossWriteRejected: crossed == null,
    };

    // 10. markRelatedJobs failure on synthetic twins only.
    const twinAppointment = randomUUID();
    const twinIntent = randomUUID();
    await insertJob(client, {
      payload: {
        sendIntentId: twinIntent,
        appointmentId: twinAppointment,
        templateKey: TEMPLATE,
        recipient: EMAIL_TO,
        chasumIsolatedRuntimeMarker: MARKER,
      },
    });
    const related = await markRelatedJobs(
      {
        channel: "customer_email",
        label: "isolated-runtime",
        ctx: {
          appointmentId: twinAppointment,
          businessId: BIZ_A,
          businessName: "Isolated Runtime Synthetic",
          customerName: "Isolated Recipient",
          staffName: "Isolated Staff",
          serviceName: "Isolated Service",
          startTime: "2026-09-07T16:00:00Z",
          customerId: null,
          customerEmail: EMAIL_TO,
          customerPhone: null,
          businessEmail: null,
          notificationEmail: null,
          emailEnabled: true,
          smsEnabled: false,
          ownerEnabled: true,
          staffEnabled: true,
          staffEmail: null,
          subscriptionPlanKey: null,
          privateAlphaEnabled: null,
        },
        to: EMAIL_TO,
        templateKey: TEMPLATE,
      } as never,
      "email",
      randomUUID(),
      "completed",
    );
    expect(related.reconciliationRequired).toBe(true);
    report.markRelatedJobs = { reconciliationRequired: related.reconciliationRequired };

    // 11. SMS accept + duplicate suppression.
    stubs.sms.mockReset();
    stubs.sms.mockResolvedValue({ success: true, messageId: "stub-sms-1", provider: "isolated-stub" });
    const smsIntent = randomUUID();
    const smsJob = await insertJob(client, {
      job_type: "sms",
      payload: { sendIntentId: smsIntent, recipient: SMS_TO, directContext: directContext(BIZ_A) },
    });
    expect((await driveMarked(client, smsJob.id)).succeeded).toBe(true);
    expect(stubs.sms).toHaveBeenCalledTimes(1);
    const smsDup = await insertJob(client, {
      job_type: "sms",
      payload: { sendIntentId: smsIntent, recipient: SMS_TO, directContext: directContext(BIZ_A) },
    });
    expect((await driveMarked(client, smsDup.id)).succeeded).toBe(true);
    expect(stubs.sms).toHaveBeenCalledTimes(1);
    const smsAccepted = await loadIntent(client, BIZ_A, smsIntent, "sms");
    expect(smsAccepted?.state).toBe("accepted");
    expect(stubs.email.mock.calls.length).toBeGreaterThanOrEqual(0);
    report.sms = { providerCalls: stubs.sms.mock.calls.length, state: smsAccepted?.state };

    // 12. Webhook claim atomicity only; dispatch stubbed; no durable webhook ledger.
    stubs.webhook.mockClear();
    const webhookJob = await insertJob(client, {
      job_type: "webhook",
      payload: { event: "chasum.isolated.runtime", data: { marker: MARKER }, chasumIsolatedRuntimeMarker: MARKER },
    });
    const webhookSnap = await loadMarked(client, webhookJob.id);
    const [hookOne, hookTwo] = await Promise.all([
      claimBackgroundJob(client, webhookSnap),
      claimBackgroundJob(client, webhookSnap),
    ]);
    const hookWins = [hookOne, hookTwo].filter(Boolean);
    expect(hookWins).toHaveLength(1);
    expect(await processClaimedJob(client, hookWins[0]!)).toBe(true);
    expect(stubs.webhook).toHaveBeenCalledTimes(1);
    expect(stubs.webhook).toHaveBeenCalledWith(BIZ_A, "chasum.isolated.runtime", { marker: MARKER });
    report.webhook = {
      winners: hookWins.length,
      stubDispatchCalls: stubs.webhook.mock.calls.length,
      durableSendIntentLedger: false,
    };

    await cleanupSynthetics(client);
    const afterPending = await snapshotExisting(client, true);
    const afterAllRows = await snapshotExisting(client, false);
    expect(afterPending).toEqual(baselinePending);
    expect(afterAllRows).toEqual(baselineAll);
    report.afterPending = afterPending;
    report.afterAll = afterAllRows;
    report.providerCredentialsPresent = Boolean(process.env.RESEND_API_KEY || process.env.TWILIO_ACCOUNT_SID);
    writeFileSync("/private/tmp/chasum-isolated-staging-runtime-summary.json", `${JSON.stringify(report, null, 2)}\n`);
    console.log("CHASUM_ISOLATED_RUNTIME_SUMMARY", JSON.stringify(report));
  }, 120_000);
});
