// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { financialDb, type Row } from "../../helpers/financial-db";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ client: vi.fn(), charge: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => { throw new Error("No hosted client in this fixture"); } }));
vi.mock("@/lib/commerce/providers", () => ({ resolvePaymentProvider: () => ({ charge: mocks.charge }) }));
vi.mock("@/lib/commerce/invoices", () => ({ createInvoiceForAppointment: vi.fn() }));
vi.mock("@/lib/commerce/receipts", () => ({ createReceiptForTransaction: async () => ({ id: "receipt" }) }));
vi.mock("@/lib/commerce/audit", () => ({ writeCommerceAudit: vi.fn() }));
vi.mock("@/lib/commerce/events", () => ({ createCommerceEvent: (value: unknown) => value, emitCommerceEvent: vi.fn() }));
vi.mock("@/lib/supabase/errors", () => ({ logQueryError: vi.fn(), isSoftSchemaFallbackAllowed: () => false }));
import { recordCommercePayment } from "@/lib/commerce/payments";

const appointment = (id: string, businessId: string): Row => ({
  id, business_id: businessId, price_cents: 10000, tax_cents: 1300,
  deposit_cents: 5000, amount_paid_cents: 0, amount_refunded_cents: 0,
});
const payment = () => recordCommercePayment({
  businessId: "biz", customerId: "customer", appointmentId: "appt",
  amountCents: 1025, currency: "cad", method: "e_transfer", kind: "payment",
  forceManual: true, ensureInvoice: false, sendReceiptEmail: false,
});
function setup(businessId = "biz", changeBusinessBeforeUpdate = false) {
  let foreignRowBeforeUpdate: Row | undefined;
  const state = financialDb({
    customers: [{ id: "customer", business_id: "biz", store_credit_cents: 0 }],
    appointments: [appointment("appt", businessId), appointment("other-appt", "other-biz")],
    commerce_transactions: [],
  }, query => {
    if (changeBusinessBeforeUpdate && query.table === "appointments" && query.operation === "update") {
      // A synthetic interleaving after the Business-scoped read. The fake applies
      // the actual query predicates to the current row; it provides NO RLS.
      state.rows.appointments[0].business_id = "other-biz";
      foreignRowBeforeUpdate = structuredClone(state.rows.appointments[0]);
    }
    return undefined;
  });
  mocks.client.mockResolvedValue(state.db);
  return { ...state, foreignRowBeforeUpdate: () => foreignRowBeforeUpdate };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.charge.mockResolvedValue({ ok: true, status: "succeeded", provider: "manual" });
});

describe("N02 appointment UPDATE Business predicate — synthetic, not hosted isolation proof", () => {
  it("updates only the requested appointment in the resolved Business", async () => {
    const state = setup();
    const other = structuredClone(state.rows.appointments[1]);
    const result = await payment();
    expect(result.ok).toBe(true);
    expect(state.rows.appointments[0]).toMatchObject({ business_id: "biz", amount_paid_cents: 1025, price_cents: 10000, tax_cents: 1300, deposit_cents: 5000 });
    expect(state.rows.appointments[1]).toEqual(other);
    for (const query of state.calls.filter(q => q.table === "appointments")) {
      expect(query.filters).toContainEqual(["id", "appt"]);
      expect(query.filters).toContainEqual(["business_id", "biz"]);
    }
  });

  it("does not update an appointment already belonging to another Business", async () => {
    const state = setup("other-biz");
    const before = structuredClone(state.rows.appointments);
    const result = await payment();
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Appointment not found for payment sync");
    expect(state.rows.appointments).toEqual(before);
    expect(state.calls.filter(q => q.table === "appointments" && q.operation === "update")).toEqual([]);
  });

  it("does not update a row belonging to another Business at UPDATE time after a scoped read", async () => {
    const state = setup("biz", true);
    await payment();
    expect(state.foreignRowBeforeUpdate()).toBeDefined();
    expect(state.rows.appointments[0]).toEqual(state.foreignRowBeforeUpdate());
    expect(state.rows.appointments[0].amount_paid_cents).toBe(0);
    expect(state.calls.filter(q => q.table === "appointments" && q.operation === "update")).toHaveLength(1);
    // This proves only the UPDATE predicate. The unchanged writer can already
    // have recorded money and does not detect zero affected rows; no atomicity,
    // rollback, whole-payment rejection or concurrency acceptance is asserted.
  });
});
