// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { financialDb } from "../../helpers/financial-db";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ client: vi.fn(), create: vi.fn(), charge: vi.fn(), invoice: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: async () => ({ id: "biz", currency: "cad" }) }));
vi.mock("@/lib/booking-engine", () => ({ createBooking: mocks.create }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => { throw new Error("No service client in this fixture"); } }));
vi.mock("@/lib/commerce/providers", () => ({ resolvePaymentProvider: () => ({ charge: mocks.charge }) }));
vi.mock("@/lib/commerce/invoices", () => ({ createInvoiceForAppointment: mocks.invoice }));
vi.mock("@/lib/commerce/receipts", () => ({ createReceiptForTransaction: async () => ({ id: "receipt" }) }));
vi.mock("@/lib/commerce/audit", () => ({ writeCommerceAudit: vi.fn() }));
vi.mock("@/lib/commerce/events", () => ({ createCommerceEvent: (v: unknown) => v, emitCommerceEvent: vi.fn() }));
vi.mock("@/lib/supabase/errors", () => ({ logQueryError: vi.fn(), isSoftSchemaFallbackAllowed: () => false }));
vi.mock("@/lib/commerce", async () => ({
  recordCommercePayment: (await import("@/lib/commerce/payments")).recordCommercePayment,
  listTransactions: async () => [], parsePaymentMethod: (method: string) => method,
}));
vi.mock("@/lib/booking-engine/conflicts", () => ({ logAppointmentChange: vi.fn() }));
vi.mock("@/lib/notifications/booking-delivery", () => ({ deliverBookingNotifications: mocks.notify }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { createAppointment } from "@/lib/actions/appointments";

function form(amount: string) {
  const data = new FormData();
  Object.entries({
    customer_id: "customer", service_id: "service", staff_id: "staff", location_id: "location",
    start_time: "2026-11-12T16:00:00Z", price_cents: "10000", tax_cents: "1300", deposit_cents: "5000",
    payment_mode: "custom", payment_amount_cents: amount, payment_method: "e_transfer",
    payment_idempotency_key: "n02-local-synthetic", payment_send_receipt: "0",
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
function setup() {
  const state = financialDb({
    customers: [{ id: "customer", business_id: "biz", store_credit_cents: 0 }],
    appointments: [{ id: "appt", business_id: "biz", price_cents: 10000, tax_cents: 1300, deposit_cents: 5000, amount_paid_cents: 0, amount_refunded_cents: 0 }],
    commerce_invoices: [{ id: "invoice", business_id: "biz", total_cents: 11300, amount_paid_cents: 0, amount_refunded_cents: 0, status: "open" }],
    commerce_transactions: [],
  });
  mocks.client.mockResolvedValue(state.db);
  return state;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.create.mockResolvedValue({ phase: "success", data: { appointmentId: "appt" } });
  mocks.charge.mockResolvedValue({ ok: true, status: "succeeded", provider: "manual" });
  mocks.invoice.mockResolvedValue({ invoice: { id: "invoice" } });
  mocks.notify.mockResolvedValue({ items: [] });
});

describe("N02 synthetic submission through unchanged booking action and payment writer", () => {
  it.each(["", "0"])("rejects incomplete custom amount %s before any writer", async amount => {
    const state = setup();
    const result = await createAppointment({}, form(amount));
    expect(result.error).toContain("Payment amount could not be verified");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.charge).not.toHaveBeenCalled();
    expect(state.calls).toEqual([]);
  });

  it("carries exact cents, CAD, method, idempotency marker and scoped financial records", async () => {
    const state = setup();
    const result = await createAppointment({}, form("1025"));
    expect(result.payment).toMatchObject({ status: "recorded", amountCents: 1025, method: "e_transfer" });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ businessId: "biz", priceCents: 10000, taxCents: 1300, depositCents: 5000 }));
    expect(state.rows.commerce_transactions[0]).toMatchObject({ amount_cents: 1025, currency: "cad", business_id: "biz", description: "booking:n02-local-synthetic" });
    expect(state.rows.appointments[0]).toMatchObject({ price_cents: 10000, tax_cents: 1300, deposit_cents: 5000, amount_paid_cents: 1025 });
    for (const call of state.calls.filter(q => q.operation === "update")) expect(call.filters).toContainEqual(["business_id", "biz"]);
  });

  it("CHARACTERIZES unresolved legacy overpayment acceptance; this is not policy approval", async () => {
    const state = setup();
    const result = await createAppointment({}, form("15000"));
    expect(result.payment).toMatchObject({ status: "recorded", amountCents: 15000 });
    expect(state.rows.commerce_transactions[0]).toMatchObject({ amount_cents: 15000, business_id: "biz" });
    expect(state.rows.appointments[0]).toMatchObject({ price_cents: 10000, tax_cents: 1300, amount_paid_cents: 15000 });
    expect(state.rows.commerce_invoices[0]).toMatchObject({ total_cents: 11300, amount_paid_cents: 15000, balance_cents: 0 });
  });
});
