// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SendIntent, SendIntentStore } from "@/lib/communications/send-intent";
let store: SendIntentStore;
let rows: Map<string, SendIntent>;
let loseAcceptance = false;
vi.mock("@/lib/communications/send-intent", async (original) => {
  const actual = await original<typeof import("@/lib/communications/send-intent")>();
  return { ...actual,
    inspectSendIntent: (input: Parameters<typeof actual.inspectSendIntent>[0]) => actual.inspectSendIntent(input, store),
    runDurableSend: (input: Parameters<typeof actual.runDurableSend>[0], send: Parameters<typeof actual.runDurableSend>[1]) => actual.runDurableSend(input, send, store) };
});
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/communications/providers", () => ({ providerSendEmail: vi.fn(), providerSendSms: vi.fn() }));
vi.mock("@/lib/communications/preferences", () => ({ channelAllowed: vi.fn(() => true), loadBusinessCommPreferences: async () => ({}), loadCustomerCommPreferences: async () => ({}) }));
vi.mock("@/lib/communications/templates", () => ({ renderEmailTemplate: () => ({ key: "custom", subject: "Synthetic", text: "Synthetic", html: "<p>Synthetic</p>" }), renderSmsTemplate: () => ({ key: "custom", text: "Synthetic" }) }));
vi.mock("@/lib/communications/tenant-email-branding", () => ({ loadTenantEmailBranding: async () => ({ businessName: "Fictional", fromHeader: "sender@example.invalid" }), toBrandingContext: () => ({}), formatFromHeader: () => "sender@example.invalid" }));
vi.mock("@/lib/communications/email-from", () => ({ resolveEmailFromAddress: () => ({ from: "sender@example.invalid" }) }));
vi.mock("@/lib/communications/timeline", () => ({ appendCrmTimeline: vi.fn(), writeCommsAudit: vi.fn() }));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
import { createServiceClient } from "@/lib/supabase/service";
import { providerSendEmail, providerSendSms } from "@/lib/communications/providers";
import { appendCrmTimeline, writeCommsAudit } from "@/lib/communications/timeline";
import { sendEmail, sendSMS } from "@/lib/communications/delivery";
import { channelAllowed } from "@/lib/communications/preferences";

const input = { businessId: "business", to: "owned@example.invalid", templateKey: "custom",
  context: { businessId: "business", businessName: "Fictional", customerName: "Synthetic", staffName: "Synthetic", serviceName: "Synthetic", startTime: "2026-09-01T00:00:00Z" },
  reliability: { intentId: "same-occurrence", source: "worker" as const, jobId: "same-job", attempt: 1 } };

describe("provider acceptance survives post-send bookkeeping failures", () => {
  let logInsert: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.clearAllMocks(); rows = new Map(); loseAcceptance = false;
    vi.mocked(channelAllowed).mockReturnValue(true);
    store = {
      async insert(row) { const k = `${row.business_id}:${row.intent_key}`; if (rows.has(k)) return null; rows.set(k, structuredClone(row)); return row; },
      async find(biz, key) { return structuredClone(rows.get(`${biz}:${key}`) ?? null); },
      async compareAndSet(before, changes) { const k = `${before.business_id}:${before.intent_key}`; const row = rows.get(k); if (!row || row.owner_id !== before.owner_id || row.state !== before.state || row.attempt !== before.attempt) return null; if (changes.state === "accepted" && loseAcceptance) throw Error("acceptance write failed"); const next = { ...row, ...changes }; rows.set(k, next); return next; },
    };
    logInsert = vi.fn(async () => ({ error: null }));
    vi.mocked(createServiceClient).mockReturnValue({ from: () => ({ insert: logInsert }) } as never);
    vi.mocked(providerSendEmail).mockResolvedValue({ success: true, provider: "stub", messageId: "synthetic-email" });
    vi.mocked(providerSendSms).mockResolvedValue({ success: true, provider: "stub", messageId: "synthetic-sms" });
    vi.mocked(appendCrmTimeline).mockResolvedValue(true);
    vi.mocked(writeCommsAudit).mockResolvedValue(true);
  });

  it("reserves and persists acceptance before writing notification_logs", async () => {
    logInsert.mockImplementation(async () => {
      expect([...rows.values()][0].state).toBe("accepted"); return { error: null };
    });
    expect(await sendEmail(input)).toMatchObject({ ok: true, reconciliationRequired: false });
    expect(logInsert.mock.calls[0][0]).toMatchObject({ job_id: "same-job", attempt: 1, status: "sent" });
  });

  it("compatibility delivery writes original log columns before 029, preserving sent evidence", async () => {
    logInsert.mockImplementation(async (row) => {
      expect(row).not.toHaveProperty("customer_id");
      expect(row).not.toHaveProperty("job_id");
      expect(row).not.toHaveProperty("attempt");
      return { error: null };
    });
    const legacy = { ...input, customerId: "synthetic-customer", reliability: undefined };
    expect(await sendEmail(legacy)).toMatchObject({ ok: true, deliveryState: "accepted" });
    expect(logInsert.mock.calls[0][0]).toMatchObject({ status: "sent", provider_message_id: "synthetic-email" });
  });

  it.each(["before_log", "after_log", "timeline", "audit"])("%s failure does not turn accepted delivery into failure or resend", async (boundary) => {
    if (boundary === "before_log") logInsert.mockResolvedValue({ error: { message: "injected database error" } });
    if (boundary === "after_log") logInsert.mockRejectedValue(Error("log inserted; response lost"));
    if (boundary === "timeline") vi.mocked(appendCrmTimeline).mockRejectedValue(Error("injected after-log error"));
    if (boundary === "audit") vi.mocked(writeCommsAudit).mockResolvedValue(false);
    expect(await sendEmail(input)).toMatchObject({ ok: true, deliveryState: "accepted", reconciliationRequired: true });
    expect(await sendEmail(input)).toMatchObject({ ok: true, duplicateSuppressed: true });
    expect(providerSendEmail).toHaveBeenCalledTimes(1);
    expect(logInsert).toHaveBeenCalledTimes(1);
  });

  it("accepted provider plus ledger write failure plus log failure retains a no-replay reservation", async () => {
    loseAcceptance = true; logInsert.mockRejectedValue(Error("database unavailable"));
    expect(await sendEmail(input)).toMatchObject({ ok: true, reconciliationRequired: true });
    expect(await sendEmail(input)).toMatchObject({ ok: false, deliveryState: "unknown", retrySafe: false });
    expect(providerSendEmail).toHaveBeenCalledTimes(1);
  });

  it("SMS has the same durable guard even without provider idempotency support", async () => {
    logInsert.mockResolvedValue({ error: { message: "injected" } });
    expect(await sendSMS(input)).toMatchObject({ ok: true, reconciliationRequired: true });
    expect(await sendSMS(input)).toMatchObject({ ok: true, duplicateSuppressed: true });
    expect(providerSendSms).toHaveBeenCalledTimes(1);
  });

  it("ambiguous acceptance is never recorded as a proven failed send", async () => {
    vi.mocked(providerSendEmail).mockResolvedValue({ success: false, provider: "stub", retrySafe: false });
    expect(await sendEmail(input)).toMatchObject({ deliveryState: "unknown", retrySafe: false, reconciliationRequired: true });
    expect(logInsert.mock.calls[0][0]).toMatchObject({ status: "pending", provider_response: { deliveryState: "unknown" } });
    await sendEmail(input);
    expect(providerSendEmail).toHaveBeenCalledTimes(1);
  });

  it("accepted delivery remains accepted when preferences change before a queued twin runs", async () => {
    expect(await sendEmail(input)).toMatchObject({ ok: true });
    vi.mocked(channelAllowed).mockReturnValue(false);
    expect(await sendEmail(input)).toMatchObject({ ok: true, deliveryState: "accepted", duplicateSuppressed: true });
    expect(providerSendEmail).toHaveBeenCalledTimes(1);
  });
});
