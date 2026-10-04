// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { financialDb, type Fault } from "../../helpers/financial-db";

const mocks = vi.hoisted(() => ({ client: vi.fn(), charge: vi.fn(), log: vi.fn(), softFallback: false }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@/lib/commerce/providers", () => ({ resolvePaymentProvider: () => ({ charge: mocks.charge }), getActiveProviderSummary: vi.fn() }));
vi.mock("@/lib/commerce/receipts", () => ({ createReceiptForTransaction: async () => ({ id: "receipt" }) }));
vi.mock("@/lib/commerce/audit", () => ({ writeCommerceAudit: vi.fn() }));
vi.mock("@/lib/commerce/events", () => ({ createCommerceEvent: (v: unknown) => v, emitCommerceEvent: vi.fn() }));
vi.mock("@/lib/supabase/errors", () => ({ logQueryError: mocks.log, isSoftSchemaFallbackAllowed: () => mocks.softFallback }));
import { recordCommercePayment } from "@/lib/commerce/payments";

const input = { businessId: "biz", customerId: "customer", appointmentId: "appt", amountCents: 500, currency: "cad", method: "cash" as const, ensureInvoice: true };
function setup(existing: boolean, fault?: Fault) {
  const state = financialDb({
    customers: [{ id: "customer", business_id: "biz", store_credit_cents: 0 }],
    businesses: [{ id: "biz" }],
    appointments: [{ id: "appt", business_id: "biz", customer_id: "customer", price_cents: 1000, tax_cents: 0, amount_paid_cents: 0, amount_refunded_cents: 0 }],
    commerce_invoice_sequences: [{ business_id: "biz", next_number: 1, prefix: "INV" }],
    commerce_invoices: existing ? [{ id: "inv", business_id: "biz", appointment_id: "appt", total_cents: 1000, amount_paid_cents: 0, status: "open" }] : [],
    commerce_invoice_lines: [], commerce_transactions: [],
  }, fault);
  mocks.client.mockResolvedValue(state.db);
  return state;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.softFallback = false;
  mocks.charge.mockResolvedValue({ ok: true, status: "succeeded", provider: "manual" });
});

describe("payment-triggered invoice availability", () => {
  it.each(["line-less", "lookup error", "lookup throw", "reload error", "lines error"])("pre-existing %s invoice permits unbound collection without a replacement invoice", async failure => {
    const state = setup(true, q => {
      if (q.operation !== "select") return;
      if (failure === "lines error" && q.table === "commerce_invoice_lines") return "error";
      if (q.table !== "commerce_invoices") return;
      if (failure === "lookup error") return "error";
      if (failure === "lookup throw") return "throw";
      if (failure === "reload error" && q.filters.some(([key]) => key === "id")) return "error";
    });
    const result = await recordCommercePayment(input);
    expect(result).toMatchObject({ ok: true, recorded: true, canRetry: false, syncStatus: "complete", transaction: { invoiceId: null } });
    expect(mocks.charge).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ invoice_id: "" }) }));
    expect(state.rows.commerce_transactions[0].invoice_id).toBeNull();
    expect(state.rows.commerce_invoices).toHaveLength(1);
    expect(state.calls.filter(q => ["commerce_invoices", "commerce_invoice_lines", "commerce_invoice_sequences"].includes(q.table) && q.operation !== "select")).toEqual([]);
    expect(mocks.log).toHaveBeenCalledWith("commerce.invoice.existing.verify", expect.any(String));
    expect(state.rows.appointments[0].amount_paid_cents).toBe(500);
  });

  it.each(["sequence read", "sequence insert", "sequence update", "sequence zero", "line insert"])("new invoice %s failure stops before provider/ledger", async failure => {
    const state = setup(false, q => {
      if (failure === "line insert" && q.table === "commerce_invoice_lines" && q.operation === "insert") return "error";
      if (q.table !== "commerce_invoice_sequences") return;
      if (failure === "sequence read" && q.operation === "select") return "error";
      if (failure === "sequence insert" && q.operation === "insert") return "error";
      if (failure === "sequence update" && q.operation === "update") return "error";
      if (failure === "sequence zero" && q.operation === "update") return "zero";
    });
    if (failure === "sequence insert") {
      state.rows.commerce_invoice_sequences.length = 0;
      mocks.softFallback = true;
    }
    const result = await recordCommercePayment(input);
    expect(result).toMatchObject({ ok: false, error: "Could not prepare the payment invoice. No payment was recorded." });
    expect(mocks.charge).not.toHaveBeenCalled();
    expect(state.rows.commerce_transactions).toHaveLength(0);
    expect(state.rows.commerce_invoices).toHaveLength(failure === "line insert" ? 1 : 0);
    expect(mocks.log).toHaveBeenCalled();
    if (failure === "sequence insert") expect(mocks.log).toHaveBeenCalledWith("commerce.invoice.seq", "Synthetic query failure");
    if (failure === "line insert") {
      // Existing incomplete invoice is never replaced on a later collection.
      expect(await recordCommercePayment(input)).toMatchObject({ ok: true, transaction: { invoiceId: null } });
      expect(state.rows.commerce_invoices).toHaveLength(1);
      expect(state.calls.filter(q => q.table === "commerce_invoices" && q.operation === "insert")).toHaveLength(1);
    }
  });

  it("retains the existing invoice reload cause even with soft fallback enabled", async () => {
    setup(true, q => q.table === "commerce_invoices" && q.operation === "select" && q.filters.some(([key]) => key === "id") ? "error" : undefined);
    mocks.softFallback = true;
    expect(await recordCommercePayment(input)).toMatchObject({ ok: true, transaction: { invoiceId: null } });
    expect(mocks.log).toHaveBeenCalledWith("commerce.invoice.get", "Synthetic query failure");
  });

  it("verified existing invoice remains bound without duplicate creation", async () => {
    const state = setup(true);
    state.rows.commerce_invoice_lines.push({ id: "line", invoice_id: "inv", business_id: "biz" });
    expect(await recordCommercePayment(input)).toMatchObject({ ok: true, transaction: { invoiceId: "inv" } });
    expect(state.rows.commerce_invoices).toHaveLength(1);
    expect(state.rows.commerce_invoices[0].amount_paid_cents).toBe(500);
  });
});
