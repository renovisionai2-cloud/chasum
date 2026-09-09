// @vitest-environment node
/**
 * Opt-in Package B isolated worker/delivery proof.
 * NEVER scans the pending queue. NEVER calls processPendingJobs.
 * NEVER targets Production. Provider adapters are stubbed in this process only.
 *
 * Enable with CHASUM_STAGING_PACKAGE_B_ISOLATED=1 after the hosted producer
 * wrote PKGB_PRODUCER_EVIDENCE (see scripts/run-staging-package-b-targeted-validation.mjs).
 */
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { BackgroundJob } from "@/lib/types/integrations";

const STAGING_REF = "wnfahklzaxirftyskctd";
const PRODUCTION_REF = "kxcydvhswkuzepwzzinq";
const MARKER = "chasum-pkgb-isolated-20260909";
const enabled = process.env.CHASUM_STAGING_PACKAGE_B_ISOLATED === "1";

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
import { processClaimedJob } from "@/lib/integrations/jobs/processor";
import { sendEmail, sendSMS } from "@/lib/communications/delivery";

type ProducerEvidence = {
  businessId: string;
  appointmentId: string;
  customerId: string;
  jobs: Array<{
    id: string;
    job_type: string;
    status: string;
    attempts: number;
    payload: Record<string, unknown>;
  }>;
};

const extraTrackedJobIds: string[] = [];
const extraIntentIds: string[] = [];
let evidence: ProducerEvidence | null = null;
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
  if (url.includes(PRODUCTION_REF)) {
    throw new Error("HOLD: Production identity present");
  }
  if (process.env.CHASUM_SUPABASE_TARGET && process.env.CHASUM_SUPABASE_TARGET !== "staging") {
    throw new Error("HOLD: CHASUM_SUPABASE_TARGET is not staging");
  }
  if (process.env.RESEND_API_KEY || process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_AUTH_TOKEN) {
    throw new Error("HOLD: provider credentials must not be present in the isolated harness process");
  }
}

function loadEvidence(): ProducerEvidence {
  const path = process.env.PKGB_PRODUCER_EVIDENCE;
  if (!path) throw new Error("HOLD: PKGB_PRODUCER_EVIDENCE is required");
  const parsed = JSON.parse(readFileSync(path, "utf8")) as ProducerEvidence;
  if (!parsed.appointmentId || !parsed.businessId || !parsed.customerId) {
    throw new Error("HOLD: producer evidence is incomplete");
  }
  if (parsed.businessId !== "73c78c46-4b97-4880-82a1-901eff429c47") {
    throw new Error("HOLD: producer evidence is not chasum-test-studio");
  }
  return parsed;
}

async function loadTracked(
  client: ReturnType<typeof createServiceClient>,
  id: string,
  appointmentId: string,
): Promise<BackgroundJob> {
  const { data, error } = await client.from("background_jobs").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new Error(`tracked load failed: ${error?.message ?? "missing"}`);
  const payload = (data.payload ?? {}) as Record<string, unknown>;
  const nested = (payload.data as { appointmentId?: string } | undefined)?.appointmentId;
  const isolated = payload.chasumPackageBIsolatedMarker === MARKER;
  if (payload.appointmentId !== appointmentId && nested !== appointmentId && !isolated) {
    throw new Error("refusing to operate on a job that is not appointment-scoped or marked isolated");
  }
  return data as BackgroundJob;
}

async function driveTracked(
  client: ReturnType<typeof createServiceClient>,
  id: string,
  appointmentId: string,
) {
  const candidate = await loadTracked(client, id, appointmentId);
  const claimed = await claimBackgroundJob(client, candidate);
  if (!claimed) return { claimed: null, succeeded: false, job: candidate };
  const succeeded = await processClaimedJob(client, claimed);
  const after = await loadTracked(client, id, appointmentId);
  return { claimed, succeeded, job: after };
}

async function insertIsolatedJob(
  client: ReturnType<typeof createServiceClient>,
  row: {
    job_type: "email" | "sms";
    payload: Record<string, unknown>;
  },
) {
  const sendIntentId = randomUUID();
  const payload = {
    chasumPackageBIsolatedMarker: MARKER,
    sendIntentProtocol: "durable-v1",
    sendIntentId,
    ...row.payload,
  };
  const { data, error } = await client
    .from("background_jobs")
    .insert({
      business_id: evidence!.businessId,
      job_type: row.job_type,
      status: "pending",
      scheduled_at: new Date().toISOString(),
      attempts: 0,
      max_attempts: 3,
      payload,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`isolated insert failed: ${error?.message ?? "no row"}`);
  extraTrackedJobIds.push(data.id as string);
  extraIntentIds.push(sendIntentId);
  return data as BackgroundJob;
}

async function cleanupExtras(client: ReturnType<typeof createServiceClient>) {
  if (cleaned) return;
  cleaned = true;
  if (extraTrackedJobIds.length) {
    await client
      .from("background_jobs")
      .delete()
      .in("id", extraTrackedJobIds)
      .eq("business_id", evidence!.businessId);
    await client.from("communications_audit_log").delete().in("entity_id", extraTrackedJobIds);
  }
  if (extraIntentIds.length) {
    await client.from("communication_send_intents").delete().in("id", extraIntentIds);
  }
  await client
    .from("background_jobs")
    .delete()
    .eq("business_id", evidence!.businessId)
    .contains("payload", { chasumPackageBIsolatedMarker: MARKER });
}

describe.skipIf(!enabled)(
  "Package B isolated worker/delivery (live Staging DB + stubbed providers)",
  { timeout: 120_000, hookTimeout: 60_000 },
  () => {
    let client: ReturnType<typeof createServiceClient>;

    beforeAll(async () => {
      assertStagingOnly();
      if (process.env.CHASUM_WORKER_RELIABILITY_ENABLED !== "true") {
        throw new Error("HOLD: CHASUM_WORKER_RELIABILITY_ENABLED must be true in this process only");
      }
      evidence = loadEvidence();
      client = createServiceClient();
      stubs.email.mockResolvedValue({
        success: true,
        messageId: "pkgb-stub-email",
        provider: "isolated-stub",
      });
      stubs.sms.mockResolvedValue({
        success: true,
        messageId: "pkgb-stub-sms",
        provider: "isolated-stub",
      });
      stubs.webhook.mockResolvedValue(undefined);
    });

    afterAll(async () => {
      if (!enabled) return;
      try {
        await cleanupExtras(createServiceClient());
      } catch (error) {
        console.error("isolated extra cleanup error", error instanceof Error ? error.message : "unknown");
      }
    });

    it("forwards skipPreferenceCheck on the appointment path and keeps marketing closed", async () => {
      assertStagingOnly();
      const ev = evidence!;
      const jobs = ev.jobs;

      const confirmation = jobs.find(
        (job) => job.job_type === "email" && job.payload.templateKey === "appointment.confirmation",
      );
      const business = jobs.find(
        (job) => job.job_type === "email" && job.payload.templateKey === "appointment.business",
      );
      const staffHosted = jobs.find(
        (job) => job.job_type === "email" && job.payload.templateKey === "appointment.staff",
      );
      const customerFacing = jobs.filter((job) =>
        ["appointment.confirmation", "appointment.reminder", "appointment.cancellation", "appointment.reschedule"].includes(
          String(job.payload.templateKey ?? ""),
        ),
      );
      const reminderJobs = jobs.filter((job) => job.job_type === "reminder");
      const webhookJobs = jobs.filter((job) => job.job_type === "webhook");

      expect(confirmation).toBeTruthy();
      expect(business).toBeTruthy();
      expect(staffHosted).toBeUndefined();
      expect(confirmation!.payload.skipPreferenceCheck).toBeFalsy();
      expect(business!.payload.skipPreferenceCheck).toBe(true);
      for (const job of customerFacing) {
        expect(job.payload.skipPreferenceCheck).toBeFalsy();
      }
      for (const job of reminderJobs) {
        expect(job.payload.skipPreferenceCheck).toBeFalsy();
        expect(String(job.payload.templateKey ?? "")).not.toMatch(/^marketing\./);
      }
      expect(jobs.some((job) => String(job.payload.templateKey ?? "").startsWith("marketing."))).toBe(false);
      expect(webhookJobs.length).toBeGreaterThan(0);

      stubs.email.mockClear();
      stubs.sms.mockClear();
      stubs.webhook.mockClear();

      const confirmationDrive = await driveTracked(client, confirmation!.id, ev.appointmentId);
      expect(confirmationDrive.claimed).not.toBeNull();
      expect(stubs.email).not.toHaveBeenCalled();
      expect(stubs.webhook).not.toHaveBeenCalled();
      expect(confirmationDrive.succeeded).toBe(false);
      expect(String(confirmationDrive.job.error_message ?? "")).toContain("delivery_skipped");

      const businessDrive = await driveTracked(client, business!.id, ev.appointmentId);
      expect(businessDrive.claimed).not.toBeNull();
      expect(businessDrive.succeeded).toBe(true);
      expect(stubs.email).toHaveBeenCalledTimes(1);
      expect(businessDrive.job.status).toBe("completed");

      const staffJob = await insertIsolatedJob(client, {
        job_type: "email",
        payload: {
          appointmentId: ev.appointmentId,
          templateKey: "appointment.staff",
          recipient: "pkgb-staff@chasum.test.invalid",
          skipPreferenceCheck: true,
        },
      });
      stubs.email.mockClear();
      const staffDrive = await driveTracked(client, staffJob.id, ev.appointmentId);
      expect(staffDrive.claimed).not.toBeNull();
      expect(staffDrive.succeeded).toBe(true);
      expect(stubs.email).toHaveBeenCalledTimes(1);

      const smsJob = await insertIsolatedJob(client, {
        job_type: "sms",
        payload: {
          appointmentId: ev.appointmentId,
          templateKey: "appointment.confirmation",
          recipient: "5550100888",
        },
      });
      stubs.sms.mockClear();
      const smsDrive = await driveTracked(client, smsJob.id, ev.appointmentId);
      expect(smsDrive.claimed).not.toBeNull();
      expect(stubs.sms).not.toHaveBeenCalled();
      expect(smsDrive.succeeded).toBe(false);
      expect(String(smsDrive.job.error_message ?? "")).toContain("delivery_skipped");

      stubs.email.mockClear();
      stubs.sms.mockClear();
      const marketingEmail = await sendEmail({
        businessId: ev.businessId,
        to: "pkgb-marketing@chasum.test.invalid",
        templateKey: "marketing.campaign",
        context: {
          businessId: ev.businessId,
          businessName: "Package B Studio",
          customerName: "Package B",
          staffName: "Staff",
          serviceName: "Service",
          startTime: "2026-10-15T18:00:00Z",
        },
        customerId: ev.customerId,
        skipPreferenceCheck: true,
      });
      const marketingMissing = await sendEmail({
        businessId: ev.businessId,
        to: "pkgb-marketing@chasum.test.invalid",
        templateKey: "marketing.campaign",
        context: {
          businessId: ev.businessId,
          businessName: "Package B Studio",
          customerName: "Package B",
          staffName: "Staff",
          serviceName: "Service",
          startTime: "2026-10-15T18:00:00Z",
        },
        skipPreferenceCheck: true,
      });
      const marketingSms = await sendSMS({
        businessId: ev.businessId,
        to: "5550100888",
        templateKey: "marketing.campaign",
        context: {
          businessId: ev.businessId,
          businessName: "Package B Studio",
          customerName: "Package B",
          staffName: "Staff",
          serviceName: "Service",
          startTime: "2026-10-15T18:00:00Z",
        },
        customerId: ev.customerId,
        skipPreferenceCheck: true,
      });
      expect(marketingEmail).toMatchObject({ ok: false, skipped: true });
      expect(marketingMissing).toMatchObject({ ok: false, skipped: true });
      expect(marketingSms).toMatchObject({ ok: false, skipped: true });
      expect(stubs.email).not.toHaveBeenCalled();
      expect(stubs.sms).not.toHaveBeenCalled();

      const fingerprint = createHash("sha256")
        .update(
          jobs
            .map((job) => `${job.id}:${job.job_type}:${String(job.payload.templateKey ?? "")}:${String(Boolean(job.payload.skipPreferenceCheck))}`)
            .sort()
            .join("|"),
        )
        .digest("hex");
      expect(fingerprint).toHaveLength(64);
    });
  },
);
