// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { financialDb, type Fault } from "../../helpers/financial-db";

const mocks = vi.hoisted(() => ({ client: vi.fn(), service: vi.fn(), charge: vi.fn(), refund: vi.fn(), invoice: vi.fn(), receipt: vi.fn(), email: vi.fn(), audit: vi.fn(), event: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.service }));
vi.mock("@/lib/env", () => ({ getSupabaseEnv: () => ({ url: "https://example.invalid" }), requireServiceRoleKey: () => "test-only" }));
vi.mock("@/lib/commerce/providers", () => ({ resolvePaymentProvider: () => ({ charge: mocks.charge, refund: mocks.refund }), getActiveProviderSummary: vi.fn() }));
vi.mock("@/lib/commerce/invoices", () => ({ createInvoiceForAppointment: mocks.invoice }));
vi.mock("@/lib/commerce/receipts", () => ({ createReceiptForTransaction: mocks.receipt, queueReceiptEmail: mocks.email }));
vi.mock("@/lib/commerce/audit", () => ({ writeCommerceAudit: mocks.audit }));
vi.mock("@/lib/commerce/events", () => ({ createCommerceEvent: (v: unknown) => v, emitCommerceEvent: mocks.event }));
import { recordCommercePayment, finalizeStripePaymentIntent } from "@/lib/commerce/payments";
import { processCommerceRefund } from "@/lib/commerce/refunds";

const input = { businessId: "biz", customerId: "customer", appointmentId: "appt", amountCents: 500, currency: "cad", method: "cash" as const };
const payment = { id: "tx", business_id: "biz", customer_id: "customer", appointment_id: "appt", invoice_id: "inv", kind: "payment", status: "requires_action", method: "credit_card", amount_cents: 500, currency: "cad", provider: "stripe", provider_payment_intent_id: "pi-test" };
function setup(fault?: Fault) {
  const state = financialDb({
    customers: [{ id: "customer", business_id: "biz", store_credit_cents: 1000 }],
    appointments: [{ id: "appt", business_id: "biz", price_cents: 1000, tax_cents: 0, deposit_cents: 500, amount_paid_cents: 0, amount_refunded_cents: 0 }],
    commerce_invoices: [{ id: "inv", business_id: "biz", total_cents: 1000, amount_paid_cents: 0, amount_refunded_cents: 0, status: "open" }],
    commerce_transactions: [], commerce_refunds: [],
    gift_cards: [{ id: "gift", business_id: "biz", code: "TEST", status: "active", balance_cents: 1000 }],
  }, fault);
  mocks.client.mockResolvedValue(state.db);
  mocks.service.mockReturnValue(state.db);
  return state;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.charge.mockResolvedValue({ ok: true, status: "succeeded", provider: "manual" });
  mocks.refund.mockResolvedValue({ ok: true, providerReference: "refund" });
  mocks.invoice.mockResolvedValue({ invoice: { id: "inv" } });
  mocks.receipt.mockResolvedValue({ id: "receipt" });
  mocks.email.mockResolvedValue({ ok: true });
});

describe("Phase A payment recording", () => {
  it("records CAD through provider, ledger and mirror and proves scoped appointment/invoice writes", async () => {
    const state = setup();
    const result = await recordCommercePayment({ ...input, ensureInvoice: true });
    expect(result).toMatchObject({ ok: true, recorded: true, canRetry: false, syncStatus: "complete", transaction: { currency: "cad", invoiceId: "inv" } });
    expect(mocks.charge).toHaveBeenCalledWith(expect.objectContaining({ currency: "cad", metadata: expect.objectContaining({ invoice_id: "inv" }) }));
    expect(state.rows.customer_payment_events[0].currency).toBe("cad");
    for (const call of state.calls.filter(q => q.operation === "update")) {
      expect(call.filters).toContainEqual(["business_id", "biz"]);
      expect(call.returning).toBe(true);
    }
    expect(state.rows.appointments[0].amount_paid_cents).toBe(500);
    expect(state.rows.commerce_invoices[0].amount_paid_cents).toBe(500);
  });

  it.each(["appointments", "customers", "gift_cards", "commerce_invoices"])("%s zero-row update preserves recorded identity and refuses retry", async table => {
    const state = setup(q => q.table === table && q.operation === "update" ? "zero" : undefined);
    const result = await recordCommercePayment({ ...input, invoiceId: "inv", method: table === "customers" ? "store_credit" : table === "gift_cards" ? "gift_card" : "cash", giftCardId: "gift" });
    expect(result).toMatchObject({ ok: false, recorded: true, canRetry: false, syncStatus: "failed", transaction: { id: expect.any(String) } });
    expect(result.error).toMatch(/Payment recorded.*Do not collect/);
    const update = state.calls.find(q => q.table === table && q.operation === "update")!;
    expect(update.filters).toContainEqual(["business_id", "biz"]);
    expect(update.returning).toBe(true);
  });

  it.each(["select", "update"] as const)("invoice %s errors surface after recording", async operation => {
    setup(q => q.table === "commerce_invoices" && q.operation === operation ? "error" : undefined);
    expect(await recordCommercePayment({ ...input, invoiceId: "inv" })).toMatchObject({ ok: false, recorded: true, canRetry: false, syncStatus: "failed" });
  });

  it("CRM mirror insert failure never erases committed money", async () => {
    const state = setup(q => q.table === "customer_payment_events" ? "error" : undefined);
    const result = await recordCommercePayment(input);
    expect(state.rows.commerce_transactions).toHaveLength(1);
    expect(result).toMatchObject({ ok: false, recorded: true, canRetry: false, transaction: { id: state.rows.commerce_transactions[0].id } });
    expect(result.error).toContain("CRM payment mirror");
  });

  it.each(["receipt", "audit", "event"] as const)("%s throw after commit is non-retryable with identity", async step => {
    const state = setup();
    mocks[step].mockRejectedValue(new Error("Synthetic failure"));
    const result = await recordCommercePayment(input);
    expect(result).toMatchObject({ ok: false, recorded: true, canRetry: false, syncStatus: "failed", transaction: { id: state.rows.commerce_transactions[0].id } });
    expect(result.error).toContain(step);
  });

  it.each(["invalid amount", "customer missing", "insufficient credit", "gift missing", "insufficient gift"])("%s validation creates no invoice or provider effect", async reason => {
    const state = setup();
    if (reason === "customer missing") state.rows.customers.length = 0;
    if (reason === "insufficient gift") state.rows.gift_cards[0].balance_cents = 1;
    const result = await recordCommercePayment({ ...input, ensureInvoice: true, amountCents: reason === "invalid amount" ? NaN : reason === "insufficient credit" ? 2000 : 500, method: reason.includes("gift") ? "gift_card" : reason.includes("credit") ? "store_credit" : "cash", giftCardId: reason === "gift missing" ? "missing" : "gift" });
    expect(result.ok).toBe(false);
    expect(mocks.invoice).not.toHaveBeenCalled();
    expect(mocks.charge).not.toHaveBeenCalled();
    expect(state.rows.commerce_transactions).toHaveLength(0);
  });

  it("invoice preparation failure surfaces before provider effect", async () => {
    setup(); mocks.invoice.mockResolvedValue({ invoice: null, error: "Sequence allocation failed" });
    expect(await recordCommercePayment({ ...input, ensureInvoice: true })).toMatchObject({ ok: false, error: "Sequence allocation failed" });
    expect(mocks.charge).not.toHaveBeenCalled();
  });

  it("accepted pending card keeps required invoice identity through finalization", async () => {
    const state = setup();
    mocks.charge.mockResolvedValue({ ok: true, status: "requires_action", provider: "stripe", providerPaymentIntentId: "pi-test" });
    const pending = await recordCommercePayment({ ...input, method: "credit_card", ensureInvoice: true });
    expect(pending).toMatchObject({ requiresAction: true, transaction: { invoiceId: "inv", status: "requires_action" } });
    expect(state.rows.appointments[0].amount_paid_cents).toBe(0);
    expect(await finalizeStripePaymentIntent({ providerPaymentIntentId: "pi-test" })).toMatchObject({ ok: true, recorded: true });
    expect(state.rows.commerce_invoices[0].amount_paid_cents).toBe(500);
  });
});

describe("Phase A webhook compare-and-swap", () => {
  it("concurrent identical pending snapshots and later replay apply projections exactly once", async () => {
    const state = setup(); state.rows.commerce_transactions.push({ ...payment });
    const results = await Promise.all([finalizeStripePaymentIntent({ providerPaymentIntentId: "pi-test" }), finalizeStripePaymentIntent({ providerPaymentIntentId: "pi-test" })]);
    expect(results.filter(r => r.syncStatus === "complete")).toHaveLength(1);
    expect(results.filter(r => r.replay)).toHaveLength(1);
    expect(await finalizeStripePaymentIntent({ providerPaymentIntentId: "pi-test" })).toMatchObject({ replay: true, syncStatus: "unknown" });
    expect(state.rows.appointments[0].amount_paid_cents).toBe(500);
    expect(state.rows.commerce_invoices[0].amount_paid_cents).toBe(500);
    expect(state.rows.customer_payment_events).toHaveLength(1);
    const updates = state.calls.filter(q => q.table === "commerce_transactions" && q.operation === "update");
    expect(updates).toHaveLength(2);
    for (const q of updates) {
      expect(q.filters).toEqual(expect.arrayContaining([["business_id", "biz"], ["status", "requires_action"]]));
      expect(q.returning).toBe(true);
    }
  });
  it("zero-row CAS skips all projections", async () => {
    const state = setup(q => q.operation === "update" && q.table === "commerce_transactions" ? "zero" : undefined);
    state.rows.commerce_transactions.push({ ...payment });
    expect(await finalizeStripePaymentIntent({ providerPaymentIntentId: "pi-test" })).toMatchObject({ replay: true, syncStatus: "unknown" });
    expect(state.calls.filter(q => q.operation === "update").map(q => q.table)).toEqual(["commerce_transactions"]);
    expect(mocks.receipt).not.toHaveBeenCalled();
  });
  it("partial sync is disclosed and replay cannot increment cache again", async () => {
    const state = setup(q => q.table === "customer_payment_events" ? "error" : undefined);
    state.rows.commerce_transactions.push({ ...payment });
    expect(await finalizeStripePaymentIntent({ providerPaymentIntentId: "pi-test" })).toMatchObject({ ok: false, recorded: true, canRetry: false, transaction: { id: "tx" } });
    await finalizeStripePaymentIntent({ providerPaymentIntentId: "pi-test" });
    expect(state.rows.appointments[0].amount_paid_cents).toBe(500);
  });
});

describe("Phase A refunds", () => {
  const refundInput = { businessId: "biz", transactionId: "tx", amountCents: 200, reason: "Test refund" };
  it("prior-history failure refuses refund before any provider or write", async () => {
    const state = setup(q => q.table === "commerce_refunds" && q.operation === "select" ? "error" : undefined);
    state.rows.commerce_transactions.push({ ...payment, status: "succeeded" });
    expect(await processCommerceRefund(refundInput)).toMatchObject({ ok: false, error: expect.stringContaining("prior refunds") });
    expect(mocks.refund).not.toHaveBeenCalled();
    expect(state.calls.every(q => q.operation === "select")).toBe(true);
  });
  it("preserves prior refund cap and normal partial-refund behavior", async () => {
    const state = setup(); state.rows.commerce_transactions.push({ ...payment, status: "succeeded" });
    expect(await processCommerceRefund(refundInput)).toMatchObject({ ok: true, refund: { amountCents: 200 } });
    expect(state.rows.commerce_transactions[0].status).toBe("partially_refunded");
    expect(state.rows.appointments[0].amount_refunded_cents).toBe(200);
    for (const q of state.calls.filter(q => q.operation === "update")) {
      expect(q.filters).toContainEqual(["business_id", "biz"]);
      expect(q.returning).toBe(true);
    }
    const capped = await processCommerceRefund({ ...refundInput, amountCents: 400 });
    expect(capped.error).toContain("exceeds remaining");
    expect(mocks.refund).toHaveBeenCalledTimes(1);
  });
  it.each(["commerce_transactions", "appointments", "commerce_invoices"])("%s zero-row sync retains refund identity", async table => {
    const state = setup(q => q.table === table && q.operation === "update" ? "zero" : undefined);
    state.rows.commerce_transactions.push({ ...payment, status: "succeeded" });
    expect(await processCommerceRefund(refundInput)).toMatchObject({ ok: false, recorded: true, canRetry: false, refund: { id: expect.any(String) } });
  });
});
