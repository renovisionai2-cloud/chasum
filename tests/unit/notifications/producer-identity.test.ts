import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bridge = vi.hoisted(() => ({ callback: undefined as ((event: unknown) => Promise<void>) | undefined }));
vi.mock("@/lib/booking-engine/events/emit", () => ({ onBookingEvent: (callback: (event: unknown) => Promise<void>) => { bridge.callback = callback; } }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/integrations/calendar/sync", () => ({ pushAppointmentToCalendars: vi.fn(), deleteAppointmentFromCalendars: vi.fn() }));
vi.mock("@/lib/env", () => ({ getResendApiKey: () => "local-stub", getTwilioConfig: () => ({ accountSid: "local-stub" }) }));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { createServiceClient } from "@/lib/supabase/service";
import { initialBookingIntentId, originalReceiptIntentId, scheduledReminderIntentId } from "@/lib/communications/intent-identity";
import { enqueueEmailJob, enqueueReminderJobs } from "@/lib/integrations/jobs/queue";
import { handleAppointmentEvent } from "@/lib/integrations/notifications/orchestrator";
import { registerCommunicationsBookingBridge } from "@/lib/communications/events/booking-bridge";
import { sendIntentKey } from "@/lib/communications/send-intent";

type Row = Record<string, unknown>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
let inserted: Row[];
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "true"); inserted = [];
  vi.mocked(createServiceClient).mockReturnValue({ from: (table: string) => {
    let insert: Row | undefined;
    const result = () => {
      if (insert) return { data: insert, error: null };
      if (table === "appointments") return { data: {
        id: "appointment-a", business_id: "business-a", status: "confirmed",
        start_time: "2026-08-01T10:00:00Z", end_time: "2026-08-01T10:30:00Z",
        service: { name: "Fixture Service" }, staff: { name: "Fixture Staff", email: " staff@example.invalid " },
        customer: { name: "Fixture Customer", email: " customer@example.invalid ", phone: " +15555550100 " },
      }, error: null };
      if (table === "businesses") return { data: {
        name: "Fixture Business", email: "owner@example.invalid", notification_email: "override@example.invalid",
        email_notifications_enabled: true, sms_notifications_enabled: true,
        owner_notifications_enabled: true, staff_notifications_enabled: true, private_alpha_enabled: true,
      }, error: null };
      return { data: [], error: null };
    };
    const query = {
      select: () => query, eq: () => query,
      insert: (row: Row) => { insert = row; if (table === "background_jobs") inserted.push(row); return query; },
      single: async () => result(), then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
    };
    return query;
  } } as never);
});
afterEach(() => vi.unstubAllEnvs());
const communicationJobs = () => inserted.filter((job) => ["email", "sms"].includes(String(job.job_type)));
const payload = (job: Row) => job.payload as Row;

describe("producer occurrence identity", () => {
  it("shares initial booking occurrence while channel/templates distinguish all four sends", async () => {
    await handleAppointmentEvent("appointment-a", "created");
    const jobs = communicationJobs(); expect(jobs).toHaveLength(4);
    const id = initialBookingIntentId("appointment-a");
    expect(jobs.every((job) => payload(job).sendIntentId === id)).toBe(true);
    expect(new Set(jobs.map((job) => sendIntentKey(id, String(job.job_type), String(payload(job).templateKey)))).size).toBe(4);
    expect(jobs.map((job) => payload(job).recipient)).toEqual([
      "customer@example.invalid", "staff@example.invalid", "override@example.invalid", "+15555550100",
    ]);
    expect(jobs.every((job) => payload(job).sendIntentProtocol === "durable-v1")).toBe(true);
    expect(new Set(jobs.map((job) => job.id)).size).toBe(4);
  });

  it("initial confirmed event bridge keeps the inline initial occurrence", async () => {
    registerCommunicationsBookingBridge();
    await bridge.callback!({ type: "appointment.created", appointmentId: "appointment-a", payload: { status: "confirmed" } });
    expect(communicationJobs().every((job) => payload(job).sendIntentId === initialBookingIntentId("appointment-a"))).toBe(true);
  });

  it("an explicit initial confirmed option matches inline but a later confirmation is distinct", async () => {
    const initial = initialBookingIntentId("appointment-a");
    await handleAppointmentEvent("appointment-a", "confirmed", { sendIntentId: initial });
    await handleAppointmentEvent("appointment-a", "confirmed");
    const jobs = communicationJobs();
    expect(payload(jobs[0]).sendIntentId).toBe(initial);
    expect(payload(jobs[4]).sendIntentId).not.toBe(initial);
  });

  it("two reschedule occurrences do not reuse the old weak event-name key", async () => {
    await handleAppointmentEvent("appointment-a", "rescheduled", { previousStartTime: "2026-07-01T10:00:00Z" });
    await handleAppointmentEvent("appointment-a", "rescheduled", { previousStartTime: "2026-07-02T10:00:00Z" });
    const jobs = communicationJobs();
    expect(payload(jobs[0]).idempotencyKey).toBe(payload(jobs[4]).idempotencyKey);
    expect(payload(jobs[0]).sendIntentId).not.toBe(payload(jobs[4]).sendIntentId);
    expect(payload(jobs[0]).sendIntentId).toMatch(uuid);
    expect(payload(jobs[4]).sendIntentId).toMatch(uuid);
  });

  it("default queue identity equals the explicitly inserted job ID and persists through retries", async () => {
    const id = await enqueueEmailJob("business-a", { templateKey: "custom", recipient: "fixture@example.invalid" });
    expect(inserted[0].id).toBe(id); expect(id).toMatch(uuid);
    expect(payload(inserted[0]).sendIntentId).toBe(id);
    const scheduled = new Date("2026-10-01T10:00:00Z");
    await enqueueReminderJobs("business-a", "appointment-a", scheduled);
    for (const reminder of inserted.slice(1)) {
      expect(payload(reminder).sendIntentId).toBe(scheduledReminderIntentId("appointment-a", scheduled));
      expect(reminder.scheduled_at).toBe(scheduled.toISOString());
      expect(payload(reminder).sendIntentProtocol).toBe("durable-v1");
    }
  });

  it("repeated reminder scheduling reuses the occurrence while other times and appointments stay distinct", async () => {
    const at = new Date("2026-10-01T10:00:00Z");
    await enqueueReminderJobs("business-a", "appointment-a", at);
    await enqueueReminderJobs("business-a", "appointment-a", new Date("2026-10-01T06:00:00-04:00"));
    await enqueueReminderJobs("business-a", "appointment-a", new Date("2026-10-01T11:00:00Z"));
    await enqueueReminderJobs("business-a", "appointment-b", at);
    const ids = inserted.map((job) => String(payload(job).sendIntentId));
    expect(new Set(ids.slice(0, 4)).size).toBe(1);
    expect(new Set([ids[0], ids[4], ids[6]]).size).toBe(3);
    expect(new Set(inserted.map((job) => job.id)).size).toBe(8);
    expect(sendIntentKey(ids[0], "email", "appointment.reminder"))
      .not.toBe(sendIntentKey(ids[1], "sms", "appointment.reminder"));
  });

  it("flag-off enqueue strips a forged protocol; a new-looking UUID cannot claim guarded delivery", async () => {
    vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "false");
    await enqueueEmailJob("business-a", { templateKey: "custom", sendIntentId: initialBookingIntentId("appointment-a"), sendIntentProtocol: "durable-v1" });
    expect(payload(inserted[0]).sendIntentId).toMatch(uuid);
    expect(payload(inserted[0])).not.toHaveProperty("sendIntentProtocol");
    vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "true");
    expect(payload(inserted[0])).not.toHaveProperty("sendIntentProtocol");
  });

  it("booking and receipt initial identities are stable and separate even for equal entity IDs", () => {
    expect(initialBookingIntentId("same-entity")).toBe(initialBookingIntentId("same-entity"));
    expect(originalReceiptIntentId("same-entity")).toBe(originalReceiptIntentId("same-entity"));
    expect(originalReceiptIntentId("same-entity")).not.toBe(initialBookingIntentId("same-entity"));
    expect(initialBookingIntentId("one")).not.toBe(initialBookingIntentId("two"));
  });
});
