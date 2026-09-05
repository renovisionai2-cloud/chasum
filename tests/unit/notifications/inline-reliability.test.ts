import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/communications/delivery", () => ({ sendEmail: vi.fn(), sendSMS: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/env", () => ({
  getResendApiKey: () => "local-stub", getEmailFromAddress: () => "fixture@example.invalid",
  getTwilioConfig: () => ({ accountSid: "local-stub" }),
}));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { sendEmail, sendSMS } from "@/lib/communications/delivery";
import { initialBookingIntentId, newSendIntentId } from "@/lib/communications/intent-identity";
import { runDurableSend, type SendIntent, type SendIntentStore } from "@/lib/communications/send-intent";
import { createServiceClient } from "@/lib/supabase/service";
import { deliverBookingNotifications, retryBookingNotification } from "@/lib/notifications/booking-delivery";
import { logger } from "@/lib/observability/logger";

type Row = Record<string, unknown>;
let activeRows: Record<string, Row[]>;
const occurrence = initialBookingIntentId("appointment-a");
const appointment = () => ({
  id: "appointment-a", business_id: "business-a", customer_id: "customer-a",
  start_time: "2026-08-01T10:00:00Z", end_time: "2026-08-01T10:30:00Z", status: "confirmed",
  business: { name: "Fictional Business", timezone: "UTC", email_notifications_enabled: true,
    sms_notifications_enabled: false, owner_notifications_enabled: false,
    staff_notifications_enabled: false, private_alpha_enabled: true },
  service: { name: "Fictional Service" }, staff: { name: "Fictional Staff" },
  customer: { id: "customer-a", name: "Fictional Customer", email: "customer@example.invalid", phone: "+15555550100" },
});
const twin = (overrides: Row = {}): Row => ({
  id: "job-a", business_id: "business-a", job_type: "email", status: "pending",
  payload: { appointmentId: "appointment-a", templateKey: "appointment.confirmation",
    recipient: "customer@example.invalid", sendIntentId: occurrence, sendIntentProtocol: "durable-v1" }, ...overrides,
});

function fixture() {
  const rows: Record<string, Row[]> = { appointments: [appointment()], background_jobs: [twin()], notification_logs: [] };
  activeRows = rows;
  const faults = { queueRead: false, queueReadAfterProtocol: false, queueWrite: false, zeroWrite: false, logRead: false };
  let queueReads = 0;
  const updates: Row[] = [];
  const from = vi.fn((table: string) => {
    const filters: Array<(row: Row) => boolean> = [];
    let update: Row | undefined;
    let single = false;
    const run = () => {
      const matching = (rows[table] ?? []).filter((row) => filters.every((fn) => fn(row)));
      if (table === "background_jobs" && !update) queueReads++;
      if ((table === "background_jobs" && (update ? faults.queueWrite : faults.queueRead)) ||
          (table === "background_jobs" && !update && faults.queueReadAfterProtocol && queueReads > 1) ||
          (table === "notification_logs" && faults.logRead)) return { data: null, error: { message: "injected database failure" } };
      if (update && table === "background_jobs" && faults.zeroWrite) return { data: [], error: null };
      if (update) for (const row of matching) { updates.push({ ...update }); Object.assign(row, update); }
      return { data: single ? matching[0] ?? null : matching.map((row) => ({ ...row })), error: null };
    };
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { filters.push((row) => row[key] === value); return query; },
      contains: (key: string, value: Row) => {
        filters.push((row) => Object.entries(value).every(([k, v]) => (row[key] as Row)?.[k] === v)); return query;
      },
      in: (key: string, values: unknown[]) => { filters.push((row) => values.includes(row[key])); return query; },
      update: (changes: Row) => { update = changes; return query; },
      order: () => query, limit: () => query,
      single: () => { single = true; return Promise.resolve(run()); },
      maybeSingle: () => { single = true; return Promise.resolve(run()); },
      then: (resolve: (result: ReturnType<typeof run>) => unknown) => Promise.resolve(run()).then(resolve),
    };
    return query;
  });
  vi.mocked(createServiceClient).mockReturnValue({ from } as never);
  return { rows, faults, updates, from };
}

function durableDelivery() {
  const intents = new Map<string, SendIntent>();
  const provider = vi.fn(async () => ({ success: true, provider: "local-stub", messageId: "local-message" }));
  const store: SendIntentStore = {
    async insert(row) {
      const key = `${row.business_id}:${row.intent_key}`;
      if (intents.has(key)) return null;
      intents.set(key, { ...row }); activeRows.communication_send_intents = [...intents.values()]; return { ...row };
    },
    async find(businessId, key) { return intents.get(`${businessId}:${key}`) ?? null; },
    async compareAndSet(before, changes) {
      const key = `${before.business_id}:${before.intent_key}`;
      const live = intents.get(key);
      if (!live || live.state !== before.state || live.owner_id !== before.owner_id || live.attempt !== before.attempt) return null;
      const next = { ...live, ...changes }; intents.set(key, next);
      activeRows.communication_send_intents = [...intents.values()]; return { ...next };
    },
  };
  const send = async (input: Parameters<typeof sendEmail>[0], channel: "email" | "sms") => {
    expect(input.reliability).toBeDefined();
    const result = await runDurableSend({ businessId: input.businessId, channel,
      templateKey: input.templateKey, to: input.to, reliability: input.reliability! }, provider, store);
    return { ...result, ok: result.success };
  };
  vi.mocked(sendEmail).mockImplementation((input) => send(input, "email"));
  vi.mocked(sendSMS).mockImplementation((input) => send(input, "sms"));
  return { provider, intents };
}

const customerItem = (report: Awaited<ReturnType<typeof deliverBookingNotifications>>) =>
  report.items.find((item) => item.channel === "customer_email")!;

describe("inline provider truth and exact queue reconciliation", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "true"); });
  afterEach(() => vi.unstubAllEnvs());

  it("reconciles only the exact tenant, channel, occurrence and recipient", async () => {
    const db = fixture(); const delivery = durableDelivery();
    const unrelated = [twin({ id: "sms", job_type: "sms" }), twin({ id: "other-tenant", business_id: "business-b" }),
      twin({ id: "other-event", payload: { ...(twin().payload as Row), sendIntentId: newSendIntentId() } }),
      twin({ id: "other-recipient", payload: { ...(twin().payload as Row), recipient: "other@example.invalid" } })];
    const before = structuredClone(unrelated); db.rows.background_jobs.push(...unrelated);
    const item = customerItem(await deliverBookingNotifications("appointment-a"));
    expect(item).toMatchObject({ status: "sent", deliveryState: "accepted", reconciliationRequired: false });
    expect(db.rows.background_jobs[0].status).toBe("completed");
    expect(db.rows.background_jobs.slice(1)).toEqual(before);
    expect(delivery.provider).toHaveBeenCalledTimes(1);
  });

  it("keeps accepted evidence when queue UPDATE fails; later calls never repeat the provider", async () => {
    const db = fixture(); const delivery = durableDelivery(); db.faults.queueWrite = true;
    const first = customerItem(await deliverBookingNotifications("appointment-a"));
    expect(first).toMatchObject({ status: "sent", deliveryState: "accepted", reconciliationRequired: true, canRetry: false });
    expect(db.rows.background_jobs[0].status).toBe("pending");
    expect([...delivery.intents.values()][0].state).toBe("accepted");
    const second = customerItem(await deliverBookingNotifications("appointment-a"));
    expect(second).toMatchObject({ status: "sent", duplicateSuppressed: true, reconciliationRequired: true });
    db.faults.queueWrite = false;
    expect(customerItem(await deliverBookingNotifications("appointment-a")).reconciliationRequired).toBe(false);
    expect(db.rows.background_jobs[0].status).toBe("completed");
    expect(delivery.provider).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith("notifications", "queue_reconciliation_required", expect.objectContaining({ outcome: "completed" }));
  });

  it.each(["queueReadAfterProtocol", "zeroWrite"] as const)("surfaces %s without changing accepted delivery into failure", async (fault) => {
    const db = fixture(); durableDelivery(); db.faults[fault] = true;
    expect(customerItem(await deliverBookingNotifications("appointment-a")))
      .toMatchObject({ status: "sent", reconciliationRequired: true, canRetry: false });
    expect(db.rows.background_jobs[0].status).toBe("pending");
  });

  it("does not overwrite a processing twin owned by a worker", async () => {
    const db = fixture(); durableDelivery(); db.rows.background_jobs[0].status = "processing";
    expect(customerItem(await deliverBookingNotifications("appointment-a")).reconciliationRequired).toBe(true);
    expect(db.rows.background_jobs[0].status).toBe("processing"); expect(db.updates).toHaveLength(0);
  });

  it("checks legacy sent-log errors before calling any provider", async () => {
    vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "false");
    const db = fixture(); db.faults.logRead = true;
    expect(customerItem(await deliverBookingNotifications("appointment-a")))
      .toMatchObject({ status: "failed", deliveryState: "not_attempted", canRetry: false, reconciliationRequired: true });
    expect(sendEmail).not.toHaveBeenCalled(); expect(sendSMS).not.toHaveBeenCalled();
  });

  it("holds enabled inline delivery when its protocol evidence cannot be read", async () => {
    const db = fixture(); durableDelivery(); db.faults.queueRead = true;
    expect(customerItem(await deliverBookingNotifications("appointment-a")))
      .toMatchObject({ status: "failed", deliveryState: "not_attempted", canRetry: false });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("cannot replay an unguarded flag-off accepted send after activation", async () => {
    vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "false");
    const db = fixture(); delete (db.rows.background_jobs[0].payload as Row).sendIntentProtocol;
    db.faults.queueWrite = true;
    vi.mocked(sendEmail).mockResolvedValue({ ok: true, messageId: "unguarded-accepted" });
    expect(customerItem(await deliverBookingNotifications("appointment-a")).status).toBe("sent");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "true");
    expect(customerItem(await deliverBookingNotifications("appointment-a")))
      .toMatchObject({ deliveryState: "not_attempted", reconciliationRequired: true, canRetry: false });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("holds legacy sent-log evidence even when no legacy queue row remains", async () => {
    const db = fixture(); durableDelivery();
    db.rows.notification_logs.push({ business_id: "business-a", appointment_id: "appointment-a",
      channel: "email", template_key: "appointment.confirmation", recipient: "customer@example.invalid",
      status: "sent", provider_message_id: "legacy-evidence" });
    expect(customerItem(await deliverBookingNotifications("appointment-a")))
      .toMatchObject({ deliveryState: "not_attempted", reconciliationRequired: true, canRetry: false });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("accepted durable evidence permits a duplicate result even with a sent log", async () => {
    const db = fixture(); const delivery = durableDelivery();
    await deliverBookingNotifications("appointment-a");
    db.rows.communication_send_intents = [...delivery.intents.values()];
    db.rows.notification_logs.push({ business_id: "business-a", appointment_id: "appointment-a",
      channel: "email", template_key: "appointment.confirmation", recipient: "customer@example.invalid",
      status: "sent", provider_message_id: "local-message" });
    expect(customerItem(await deliverBookingNotifications("appointment-a")))
      .toMatchObject({ status: "sent", duplicateSuppressed: true, reconciliationRequired: false });
    expect(delivery.provider).toHaveBeenCalledTimes(1);
  });

  it.each(["queueRead", "logRead", "legacyTwin"] as const)("keeps accepted durable truth despite later %s evidence", async (fault) => {
    const db = fixture(); const delivery = durableDelivery();
    await deliverBookingNotifications("appointment-a");
    if (fault === "legacyTwin") delete (db.rows.background_jobs[0].payload as Row).sendIntentProtocol;
    else db.faults[fault] = true;
    const result = customerItem(await deliverBookingNotifications("appointment-a"));
    expect(result).toMatchObject({ status: "sent", deliveryState: "accepted", duplicateSuppressed: true });
    if (fault === "queueRead") expect(result).toMatchObject({ reconciliationRequired: true, canRetry: false });
    expect(delivery.provider).toHaveBeenCalledTimes(1);
  });

  it("legacy reconciliation avoids the absent029 column and never finalizes SMS after email", async () => {
    vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "false");
    const db = fixture(); db.rows.background_jobs.push(twin({ id: "sms", job_type: "sms" }));
    vi.mocked(sendEmail).mockResolvedValue({ ok: true, messageId: "legacy-accepted" });
    expect(customerItem(await deliverBookingNotifications("appointment-a")).status).toBe("sent");
    expect(db.rows.background_jobs[0].status).toBe("completed");
    expect(db.rows.background_jobs[1].status).toBe("pending");
    expect(db.updates[0]).not.toHaveProperty("next_retry_at");
  });

  it("an ambiguous provider outcome remains held across another inline invocation", async () => {
    const db = fixture(); const delivery = durableDelivery();
    delivery.provider.mockRejectedValue(new Error("simulated response lost after acceptance"));
    for (let attempt = 0; attempt < 2; attempt++) {
      expect(customerItem(await deliverBookingNotifications("appointment-a")))
        .toMatchObject({ status: "failed", deliveryState: "unknown", reconciliationRequired: true, canRetry: false });
    }
    expect(delivery.provider).toHaveBeenCalledTimes(1);
    expect(db.rows.background_jobs[0].status).toBe("pending");
    expect([...delivery.intents.values()][0].state).toBe("unknown");
  });

  it("explicit manual resends create distinct durable occurrences", async () => {
    fixture(); const delivery = durableDelivery();
    for (let send = 0; send < 2; send++) {
      const result = await retryBookingNotification({ businessId: "business-a", appointmentId: "appointment-a", channel: "customer_email" });
      expect(result.items[0]).toMatchObject({ status: "sent", reconciliationRequired: false });
    }
    const occurrences = vi.mocked(sendEmail).mock.calls.map(([input]) => input.reliability?.intentId);
    expect(new Set(occurrences).size).toBe(2); expect(occurrences).not.toContain(occurrence);
    expect(delivery.provider).toHaveBeenCalledTimes(2);
  });

  it("ordinary Retry cannot mint a second occurrence after a manual send becomes unknown", async () => {
    fixture(); const delivery = durableDelivery();
    delivery.provider.mockRejectedValue(new Error("manual response lost after acceptance"));
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await retryBookingNotification({ businessId: "business-a", appointmentId: "appointment-a", channel: "customer_email" });
      expect(result.items[0]).toMatchObject({ deliveryState: "unknown", reconciliationRequired: true, canRetry: false });
    }
    expect(delivery.provider).toHaveBeenCalledTimes(1);
    expect(delivery.intents.size).toBe(1);
  });

  it("manual SMS sends only the requested channel", async () => {
    const db = fixture(); const delivery = durableDelivery();
    (db.rows.appointments[0].business as Row).sms_notifications_enabled = true;
    const result = await retryBookingNotification({ businessId: "business-a", appointmentId: "appointment-a", channel: "customer_sms" });
    expect(result.items).toHaveLength(1); expect(result.items[0]).toMatchObject({ channel: "customer_sms", status: "sent" });
    expect(sendSMS).toHaveBeenCalledTimes(1); expect(sendEmail).not.toHaveBeenCalled();
    expect(delivery.provider).toHaveBeenCalledTimes(1);
  });

  it("rejects manual cross-tenant appointment references before provider dispatch", async () => {
    fixture(); durableDelivery();
    await expect(retryBookingNotification({ businessId: "business-b", appointmentId: "appointment-a", channel: "customer_email" }))
      .rejects.toThrow("Appointment not found");
    expect(sendEmail).not.toHaveBeenCalled(); expect(sendSMS).not.toHaveBeenCalled();
  });
});
