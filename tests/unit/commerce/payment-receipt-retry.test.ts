import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.fn();
const listTransactions = vi.fn();
const writeCommerceAudit = vi.fn();

vi.mock("@/lib/communications/delivery", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

vi.mock("@/lib/commerce/payments", () => ({
  listTransactions: (...args: unknown[]) => listTransactions(...args),
}));

vi.mock("@/lib/commerce/audit", () => ({
  writeCommerceAudit: (...args: unknown[]) => writeCommerceAudit(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  retryPaymentReceiptForAppointment,
  sendPaymentReceiptNow,
} from "@/lib/commerce/receipts";

type ReceiptRow = {
  id: string;
  business_id: string;
  customer_id: string;
  transaction_id: string;
  amount_cents: number;
  method: string;
  receipt_number: string;
  email_status: string;
  currency?: string;
  body_text?: string;
  issued_at?: string;
  invoice_id?: string | null;
};

function chainable(result: { data: unknown; error: null }) {
  const self: Record<string, unknown> = {};
  const terminal = async () => result;
  self.select = () => self;
  self.insert = () => self;
  self.update = () => self;
  self.eq = () => self;
  self.in = () => self;
  self.neq = () => self;
  self.order = () => self;
  self.limit = () => self;
  self.single = terminal;
  self.maybeSingle = terminal;
  return self;
}

function mockClient(handlers: Record<string, () => unknown>) {
  vi.mocked(createClient).mockResolvedValue({
    from: (table: string) => {
      const handler = handlers[table];
      if (!handler) return chainable({ data: null, error: null });
      return handler();
    },
  } as never);
}

describe("sendPaymentReceiptNow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({ ok: true, messageId: "msg-1" });
  });

  it("does not resend when email_status is already sent", async () => {
    const receipt: ReceiptRow = {
      id: "r1",
      business_id: "biz",
      customer_id: "cust",
      transaction_id: "tx1",
      amount_cents: 5000,
      method: "e_transfer",
      receipt_number: "RCT-1",
      email_status: "sent",
    };
    mockClient({
      commerce_receipts: () => chainable({ data: receipt, error: null }),
    });

    const result = await sendPaymentReceiptNow({
      businessId: "biz",
      receiptId: "r1",
    });
    expect(result).toMatchObject({ ok: true, skipped: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("invokes only the commerce.receipt template", async () => {
    const receipt: ReceiptRow = {
      id: "r1",
      business_id: "biz",
      customer_id: "cust",
      transaction_id: "tx1",
      amount_cents: 5000,
      method: "e_transfer",
      receipt_number: "RCT-1",
      email_status: "failed",
    };
    let status = "failed";
    mockClient({
      commerce_receipts: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { ...receipt, email_status: status },
                error: null,
              }),
            }),
            maybeSingle: async () => ({
              data: { ...receipt, email_status: status },
              error: null,
            }),
          }),
        }),
        update: (payload: { email_status?: string }) => {
          if (payload.email_status) status = payload.email_status;
          const self = {
            eq: () => self,
            in: () => self,
            neq: () => self,
            select: () => ({
              maybeSingle: async () => ({
                data: { ...receipt, email_status: status },
                error: null,
              }),
            }),
          };
          return self;
        },
      }),
      customers: () =>
        chainable({
          data: { id: "cust", name: "Ana", email: "ana@example.com" },
          error: null,
        }),
      businesses: () =>
        chainable({
          data: { name: "GVM Baby World Ultrasound" },
          error: null,
        }),
    });

    const result = await sendPaymentReceiptNow({
      businessId: "biz",
      receiptId: "r1",
      appointmentId: "appt-1",
      serviceName: "Elite Package",
    });

    expect(result.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0]?.[0]).toMatchObject({
      templateKey: "commerce.receipt",
      appointmentId: "appt-1",
      to: "ana@example.com",
    });
  });

  it("allows a second attempt after a failed send", async () => {
    const receipt: ReceiptRow = {
      id: "r1",
      business_id: "biz",
      customer_id: "cust",
      transaction_id: "tx1",
      amount_cents: 5000,
      method: "e_transfer",
      receipt_number: "RCT-1",
      email_status: "failed",
    };
    let status = "failed";
    mockClient({
      commerce_receipts: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { ...receipt, email_status: status },
                error: null,
              }),
            }),
            maybeSingle: async () => ({
              data: { ...receipt, email_status: status },
              error: null,
            }),
          }),
        }),
        update: (payload: { email_status?: string }) => {
          if (payload.email_status) status = payload.email_status;
          const self = {
            eq: () => self,
            in: () => self,
            neq: () => self,
            select: () => ({
              maybeSingle: async () => ({
                data: { ...receipt, email_status: status },
                error: null,
              }),
            }),
          };
          return self;
        },
      }),
      customers: () =>
        chainable({
          data: { id: "cust", name: "Ana", email: "ana@example.com" },
          error: null,
        }),
      businesses: () =>
        chainable({ data: { name: "GVM" }, error: null }),
    });

    sendEmail.mockResolvedValueOnce({ ok: false, error: "down" });
    expect(
      (
        await sendPaymentReceiptNow({ businessId: "biz", receiptId: "r1" })
      ).ok,
    ).toBe(false);

    sendEmail.mockResolvedValueOnce({ ok: true, messageId: "m2" });
    expect(
      (
        await sendPaymentReceiptNow({ businessId: "biz", receiptId: "r1" })
      ).ok,
    ).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});

describe("retryPaymentReceiptForAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({ ok: true, messageId: "msg-1" });
  });

  it("returns not_applicable when no successful transaction exists", async () => {
    listTransactions.mockResolvedValue([]);
    mockClient({
      appointments: () =>
        chainable({
          data: {
            id: "appt-1",
            customer_id: "cust",
            start_time: "2026-08-03T15:00:00.000Z",
            price_cents: 20885,
            tax_cents: 2715,
            amount_paid_cents: 0,
            amount_refunded_cents: 0,
            services: { name: "Elite Package" },
            customers: { id: "cust", email: "ana@example.com", name: "Ana" },
          },
          error: null,
        }),
    });

    const result = await retryPaymentReceiptForAppointment({
      businessId: "biz",
      appointmentId: "appt-1",
    });
    expect(result.status).toBe("not_applicable");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns no_recipient when customer email is missing", async () => {
    listTransactions.mockResolvedValue([
      {
        id: "tx-1",
        businessId: "biz",
        customerId: "cust",
        appointmentId: "appt-1",
        invoiceId: null,
        kind: "deposit",
        status: "succeeded",
        method: "e_transfer",
        amountCents: 5000,
        currency: "CAD",
        provider: "manual",
        providerReference: null,
        providerPaymentIntentId: null,
        description: null,
        occurredAt: "2026-08-03T20:00:00.000Z",
        createdAt: "2026-08-03T20:00:00.000Z",
      },
    ]);
    mockClient({
      appointments: () =>
        chainable({
          data: {
            id: "appt-1",
            customer_id: "cust",
            start_time: "2026-08-03T15:00:00.000Z",
            price_cents: 20885,
            tax_cents: 2715,
            amount_paid_cents: 5000,
            amount_refunded_cents: 0,
            services: { name: "Elite Package" },
            customers: { id: "cust", email: null, name: "Ana" },
          },
          error: null,
        }),
    });

    const result = await retryPaymentReceiptForAppointment({
      businessId: "biz",
      appointmentId: "appt-1",
    });
    expect(result.status).toBe("no_recipient");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends receipt only — does not create appointments or payments", async () => {
    listTransactions.mockResolvedValue([
      {
        id: "tx-1",
        businessId: "biz",
        customerId: "cust",
        appointmentId: "appt-1",
        invoiceId: null,
        kind: "deposit",
        status: "succeeded",
        method: "e_transfer",
        amountCents: 5000,
        currency: "CAD",
        provider: "manual",
        providerReference: null,
        providerPaymentIntentId: null,
        description: "booking:idem",
        occurredAt: "2026-08-03T20:00:00.000Z",
        createdAt: "2026-08-03T20:00:00.000Z",
      },
    ]);

    const existingReceipt: ReceiptRow = {
      id: "r1",
      business_id: "biz",
      customer_id: "cust",
      transaction_id: "tx-1",
      amount_cents: 5000,
      method: "e_transfer",
      receipt_number: "RCT-1",
      email_status: "failed",
      currency: "CAD",
      body_text: "body",
      issued_at: "2026-08-03T20:00:00.000Z",
      invoice_id: null,
    };
    let status = "failed";

    mockClient({
      appointments: () =>
        chainable({
          data: {
            id: "appt-1",
            customer_id: "cust",
            start_time: "2026-08-03T15:00:00.000Z",
            price_cents: 20885,
            tax_cents: 2715,
            amount_paid_cents: 5000,
            amount_refunded_cents: 0,
            payment_status: "deposit_paid",
            services: { name: "Elite Package" },
            customers: { id: "cust", email: "ana@example.com", name: "Ana" },
          },
          error: null,
        }),
      commerce_receipts: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { ...existingReceipt, email_status: status },
              error: null,
            }),
            eq: () => ({
              maybeSingle: async () => ({
                data: { ...existingReceipt, email_status: status },
                error: null,
              }),
            }),
          }),
        }),
        update: (payload: { email_status?: string }) => {
          if (payload.email_status) status = payload.email_status;
          const self = {
            eq: () => self,
            in: () => self,
            neq: () => self,
            select: () => ({
              maybeSingle: async () => ({
                data: { ...existingReceipt, email_status: status },
                error: null,
              }),
            }),
          };
          return self;
        },
      }),
      customers: () =>
        chainable({
          data: { id: "cust", name: "Ana", email: "ana@example.com" },
          error: null,
        }),
      businesses: () =>
        chainable({
          data: { name: "GVM Baby World Ultrasound" },
          error: null,
        }),
    });

    const result = await retryPaymentReceiptForAppointment({
      businessId: "biz",
      appointmentId: "appt-1",
    });

    expect(result.status).toBe("sent");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0]?.[0]?.templateKey).toBe("commerce.receipt");
    // listTransactions is the payment lookup — never recordCommercePayment
    expect(listTransactions).toHaveBeenCalledWith({
      businessId: "biz",
      appointmentId: "appt-1",
      limit: 40,
    });
  });
});
