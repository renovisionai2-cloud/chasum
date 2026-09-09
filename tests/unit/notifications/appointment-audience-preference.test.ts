// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const payloads: Record<string, unknown>[] = [];
let ownerNotificationsEnabled = true;
let staffNotificationsEnabled = true;

vi.mock("@/lib/integrations/jobs/queue", () => ({
  enqueueEmailJob: async (_biz: string, payload: Record<string, unknown>) => {
    payloads.push(payload);
    return "job";
  },
  enqueueSmsJob: vi.fn(),
  enqueueWebhookJob: vi.fn(),
  enqueueReminderJobs: vi.fn(),
  enqueueCalendarSyncJob: vi.fn(),
}));

vi.mock("@/lib/integrations/calendar/sync", () => ({
  pushAppointmentToCalendars: vi.fn(),
  deleteAppointmentFromCalendars: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  getResendApiKey: () => "local-stub",
  getTwilioConfig: () => null,
}));
vi.mock("@/lib/observability/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));

import { createServiceClient } from "@/lib/supabase/service";
import { handleAppointmentEvent } from "@/lib/integrations/notifications/orchestrator";

beforeEach(() => {
  vi.clearAllMocks();
  payloads.length = 0;
  ownerNotificationsEnabled = true;
  staffNotificationsEnabled = true;
  vi.mocked(createServiceClient).mockReturnValue({
    from: (table: string) => {
      const related: Record<string, Record<string, unknown>> = {
        locations: { id: "location-a", name: "Fixture Location" },
        customers: {
          id: "customer-a",
          name: "Fixture Customer",
          email: "customer@example.invalid",
          phone: "+15555550100",
        },
        staff: {
          id: "staff-a",
          name: "Fixture Staff",
          email: "staff@example.invalid",
        },
        services: { id: "service-a", name: "Fixture Service" },
      };
      const result = async () => {
        if (table === "appointments") {
          return {
            data: {
              id: "appointment-a",
              business_id: "business-a",
              status: "confirmed",
              location_id: "location-a",
              customer_id: "customer-a",
              staff_id: "staff-a",
              service_id: "service-a",
              start_time: "2026-08-01T10:00:00Z",
              end_time: "2026-08-01T10:30:00Z",
            },
            error: null,
          };
        }
        if (related[table]) return { data: related[table], error: null };
        if (table === "businesses") {
          return {
            data: {
              name: "Fixture Business",
              email: "owner@example.invalid",
              notification_email: "override@example.invalid",
              email_notifications_enabled: true,
              sms_notifications_enabled: false,
              owner_notifications_enabled: ownerNotificationsEnabled,
              staff_notifications_enabled: staffNotificationsEnabled,
              private_alpha_enabled: true,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      };
      const query = {
        select: () => query,
        eq: () => query,
        insert: () => query,
        single: result,
        maybeSingle: result,
      };
      return query;
    },
  } as never);
});

describe("appointment audience preference enqueue", () => {
  it("does not let customer preferred=sms suppress business or staff email jobs", async () => {
    await handleAppointmentEvent("appointment-a", "created", {
      businessId: "business-a",
    });
    const byTemplate = Object.fromEntries(
      payloads.map((p) => [String(p.templateKey), p]),
    );
    expect(byTemplate["appointment.confirmation"]?.skipPreferenceCheck).toBeFalsy();
    expect(byTemplate["appointment.staff"]?.skipPreferenceCheck).toBe(true);
    expect(byTemplate["appointment.business"]?.skipPreferenceCheck).toBe(true);
    expect(byTemplate["appointment.staff"]?.recipient).toBe("staff@example.invalid");
    expect(byTemplate["appointment.business"]?.recipient).toBe(
      "override@example.invalid",
    );
  });

  it("does not enqueue business or staff email when those notification settings are disabled", async () => {
    ownerNotificationsEnabled = false;
    staffNotificationsEnabled = false;
    await handleAppointmentEvent("appointment-a", "created", {
      businessId: "business-a",
    });
    const templates = payloads.map((p) => String(p.templateKey));
    expect(templates).toContain("appointment.confirmation");
    expect(templates).not.toContain("appointment.business");
    expect(templates).not.toContain("appointment.staff");
    expect(
      payloads.find((p) => p.templateKey === "appointment.confirmation")
        ?.skipPreferenceCheck,
    ).toBeFalsy();
  });
});
