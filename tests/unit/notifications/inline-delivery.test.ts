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

import { sendEmail, sendSMS } from "@/lib/communications/delivery";
import { createServiceClient } from "@/lib/supabase/service";
import { deliverBookingNotifications } from "@/lib/notifications/booking-delivery";

function mockAppointmentClient() {
  const appointment = {
    id: "appt-1",
    business_id: "biz-1",
    customer_id: "cust-1",
    start_time: "2026-08-07T15:05:00.000Z",
    end_time: "2026-08-07T15:40:00.000Z",
    status: "confirmed",
    notes: null,
    price_cents: 23600,
    tax_cents: 2715,
    deposit_cents: 5000,
    business: {
      name: "GVM Baby World Ultrasound",
      email: "owner@example.com",
      notification_email: null,
      email_notifications_enabled: true,
      sms_notifications_enabled: false,
      owner_notifications_enabled: true,
      staff_notifications_enabled: true,
      subscription_plan_key: "starter",
      private_alpha_enabled: false,
    },
    service: { name: "Elite Package" },
    staff: { name: "Bobita Singh", email: null },
    customer: {
      id: "cust-1",
      name: "Darshan Dindial",
      email: "dardin.gvm@gmail.com",
      phone: "6472222241",
    },
  };

  const from = vi.fn((table: string) => {
    if (table === "appointments") {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: appointment, error: null }),
          }),
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
        }),
      }),
    };
  });

  vi.mocked(createServiceClient).mockReturnValue({ from } as never);
}

describe("deliverBookingNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppointmentClient();
  });

  it("returns Sent for customer and business email when Resend accepts", async () => {
    vi.mocked(sendEmail)
      .mockResolvedValueOnce({
        ok: true,
        messageId: "re_customer_1",
        provider: "resend",
      })
      .mockResolvedValueOnce({
        ok: true,
        messageId: "re_business_1",
        provider: "resend",
      });
    vi.mocked(sendSMS).mockResolvedValue({ ok: false, skipped: true });

    const report = await deliverBookingNotifications("appt-1");
    const byChannel = Object.fromEntries(
      report.items.map((i) => [i.channel, i]),
    );

    expect(byChannel.customer_email.status).toBe("sent");
    expect(byChannel.customer_email.providerMessageId).toBe("re_customer_1");
    expect(byChannel.business_email.status).toBe("sent");
    expect(byChannel.business_email.providerMessageId).toBe("re_business_1");
    expect(byChannel.customer_sms.status).toBe("not_included");
    expect(byChannel.staff_email.status).toBe("no_recipient");
    expect(report.items.every((i) => i.status !== "pending")).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("returns Failed with retry when provider rejects", async () => {
    vi.mocked(sendEmail).mockResolvedValue({
      ok: false,
      error: "Domain not verified",
      provider: "resend",
    });

    const report = await deliverBookingNotifications("appt-1");
    const customer = report.items.find((i) => i.channel === "customer_email");
    expect(customer?.status).toBe("failed");
    expect(customer?.canRetry).toBe(true);
    expect(customer?.detail).toMatch(/Domain not verified/);
    expect(report.items.every((i) => i.status !== "pending")).toBe(true);
  });
});
