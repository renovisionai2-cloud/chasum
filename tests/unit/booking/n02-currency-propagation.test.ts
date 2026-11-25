// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { financialDb } from "../../helpers/financial-db";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ business: vi.fn(), client: vi.fn(), create: vi.fn(), charge: vi.fn(), invoice: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: mocks.business }));
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
import { formatMoneyCents, normalizeCurrency } from "@/lib/commerce/money";
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
    commerce_transactions: [{ id: "historic-tx", business_id: "biz", currency: "usd", amount_cents: 2000 }],
    customer_payment_events: [{ id: "historic-event", business_id: "biz", currency: "usd", amount_cents: 2000 }],
  });
  mocks.client.mockResolvedValue(state.db);
  return state;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.business.mockResolvedValue({ id: "biz", currency: "cad" });
  mocks.create.mockResolvedValue({ phase: "success", data: { appointmentId: "appt" } });
  mocks.charge.mockResolvedValue({ ok: true, status: "succeeded", provider: "manual" });
  mocks.invoice.mockResolvedValue({ invoice: { id: "invoice" } });
  mocks.notify.mockResolvedValue({ items: [] });
});

// These tests exercise the real action and legacy writer with an in-memory DB.
// They establish propagation from a resolved Business, not live denomination validity.
describe("N02 Business currency propagation", () => {
  it.each([["cad", "cad"], [" CAD ", "cad"], ["usd", "usd"]])(
    "%s agrees across provider input, transaction, customer event and operator disclosure",
    async (currency, expected) => {
      mocks.business.mockResolvedValue({ id: "biz", currency });
      const state = setup();
      const historicalTransaction = structuredClone(state.rows.commerce_transactions[0]);
      const historicalEvent = structuredClone(state.rows.customer_payment_events[0]);
      const data = form("1025");
      data.set("currency", expected === "cad" ? "usd" : "cad"); // Untrusted form cannot select currency.
      const result = await createAppointment({}, data);
      expect(result.payment).toMatchObject({ status: "recorded", amountCents: 1025 });
      expect(mocks.charge).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ amountCents: 1025, currency: expected }));
      const transaction = state.rows.commerce_transactions.at(-1)!;
      const event = state.rows.customer_payment_events.at(-1)!;
      expect(transaction).toMatchObject({ business_id: "biz", amount_cents: 1025, currency: expected });
      expect(event).toMatchObject({ business_id: "biz", amount_cents: 1025, currency: expected });
      expect(result.success).toContain(`recorded — ${formatMoneyCents(1025, currency)} by E-Transfer`);
      expect(formatMoneyCents(1025, currency)).toBe(formatMoneyCents(1025, String(transaction.currency)));
      expect(state.rows.appointments[0]).toMatchObject({ price_cents: 10000, tax_cents: 1300, deposit_cents: 5000, amount_paid_cents: 1025 });
      expect(state.rows.commerce_transactions[0]).toEqual(historicalTransaction);
      expect(state.rows.customer_payment_events[0]).toEqual(historicalEvent);
      expect(state.rows.commerce_transactions).toHaveLength(2);
      expect(state.rows.customer_payment_events).toHaveLength(2);
    },
  );

  it("does not reach booking/payment writers when trusted Business resolution fails", async () => {
    const state = setup();
    mocks.business.mockRejectedValue(new Error("Business access could not be verified."));
    await expect(createAppointment({}, form("1025"))).rejects.toThrow("Business access could not be verified.");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.charge).not.toHaveBeenCalled();
    expect(state.calls).toEqual([]);
  });

  it.each([undefined, null, "", "unknown", "jpy"])(
    "CHARACTERIZES inherited USD fallback for %s: denomination is UNVERIFIED, not validated",
    async currency => {
      // The approved helper does not validate missing/unsupported evidence.
      // Passing this characterization is explicitly NOT financial acceptance.
      mocks.business.mockResolvedValue({ id: "biz", currency });
      const state = setup();
      const result = await createAppointment({}, form("1025"));
      expect(normalizeCurrency(currency)).toBe("usd");
      expect(result.payment?.status).toBe("recorded");
      expect(state.rows.commerce_transactions.at(-1)).toMatchObject({ currency: "usd", amount_cents: 1025 });
      expect(state.rows.customer_payment_events.at(-1)).toMatchObject({ currency: "usd", amount_cents: 1025 });
      expect(currency).not.toBe("usd"); // Normalization is not evidence of USD denomination.
    },
  );
});
