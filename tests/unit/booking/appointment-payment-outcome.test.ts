import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppointment } from "@/lib/actions/appointments";

const mocks = vi.hoisted(() => ({
  create: vi.fn(), record: vi.fn(), transactions: vi.fn(),
  log: vi.fn(), notify: vi.fn(), revalidate: vi.fn(), currency: "cad" as string | undefined,
}));
vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: async () => ({ id: "business", currency: mocks.currency }),
}));
vi.mock("@/lib/booking-engine", () => ({ createBooking: mocks.create }));
vi.mock("@/lib/commerce", () => ({
  recordCommercePayment: mocks.record,
  listTransactions: mocks.transactions,
  parsePaymentMethod: (method: string) => method,
}));
vi.mock("@/lib/booking-engine/conflicts", () => ({ logAppointmentChange: mocks.log }));
vi.mock("@/lib/notifications/booking-delivery", () => ({ deliverBookingNotifications: mocks.notify }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

function form() {
  const data = new FormData();
  Object.entries({
    customer_id: "customer", service_id: "service", staff_id: "staff",
    location_id: "location", start_time: "2026-10-10T16:00:00Z",
    price_cents: "22000", tax_cents: "2860", deposit_cents: "5000",
    payment_mode: "deposit", payment_amount_cents: "5000", payment_method: "e_transfer",
    payment_idempotency_key: "bs-outcome", payment_send_receipt: "0",
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}

const transaction = {
  id: "tx-committed", amountCents: 4000, status: "succeeded",
  description: "booking:bs-outcome",
};

describe("booking payment persistence truth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.currency = "cad";
    mocks.create.mockResolvedValue({ phase: "success", data: { appointmentId: "appt" } });
    mocks.transactions.mockResolvedValue([]);
    mocks.notify.mockResolvedValue({ items: [] });
  });

  it("preserves a committed transaction when financial sync fails and forbids retry", async () => {
    mocks.record.mockResolvedValue({ ok: false, transaction, error: "Synthetic sync failure" });
    const result = await createAppointment({}, form());
    expect(result.payment).toMatchObject({
      status: "failed", transactionId: "tx-committed", canRetry: false,
      amountCents: 4000, kind: "deposit", method: "e_transfer", methodLabel: "E-Transfer",
    });
    expect(result.payment?.detail).toMatch(/Payment was recorded.*financial sync failed.*Synthetic sync failure/);
    expect(result.success).toMatch(/payment was recorded.*financial sync failed/);
    expect(`${result.success} ${result.payment?.detail}`).not.toMatch(/Collect payment|retry|not recorded|could not be recorded/i);
    expect(mocks.create.mock.invocationCallOrder[0]).toBeLessThan(mocks.record.mock.invocationCallOrder[0]);
    expect(mocks.record.mock.invocationCallOrder[0]).toBeLessThan(mocks.notify.mock.invocationCallOrder[0]);
    expect(mocks.notify).toHaveBeenCalledWith("appt", { bookingChannel: "staff" });
  });

  it("offers manual collection only when no transaction persisted", async () => {
    mocks.record.mockResolvedValue({ ok: false, error: "Synthetic insert failure" });
    const result = await createAppointment({}, form());
    expect(result).toMatchObject({
      appointmentId: "appt",
      payment: {
        status: "failed", transactionId: null, canRetry: true, amountCents: 5000,
        kind: "deposit", method: "e_transfer", methodLabel: "E-Transfer", detail: "Synthetic insert failure",
      },
    });
    expect(result.success).toContain("payment could not be recorded. Use Collect payment to retry.");
  });

  it("uses committed amount in success disclosure and change log without changing the requested payment", async () => {
    mocks.record.mockResolvedValue({ ok: true, transaction });
    const result = await createAppointment({}, form());
    expect(mocks.record).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 5000, currency: "cad", forceManual: true }));
    expect(result.payment).toMatchObject({ status: "recorded", amountCents: 4000, transactionId: "tx-committed" });
    expect(result.success).toContain("Deposit recorded — $40 by E-Transfer");
    expect(mocks.log).toHaveBeenCalledWith(expect.objectContaining({
      afterState: expect.objectContaining({ amountCents: 4000, summary: "Deposit recorded — $40 by E-Transfer" }),
    }));
  });

  it("returns the actual matching transaction for an already-recorded payment", async () => {
    mocks.transactions.mockResolvedValue([
      { ...transaction, id: "unrelated", amountCents: 1200 },
      { ...transaction, id: "matching", amountCents: 5000 },
    ]);
    const result = await createAppointment({}, form());
    expect(result.payment).toMatchObject({ status: "recorded", transactionId: "matching", amountCents: 5000 });
    expect(result.success).toContain("Deposit recorded — $50 by E-Transfer");
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("does not erase committed truth if the later change log throws", async () => {
    mocks.record.mockResolvedValue({ ok: true, transaction });
    mocks.log.mockRejectedValue(new Error("Synthetic log failure"));
    const result = await createAppointment({}, form());
    expect(result.payment).toMatchObject({ status: "failed", transactionId: "tx-committed", amountCents: 4000, canRetry: false });
    expect(result.success).not.toMatch(/retry|could not be recorded/i);
    expect(mocks.notify).toHaveBeenCalledOnce();
  });
  it("refuses a payment booking when authoritative Business currency is unavailable", async () => {
    mocks.currency = undefined;
    const result = await createAppointment({}, form());
    expect(result.error).toContain("Business currency is unavailable");
    expect(mocks.record).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("retains committed transaction identity when calendar revalidation throws", async () => {
    mocks.record.mockResolvedValue({ ok: true, transaction });
    mocks.revalidate.mockImplementation(() => { throw new Error("Synthetic refresh failure"); });
    const result = await createAppointment({}, form());
    expect(result.payment).toMatchObject({ transactionId: "tx-committed", status: "failed", canRetry: false });
    expect(result.success).toContain("payment recorded");
  });

});

it("preserves weak dedupe session-key matching without suppressing a different key", async () => {
  vi.resetAllMocks();
  mocks.currency = "cad";
  mocks.create.mockResolvedValue({ phase: "success", data: { appointmentId: "appt" } });
  mocks.transactions.mockResolvedValue([{ ...transaction, id: "different-session-tx", amountCents: 5000, description: "booking:another-session" }]);
  mocks.record.mockResolvedValue({ ok: true, transaction });
  mocks.notify.mockResolvedValue({ items: [] });
  mocks.log.mockResolvedValue(undefined);
  const result = await createAppointment({}, form());
  expect(mocks.record).toHaveBeenCalledOnce();
  expect(result.payment?.transactionId).toBe("tx-committed");
});
