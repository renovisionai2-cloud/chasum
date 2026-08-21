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
  buildReceiptEmailContext,
  retryPaymentReceiptForAppointment,
  sendPaymentReceiptNow,
} from "@/lib/commerce/receipts";
import { renderEmailTemplate } from "@/lib/communications/templates";
import {
  resolveTenantEmailBranding,
  toBrandingContext,
} from "@/lib/communications/tenant-email-branding";
import { resolveBookingFinancials } from "@/lib/commerce/booking-financials";

type ReceiptRow = {
  id: string;
  business_id: string;
  customer_id: string;
  transaction_id: string;
  amount_cents: number;
  method: string;
  receipt_number: string;
  email_status: string;
};

const txA = {
  id: "tx-a",
  business_id: "biz",
  customer_id: "cust",
  appointment_id: "appt-220",
  invoice_id: null,
  kind: "deposit",
  status: "succeeded",
  method: "e_transfer",
  amount_cents: 5000,
  currency: "CAD",
  provider: "manual",
  provider_reference: null,
  provider_payment_intent_id: null,
  description: "booking:idem-a",
  occurred_at: "2026-08-04T20:00:00.000Z",
  created_at: "2026-08-04T20:00:00.000Z",
};

const txB = {
  ...txA,
  id: "tx-b",
  appointment_id: "appt-700",
  description: "booking:idem-b",
  amount_cents: 5000,
};

const appt220 = {
  id: "appt-220",
  start_time: "2026-08-05T15:00:00.000Z",
  price_cents: 22000,
  tax_cents: 2860,
  deposit_cents: 5000,
  amount_paid_cents: 5000,
  amount_refunded_cents: 0,
  payment_status: "deposit_paid",
  services: { name: "Gestational Age / Early Ultrasound" },
};

const appt700 = {
  id: "appt-700",
  start_time: "2026-08-01T15:00:00.000Z",
  price_cents: 70000,
  tax_cents: 9100,
  deposit_cents: 5000,
  amount_paid_cents: 5000,
  amount_refunded_cents: 0,
  payment_status: "deposit_paid",
  services: { name: "Early Gender (10–15 weeks)" },
};

function receiptFor(txId: string, status = "failed"): ReceiptRow {
  return {
    id: `r-${txId}`,
    business_id: "biz",
    customer_id: "cust",
    transaction_id: txId,
    amount_cents: 5000,
    method: "e_transfer",
    receipt_number: `RCT-${txId}`,
    email_status: status,
  };
}

function mockBoundReceiptClient(opts: {
  receipt: ReceiptRow;
  tx: typeof txA;
  appt: typeof appt220;
  emailStatus?: { current: string };
}) {
  const statusRef = opts.emailStatus ?? { current: opts.receipt.email_status };
  vi.mocked(createClient).mockResolvedValue({
    from: (table: string) => {
      if (table === "commerce_receipts") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { ...opts.receipt, email_status: statusRef.current },
                  error: null,
                }),
              }),
              maybeSingle: async () => ({
                data: { email_status: statusRef.current },
                error: null,
              }),
            }),
          }),
          update: (payload: { email_status?: string }) => {
            if (payload.email_status) statusRef.current = payload.email_status;
            const self = {
              eq: () => self,
              in: () => self,
              select: () => ({
                maybeSingle: async () => ({
                  data: { ...opts.receipt, email_status: statusRef.current },
                  error: null,
                }),
              }),
            };
            return self;
          },
        };
      }
      if (table === "commerce_transactions") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opts.tx, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "appointments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opts.appt, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "customers") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "cust", name: "Ana", email: "ana@example.com" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { name: "GVM Baby World Ultrasound" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "tax_rates") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                then: undefined,
              }),
              // awaitable thenable chain ending in data
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: async () => ({ data: [], error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  } as never);

  // tax_rates uses await on the builder — make the whole chain thenable
  vi.mocked(createClient).mockResolvedValue({
    from: (table: string) => {
      if (table === "commerce_receipts") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { ...opts.receipt, email_status: statusRef.current },
                  error: null,
                }),
              }),
              maybeSingle: async () => ({
                data: { email_status: statusRef.current },
                error: null,
              }),
            }),
          }),
          update: (payload: { email_status?: string }) => {
            if (payload.email_status) statusRef.current = payload.email_status;
            const self = {
              eq: () => self,
              in: () => self,
              select: () => ({
                maybeSingle: async () => ({
                  data: { ...opts.receipt, email_status: statusRef.current },
                  error: null,
                }),
              }),
            };
            return self;
          },
        };
      }
      if (table === "commerce_transactions") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opts.tx, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "appointments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opts.appt, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "customers") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "cust", name: "Ana", email: "ana@example.com" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { name: "GVM Baby World Ultrasound" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "tax_rates") {
        const result = {
          data: [
            {
              name: "HST",
              rate_bps: 1300,
              is_default: true,
              is_active: true,
            },
          ],
          error: null,
        };
        const chain: Record<string, unknown> = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.then = (resolve: (v: unknown) => unknown) =>
          Promise.resolve(result).then(resolve);
        return chain;
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  } as never);
}

describe("buildReceiptEmailContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Transaction A cannot load appointment financials from Transaction B", async () => {
    mockBoundReceiptClient({
      receipt: receiptFor("tx-a"),
      tx: txA,
      appt: appt220,
    });
    const a = await buildReceiptEmailContext({
      businessId: "biz",
      receiptId: "r-tx-a",
    });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(a.context.serviceName).toBe("Gestational Age / Early Ultrasound");
    expect(a.context.subtotalCents).toBe(22000);
    expect(a.context.appointmentTotalCents).toBe(24860);
    expect(a.context.subtotalCents).not.toBe(70000);

    mockBoundReceiptClient({
      receipt: receiptFor("tx-b"),
      tx: txB,
      appt: appt700,
    });
    const b = await buildReceiptEmailContext({
      businessId: "biz",
      receiptId: "r-tx-b",
    });
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    expect(b.context.serviceName).toBe("Early Gender (10–15 weeks)");
    expect(b.context.subtotalCents).toBe(70000);
    expect(a.context.appointmentId).not.toBe(b.context.appointmentId);
  });

  it("rejects expectedAppointmentId that does not match the transaction", async () => {
    mockBoundReceiptClient({
      receipt: receiptFor("tx-a"),
      tx: txA,
      appt: appt220,
    });
    const result = await buildReceiptEmailContext({
      businessId: "biz",
      receiptId: "r-tx-a",
      expectedAppointmentId: "appt-700",
    });
    expect(result.ok).toBe(false);
  });
});

describe("$220 exclusive HST financials", () => {
  it("$220 + 13% = $248.60 and $50 paid leaves $198.60", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 22000,
      taxRates: [
        {
          id: "hst",
          name: "HST",
          rate_bps: 1300,
          inclusive: false,
          is_default: true,
          is_active: true,
        },
      ],
      depositRequiredCents: 5000,
      paymentTodayCents: 5000,
    });
    expect(f.subtotalCents).toBe(22000);
    expect(f.taxCents).toBe(2860);
    expect(f.appointmentTotalCents).toBe(24860);
    expect(f.depositRequiredCents).toBe(5000);
    expect(f.remainingBalanceCents).toBe(19860);
  });
});

describe("sendPaymentReceiptNow transaction binding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({ ok: true, messageId: "msg-1" });
  });

  it("does not resend when email_status is already sent", async () => {
    mockBoundReceiptClient({
      receipt: receiptFor("tx-a", "sent"),
      tx: txA,
      appt: appt220,
    });
    const result = await sendPaymentReceiptNow({
      businessId: "biz",
      receiptId: "r-tx-a",
    });
    expect(result).toMatchObject({ ok: true, skipped: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends commerce.receipt with linked appointment service and totals", async () => {
    const status = { current: "failed" };
    mockBoundReceiptClient({
      receipt: receiptFor("tx-a", "failed"),
      tx: txA,
      appt: appt220,
      emailStatus: status,
    });

    const result = await sendPaymentReceiptNow({
      businessId: "biz",
      receiptId: "r-tx-a",
      appointmentId: "appt-220",
      // Stale caller overrides must be ignored:
      serviceName: "WRONG PACKAGE",
      appointmentTotalCents: 70000,
      paidToDateCents: 5000,
      remainingBalanceCents: 65000,
    });

    expect(result.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const payload = sendEmail.mock.calls[0]?.[0] as {
      templateKey: string;
      context: Record<string, unknown>;
      appointmentId: string;
    };
    expect(payload.templateKey).toBe("commerce.receipt");
    expect(payload.appointmentId).toBe("appt-220");
    expect(payload.context.serviceName).toBe(
      "Gestational Age / Early Ultrasound",
    );
    expect(payload.context.subtotalCents).toBe(22000);
    expect(payload.context.taxCents).toBe(2860);
    expect(payload.context.appointmentTotalCents).toBe(24860);
    expect(payload.context.depositPaidCents).toBe(5000);
    expect(payload.context.remainingBalanceCents).toBe(19860);
    expect(payload.context.amountCents).toBe(5000);
    expect(payload.context.receiptNumber).toBe("RCT-tx-a");
  });
});

describe("retryPaymentReceiptForAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({ ok: true, messageId: "msg-1" });
  });

  it("retries only the appointment-scoped transaction and does not create payments", async () => {
    listTransactions.mockResolvedValue([
      {
        id: "tx-a",
        businessId: "biz",
        customerId: "cust",
        appointmentId: "appt-220",
        invoiceId: null,
        kind: "deposit",
        status: "succeeded",
        method: "e_transfer",
        amountCents: 5000,
        currency: "CAD",
        provider: "manual",
        providerReference: null,
        providerPaymentIntentId: null,
        description: "booking:idem-a",
        occurredAt: "2026-08-04T20:00:00.000Z",
        createdAt: "2026-08-04T20:00:00.000Z",
      },
    ]);

    const status = { current: "failed" };
    const existing = receiptFor("tx-a", "failed");
    mockBoundReceiptClient({
      receipt: existing,
      tx: txA,
      appt: appt220,
      emailStatus: status,
    });

    // retry also queries appointments for customer email first
    vi.mocked(createClient).mockResolvedValue({
      from: (table: string) => {
        if (table === "appointments") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "appt-220",
                      customers: {
                        id: "cust",
                        email: "ana@example.com",
                        name: "Ana",
                      },
                      ...appt220,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "commerce_receipts") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { ...existing, email_status: status.current },
                    error: null,
                  }),
                }),
                maybeSingle: async () => ({
                  data: { ...existing, email_status: status.current },
                  error: null,
                }),
              }),
            }),
            update: (payload: { email_status?: string }) => {
              if (payload.email_status) status.current = payload.email_status;
              const self = {
                eq: () => self,
                in: () => self,
                select: () => ({
                  maybeSingle: async () => ({
                    data: { ...existing, email_status: status.current },
                    error: null,
                  }),
                }),
              };
              return self;
            },
            insert: () => ({
              select: () => ({
                single: async () => ({ data: existing, error: null }),
              }),
            }),
          };
        }
        if (table === "commerce_transactions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: txA, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "customers") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: "cust", name: "Ana", email: "ana@example.com" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "businesses") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { name: "GVM Baby World Ultrasound" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "tax_rates") {
          const result = {
            data: [
              {
                name: "HST",
                rate_bps: 1300,
                is_default: true,
                is_active: true,
              },
            ],
            error: null,
          };
          const chain: Record<string, unknown> = {};
          chain.select = () => chain;
          chain.eq = () => chain;
          chain.then = (resolve: (v: unknown) => unknown) =>
            Promise.resolve(result).then(resolve);
          return chain;
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      },
    } as never);

    const result = await retryPaymentReceiptForAppointment({
      businessId: "biz",
      appointmentId: "appt-220",
    });

    expect(result.status).toBe("sent");
    expect(result.transactionId).toBe("tx-a");
    expect(result.receiptId).toBe("r-tx-a");
    expect(listTransactions).toHaveBeenCalledWith({
      businessId: "biz",
      appointmentId: "appt-220",
      limit: 40,
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const ctx = (sendEmail.mock.calls[0]?.[0] as { context: Record<string, unknown> })
      .context;
    expect(ctx.subtotalCents).toBe(22000);
    expect(ctx.appointmentTotalCents).toBe(24860);
  });
});

describe("receipt branding and audience footers", () => {
  const receiptCtx = {
    businessId: "biz",
    businessName: "GVM Baby World Ultrasound",
    customerName: "Ana",
    staffName: "Team",
    serviceName: "Gestational Age / Early Ultrasound",
    startTime: "2026-08-05T15:00:00.000Z",
    amountCents: 5000,
    subtotalCents: 22000,
    taxCents: 2860,
    taxRateBps: 1300,
    taxLabel: "HST",
    appointmentTotalCents: 24860,
    depositPaidCents: 5000,
    remainingBalanceCents: 19860,
    paymentMethodLabel: "E-Transfer",
    receiptNumber: "RCT-220",
  };

  it("Private Alpha customer receipt has no Chasum footer and includes mailto", () => {
    const branding = toBrandingContext(
      resolveTenantEmailBranding(
        {
          name: "GVM Baby World Ultrasound",
          email: "gvmbabyworld@gmail.com",
          notification_email: null,
          subscription_plan_key: "starter",
          private_alpha_enabled: true,
          brand_color: "#e91e8c",
        },
        "customer",
      ),
    );
    const rendered = renderEmailTemplate("commerce.receipt", {
      ...receiptCtx,
      branding,
    });
    expect(rendered.html).toContain("$220.00");
    expect(rendered.html).toContain("$28.60");
    expect(rendered.html).toContain("$248.60");
    expect(rendered.html).toContain("$50.00");
    expect(rendered.html).toContain("$198.60");
    expect(rendered.html).toContain("Gestational Age / Early Ultrasound");
    expect(rendered.html).toContain("mailto:gvmbabyworld@gmail.com?subject=");
    expect(rendered.html).toContain("Email GVM Baby World Ultrasound");
    expect(rendered.html).not.toMatch(/Powered by Chasum/i);
    expect(rendered.html).not.toMatch(/Sent via Chasum/i);
    expect(rendered.text).toContain("gvmbabyworld@gmail.com");
  });

  it("Free-plan customer receipt still shows Powered by Chasum", () => {
    const branding = toBrandingContext(
      resolveTenantEmailBranding(
        {
          name: "Free Studio",
          email: "free@example.com",
          subscription_plan_key: "free",
          private_alpha_enabled: false,
        },
        "customer",
      ),
    );
    const rendered = renderEmailTemplate("commerce.receipt", {
      ...receiptCtx,
      businessName: "Free Studio",
      branding,
    });
    expect(rendered.html).toMatch(/Powered by Chasum/i);
  });

  it("internal business email may still show Sent via Chasum", () => {
    const branding = toBrandingContext(
      resolveTenantEmailBranding(
        {
          name: "GVM Baby World Ultrasound",
          email: "gvmbabyworld@gmail.com",
          subscription_plan_key: "starter",
          private_alpha_enabled: true,
        },
        "business",
      ),
    );
    const rendered = renderEmailTemplate("appointment.business", {
      ...receiptCtx,
      branding,
    });
    expect(rendered.html).toMatch(/Sent via Chasum/i);
    expect(rendered.html).not.toMatch(/Powered by Chasum/i);
  });
});
