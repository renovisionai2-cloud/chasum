import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/communications/delivery", () => ({
  sendEmail: vi.fn(),
  sendSMS: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getResendApiKey: vi.fn(() => "re_test"),
  getEmailFromAddress: vi.fn(() => "Chasum <notifications@chasumai.com>"),
  getTwilioConfig: vi.fn(() => null),
}));

vi.mock("@/lib/integrations/jobs/queue", () => ({
  enqueueEmailJob: vi.fn(),
  enqueueSmsJob: vi.fn(),
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { sendEmail } from "@/lib/communications/delivery";
import { createServiceClient } from "@/lib/supabase/service";
import { retryBookingNotification } from "@/lib/notifications/booking-delivery";

describe("retryBookingNotification business email deposit status", () => {
  const inserts: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    inserts.length = 0;

    const appointment = {
      id: "appt-1",
      business_id: "biz-1",
      customer_id: "cust-1",
      start_time: "2026-08-05T00:40:00.000Z",
      end_time: "2026-08-05T01:00:00.000Z",
      status: "confirmed",
      notes: null,
      price_cents: 22000,
      tax_cents: 2860,
      deposit_cents: 5000,
      amount_paid_cents: 5000,
      amount_refunded_cents: 0,
      payment_status: "deposit_paid",
      business: {
        name: "GVM Baby World Ultrasound",
        email: "gvmbabyworld@gmail.com",
        notification_email: null,
        timezone: "America/Toronto",
        email_notifications_enabled: true,
        sms_notifications_enabled: false,
        owner_notifications_enabled: true,
        staff_notifications_enabled: true,
        subscription_plan_key: "starter",
        private_alpha_enabled: true,
      },
      service: { name: "Gestational Age / Early Ultrasound" },
      staff: { name: "Bobita", email: "staff@example.com" },
      customer: {
        id: "cust-1",
        name: "Darshan Dindial",
        email: "customer@example.com",
        phone: "6472222241",
      },
      location: { name: "Main", timezone: "America/Toronto" },
    };

    const from = vi.fn((table: string) => {
      if (
        table === "appointments" ||
        table === "commerce_transactions" ||
        table === "commerce_receipts" ||
        table === "commerce_invoices" ||
        table === "payments"
      ) {
        return {
          select: () => ({
            eq: () => ({
              single: async () =>
                table === "appointments"
                  ? { data: appointment, error: null }
                  : { data: null, error: null },
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
                order: () => ({
                  limit: async () => ({ data: [] }),
                }),
                single: async () =>
                  table === "appointments"
                    ? { data: appointment, error: null }
                    : { data: null, error: null },
              }),
            }),
          }),
          insert: (payload: unknown) => {
            inserts.push(table);
            void payload;
            return {
              select: async () => ({ data: null, error: null }),
            };
          },
          update: () => ({
            eq: async () => ({ error: null }),
            in: async () => ({ error: null }),
          }),
        };
      }
      if (table === "notification_logs") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: async () => ({ data: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
          insert: () => {
            inserts.push("notification_logs");
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "tax_rates") {
        return {
          select: () => ({
            eq: () => ({
              eq: async () => ({
                data: [
                  {
                    name: "HST",
                    rate_bps: 1300,
                    inclusive: false,
                    is_default: true,
                    is_active: true,
                  },
                ],
              }),
            }),
          }),
        };
      }
      if (table === "background_jobs") {
        return {
          select: () => ({
            in: () => ({
              in: () => ({
                order: () => ({
                  limit: async () => ({ data: [] }),
                }),
              }),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: [] }),
              }),
            }),
          }),
        }),
        insert: () => {
          inserts.push(table);
          return Promise.resolve({ error: null });
        },
      };
    });

    vi.mocked(createServiceClient).mockReturnValue({ from } as never);
    vi.mocked(sendEmail).mockResolvedValue({
      ok: true,
      messageId: "re_business_retry",
      provider: "resend",
    });
  });

  it("resent business notification uses shared depositDueNowCents ($0 when paid)", async () => {
    const report = await retryBookingNotification({
      appointmentId: "appt-1",
      channel: "business_email",
    });

    expect(report.items[0]?.status).toBe("sent");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const call = vi.mocked(sendEmail).mock.calls[0]?.[0];
    expect(call?.templateKey).toBe("appointment.business");
    expect(call?.context.depositRequiredCents).toBe(5000);
    expect(call?.context.depositPaidCents).toBe(5000);
    expect(call?.context.depositDueNowCents).toBe(0);
    expect(call?.context.paymentStatusLabel).toBe("Deposit paid");
    expect(call?.context.remainingBalanceCents).toBe(19860);
  });

  it("does not create appointment, payment, receipt, transaction, or invoice on resend", async () => {
    await retryBookingNotification({
      appointmentId: "appt-1",
      channel: "business_email",
    });

    expect(inserts).not.toContain("appointments");
    expect(inserts).not.toContain("commerce_transactions");
    expect(inserts).not.toContain("commerce_receipts");
    expect(inserts).not.toContain("commerce_invoices");
    expect(inserts).not.toContain("payments");
  });
});
