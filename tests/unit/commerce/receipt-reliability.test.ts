import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/communications/delivery", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/communications/send-intent", () => ({ inspectSendIntent: vi.fn(), inspectUnresolvedSendIntent: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/commerce/payments", () => ({ listTransactions: vi.fn() }));
vi.mock("@/lib/commerce/audit", () => ({ writeCommerceAudit: vi.fn() }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: vi.fn(async () => ({ id: "business-a" })) }));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
import { sendEmail } from "@/lib/communications/delivery";
import { inspectSendIntent, inspectUnresolvedSendIntent } from "@/lib/communications/send-intent";
import { originalReceiptIntentId } from "@/lib/communications/intent-identity";
import { createClient } from "@/lib/supabase/server";
import { listTransactions } from "@/lib/commerce/payments";
import { retryPaymentReceiptForAppointment, sendPaymentReceiptNow } from "@/lib/commerce/receipts";
import { retryAppointmentNotification } from "@/lib/actions/notification-retry";

type Row = Record<string, unknown>;
const unknown = { success: false, provider: "local-stub", deliveryState: "unknown" as const,
  reconciliationRequired: true, retrySafe: false, duplicateSuppressed: true, providerCalled: false };
function fixture(status = "failed") {
  const receipt: Row = { id: "receipt-a", business_id: "business-a", transaction_id: "transaction-a",
    customer_id: "customer-a", amount_cents: 1000, method: "cash", currency: "CAD",
    receipt_number: "SYNTHETIC-1", email_status: status };
  const rows: Record<string, Row[]> = {
    commerce_receipts: [receipt],
    commerce_transactions: [{ id: "transaction-a", business_id: "business-a", customer_id: "customer-a",
      appointment_id: "appointment-a", status: "succeeded", kind: "deposit", method: "cash", currency: "CAD", amount_cents: 1000 }],
    appointments: [{ id: "appointment-a", business_id: "business-a", start_time: "2026-08-01T10:00:00Z",
      end_time: "2026-08-01T10:30:00Z", services: { name: "Fictional Service" },
      customers: { id: "customer-a", name: "Fictional Customer", email: "customer@example.invalid" },
      price_cents: 2000, tax_cents: 0, deposit_cents: 1000, amount_paid_cents: 1000, amount_refunded_cents: 0 }],
    customers: [{ id: "customer-a", name: "Fictional Customer", email: "customer@example.invalid" }],
    businesses: [{ id: "business-a", name: "Fictional Business", timezone: "UTC" }], tax_rates: [],
  };
  const faults = { acceptedMetadata: false, resetZero: false };
  const writes: Row[] = [];
  vi.mocked(listTransactions).mockResolvedValue([{ id: "transaction-a", businessId: "business-a", customerId: "customer-a",
    appointmentId: "appointment-a", status: "succeeded", kind: "deposit" }] as never);
  vi.mocked(createClient).mockResolvedValue({ from: (table: string) => {
    let changes: Row | undefined; const filters: Array<(row: Row) => boolean> = []; let single = false;
    const run = () => {
      const matching = (rows[table] ?? []).filter((row) => filters.every((f) => f(row)));
      if (changes?.email_status === "sent" && faults.acceptedMetadata) return { data: null, error: { message: "injected post-acceptance metadata failure" } };
      if (changes?.email_status === "failed" && receipt.email_status === "sent" && faults.resetZero) return { data: null, error: null };
      if (changes) for (const row of matching) { writes.push({ ...changes }); Object.assign(row, changes); }
      return { data: single ? matching[0] ?? null : matching, error: null };
    };
    const query = { select: () => query, order: () => query, limit: () => query,
      eq: (key: string, value: unknown) => { filters.push((row) => row[key] === value); return query; },
      in: (key: string, values: unknown[]) => { filters.push((row) => values.includes(row[key])); return query; },
      update: (value: Row) => { changes = value; return query; },
      maybeSingle: () => { single = true; return Promise.resolve(run()); },
      single: () => { single = true; return Promise.resolve(run()); },
      then: (resolve: (value: ReturnType<typeof run>) => unknown) => Promise.resolve(run()).then(resolve),
    };
    return query;
  } } as never);
  return { receipt, faults, writes };
}
const retry = () => retryPaymentReceiptForAppointment({ businessId: "business-a", appointmentId: "appointment-a" });
const send = () => sendPaymentReceiptNow({ businessId: "business-a", appointmentId: "appointment-a", receiptId: "receipt-a" });
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "true");
  vi.mocked(inspectSendIntent).mockResolvedValue(null); vi.mocked(inspectUnresolvedSendIntent).mockResolvedValue(null);
  vi.mocked(sendEmail).mockResolvedValue({ ok: true, deliveryState: "accepted", messageId: "local-accepted" });
});
afterEach(() => vi.unstubAllEnvs());

describe("receipt delivery and safe manual Retry", () => {
  it("preserves unknown provider truth and leaves the claimed receipt queued", async () => {
    const db = fixture(); vi.mocked(sendEmail).mockResolvedValue({ ok: false, deliveryState: "unknown", reconciliationRequired: true, retrySafe: false });
    expect(await send()).toMatchObject({ ok: false, deliveryState: "unknown", reconciliationRequired: true, retrySafe: false });
    expect(db.receipt.email_status).toBe("queued");
    expect(db.writes).toEqual([{ email_status: "queued" }]);
  });
  it("accepted delivery remains accepted when receipt metadata persistence fails", async () => {
    const db = fixture(); db.faults.acceptedMetadata = true;
    expect(await send()).toMatchObject({ ok: true, deliveryState: "accepted", reconciliationRequired: true, retrySafe: false });
    expect(db.receipt.email_status).toBe("queued");
  });
  it("a fresh known-accepted manual resend that becomes unknown cannot be retried again", async () => {
    const db = fixture("sent"); vi.mocked(sendEmail).mockResolvedValue({ ok: false, deliveryState: "unknown", reconciliationRequired: true, retrySafe: false });
    expect(await retry()).toMatchObject({ status: "failed", deliveryState: "unknown", reconciliationRequired: true, retrySafe: false });
    expect(vi.mocked(sendEmail).mock.calls[0][0].reliability?.intentId).not.toBe(originalReceiptIntentId("receipt-a"));
    expect(db.receipt.email_status).toBe("queued");
    expect(await retry()).toMatchObject({ status: "failed", deliveryState: "unknown", reconciliationRequired: true, retrySafe: false });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  it("holds a newer unknown manual occurrence even if old worker bookkeeping changed the receipt back to sent", async () => {
    const db = fixture("sent"); vi.mocked(inspectUnresolvedSendIntent).mockResolvedValue(unknown);
    vi.mocked(inspectSendIntent).mockResolvedValue({ ...unknown, success: true, deliveryState: "accepted", reconciliationRequired: false });
    expect(await retry()).toMatchObject({ status: "failed", deliveryState: "unknown", reconciliationRequired: true });
    expect(sendEmail).not.toHaveBeenCalled(); expect(db.writes).toHaveLength(0);
    expect(inspectUnresolvedSendIntent).toHaveBeenCalledWith(expect.objectContaining({ entityType: "receipt", entityId: "receipt-a" }));
  });
  it("allows a known accepted requested resend and keeps its occurrence separate", async () => {
    fixture("sent"); expect(await retry()).toMatchObject({ status: "sent", deliveryState: "accepted", reconciliationRequired: false });
    const context = vi.mocked(sendEmail).mock.calls[0][0].reliability!;
    expect(context.intentId).not.toBe(originalReceiptIntentId("receipt-a"));
    expect(context).toMatchObject({ entityType: "receipt", entityId: "receipt-a", source: "inline" });
  });
  it("confirmed rejection can safely retry its original occurrence", async () => {
    const db = fixture(); vi.mocked(sendEmail).mockResolvedValueOnce({ ok: false, deliveryState: "rejected", retrySafe: true });
    expect(await retry()).toMatchObject({ status: "failed", deliveryState: "rejected", retrySafe: true, reconciliationRequired: false });
    expect(db.receipt.email_status).toBe("failed"); expect(await retry()).toMatchObject({ status: "sent" });
    expect(vi.mocked(sendEmail).mock.calls.map(([input]) => input.reliability?.intentId))
      .toEqual([originalReceiptIntentId("receipt-a"), originalReceiptIntentId("receipt-a")]);
  });
  it("a lost sent-to-failed reset CAS holds without dispatch", async () => {
    const db = fixture("sent"); db.faults.resetZero = true;
    expect(await retry()).toMatchObject({ status: "failed", reconciliationRequired: true, retrySafe: false });
    expect(sendEmail).not.toHaveBeenCalled(); expect(db.receipt.email_status).toBe("sent");
  });
  it("an interrupted send remains queued and returns uncertainty", async () => {
    const db = fixture(); vi.mocked(sendEmail).mockRejectedValue(new Error("connection lost after provider acceptance"));
    expect(await send()).toMatchObject({ ok: false, deliveryState: "unknown", reconciliationRequired: true, retrySafe: false });
    expect(db.receipt.email_status).toBe("queued");
  });
  it("the Retry server action does not advertise retry for queued or uncertain receipts", async () => {
    fixture("queued"); const form = new FormData(); form.set("appointment_id", "appointment-a"); form.set("channel", "payment_receipt");
    const result = await retryAppointmentNotification({}, form);
    expect(result.notifications?.[0]).toMatchObject({ canRetry: false, reconciliationRequired: true, deliveryState: "unknown" });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
