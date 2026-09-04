import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitStore } from "@/lib/security/rate-limit";
import type { AvailabilityContext } from "@/lib/booking-engine/types";
import { publicBookingPersistence } from "@/lib/booking-engine/adapters/public";
import { sessionBookingPersistence } from "@/lib/booking-engine/persistence";

const {
  getPublicBusinessBySlug,
  validateBooking,
  handleAppointmentEvent,
  enqueueWebhookJob,
  deliverBookingNotifications,
} = vi.hoisted(() => ({
  getPublicBusinessBySlug: vi.fn(),
  validateBooking: vi.fn(),
  handleAppointmentEvent: vi.fn(),
  enqueueWebhookJob: vi.fn(),
  deliverBookingNotifications: vi.fn(),
}));

let rpcResult: { data: string | null; error: { message: string } | null } = {
  data: "appt-orch-1",
  error: null,
};
let sessionInsertError: { message: string } | null = null;
const appointmentInserts: unknown[] = [];

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({
      "x-forwarded-for": "127.0.0.1",
    }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/booking/slug-alias-lookup", () => ({
  getPublicBusinessBySlug: (...args: unknown[]) =>
    getPublicBusinessBySlug(...args),
}));

vi.mock("@/lib/observability/logger", () => ({
  captureBookingFailure: vi.fn(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/booking-engine/availability", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/booking-engine/availability")>();
  return {
    ...actual,
    validateBooking: (...args: unknown[]) => validateBooking(...args),
  };
});

vi.mock("@/lib/booking-engine/conflicts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/booking-engine/conflicts")>();
  return {
    ...actual,
    findRoomConflicts: vi.fn().mockResolvedValue([]),
    logAppointmentChange: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/notifications/booking-delivery", () => ({
  deliverBookingNotifications: (...args: unknown[]) =>
    deliverBookingNotifications(...args),
}));

vi.mock("@/lib/integrations/jobs/queue", () => ({
  enqueueJob: vi.fn().mockResolvedValue("job-1"),
  enqueueEmailJob: vi.fn().mockResolvedValue("email-1"),
  enqueueSmsJob: vi.fn().mockResolvedValue("sms-1"),
  enqueueCalendarSyncJob: vi.fn().mockResolvedValue("cal-1"),
  enqueueReminderJobs: vi.fn().mockResolvedValue(undefined),
  enqueueWebhookJob: (...args: unknown[]) => enqueueWebhookJob(...args),
}));

vi.mock("@/lib/integrations/calendar/sync", () => ({
  pushAppointmentToCalendars: vi.fn().mockResolvedValue(undefined),
  deleteAppointmentFromCalendars: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/env", () => ({
  getResendApiKey: () => null,
  getTwilioConfig: () => null,
}));

vi.mock("@/lib/billing/plan-features", () => ({
  planIncludesSms: () => false,
}));

vi.mock("@/lib/integrations/notifications/orchestrator", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/integrations/notifications/orchestrator")
  >();
  handleAppointmentEvent.mockImplementation((...args: unknown[]) =>
    actual.handleAppointmentEvent(
      ...(args as Parameters<typeof actual.handleAppointmentEvent>),
    ),
  );
  return {
    ...actual,
    handleAppointmentEvent: (...args: unknown[]) =>
      handleAppointmentEvent(...args),
  };
});

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from(table: string) {
      const query: Record<string, unknown> = {};
      const self = () => query;
      query.select = self;
      query.eq = self;
      query.insert = () => Promise.resolve({ data: null, error: null });
      query.single = async () => {
        if (table === "appointments") {
          return {
            data: {
              id: rpcResult.data ?? "appt-session-1",
              business_id: "biz-gvm",
              staff_id: "staff-1",
              start_time: "2026-08-28T16:30:00.000Z",
              end_time: "2026-08-28T17:00:00.000Z",
              status: "confirmed",
              service: { name: "Ultrasound" },
              staff: { name: "Alex Rivera", email: null },
              customer: {
                name: "Test Customer",
                email: "guest@example.com",
                phone: null,
              },
            },
            error: null,
          };
        }
        if (table === "businesses") {
          return {
            data: {
              name: "Chasum Test Studio",
              email: "owner@example.com",
              notification_email: null,
              email_notifications_enabled: false,
              sms_notifications_enabled: false,
              owner_notifications_enabled: false,
              staff_notifications_enabled: false,
              reminder_hours_before: 24,
              subscription_plan_key: null,
              private_alpha_enabled: false,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      };
      query.then = (
        onFulfilled: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => {
        if (table === "calendar_connections") {
          return Promise.resolve({ data: [], error: null }).then(
            onFulfilled,
            onRejected,
          );
        }
        return Promise.resolve({ data: null, error: null }).then(
          onFulfilled,
          onRejected,
        );
      };
      return query;
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      if (name === "book_public_appointment") {
        void args;
        return rpcResult;
      }
      return { data: null, error: { message: `unexpected rpc ${name}` } };
    },
    from(table: string) {
      const query: Record<string, unknown> = {};
      const self = () => query;
      query.select = self;
      query.eq = self;
      query.maybeSingle = async () => {
        if (table === "services") {
          return {
            data: {
              duration_minutes: 30,
              name: "Ultrasound",
              price: 200,
              online_booking: true,
              deposit_cents: 0,
              deposit_required: false,
              tax_rate_bps: null,
            },
            error: null,
          };
        }
        if (table === "locations") {
          return { data: { name: "Main" }, error: null };
        }
        return { data: null, error: null };
      };
      query.single = async () => {
        if (table === "services") {
          return {
            data: {
              duration_minutes: 30,
              name: "Ultrasound",
              price: 200,
              online_booking: true,
              deposit_cents: 0,
              deposit_required: false,
              tax_rate_bps: null,
            },
            error: null,
          };
        }
        if (table === "staff") {
          return {
            data: { id: "staff-1", name: "Alex Rivera" },
            error: null,
          };
        }
        if (table === "appointments") {
          return {
            data: sessionInsertError ? null : { id: "appt-session-1" },
            error: sessionInsertError,
          };
        }
        return { data: null, error: { message: "not found" } };
      };
      query.insert = (row: unknown) => {
        if (table === "appointments") {
          appointmentInserts.push(row);
        }
        return {
          select: () => ({
            single: async () => ({
              data: sessionInsertError ? null : { id: "appt-session-1" },
              error: sessionInsertError,
            }),
          }),
        };
      };
      query.then = (
        onFulfilled: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => {
        if (table === "tax_rates") {
          return Promise.resolve({ data: [], error: null }).then(
            onFulfilled,
            onRejected,
          );
        }
        return Promise.resolve({ data: null, error: null }).then(
          onFulfilled,
          onRejected,
        );
      };
      return query;
    },
  }),
}));

import { bookAppointment } from "@/lib/actions/public-booking";
import { createBooking } from "@/lib/booking-engine/mutations/create";
import { registerCommunicationsBookingBridge } from "@/lib/communications/events/booking-bridge";

const context: AvailabilityContext = {
  businessId: "biz-gvm",
  locationId: "loc-1",
  serviceId: "svc-1",
  staffId: "staff-1",
  channel: "public",
  timezone: "America/Toronto",
  intervalMinutes: 10,
  durationMinutes: 30,
  cleanupMinutes: 0,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  minNoticeMinutes: null,
  maxBookingDaysAhead: null,
  maxAppointmentsPerDay: null,
  allowDoubleBooking: false,
  acceptOnlineBookings: true,
  bookingVisibility: "online",
  confirmationMode: "inherit",
  priorityScheduling: 0,
  serviceActive: true,
  staffActive: true,
  composedAt: "2026-08-28T12:00:00.000Z",
};

function bookingForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const values: Record<string, string> = {
    slug: "chasum-test-studio",
    location_id: "loc-1",
    service_id: "svc-1",
    staff_id: "staff-1",
    any_staff: "0",
    start_time: "2026-08-28T16:30:00.000Z",
    customer_name: "Test Customer",
    customer_email: "guest@example.com",
    customer_phone: "",
    notes: "",
    invite_code: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    fd.set(key, value);
  }
  return fd;
}

const business = {
  id: "biz-gvm",
  slug: "chasum-test-studio",
  public_booking_mode: "public" as const,
  booking_invite_code: null,
};

registerCommunicationsBookingBridge();

describe("public booking orchestration fires exactly once", () => {
  beforeEach(() => {
    resetRateLimitStore();
    rpcResult = { data: "appt-orch-1", error: null };
    sessionInsertError = null;
    appointmentInserts.length = 0;
    getPublicBusinessBySlug.mockReset();
    getPublicBusinessBySlug.mockResolvedValue(business);
    validateBooking.mockReset();
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-08-28T17:00:00.000Z",
    });
    handleAppointmentEvent.mockClear();
    enqueueWebhookJob.mockReset();
    enqueueWebhookJob.mockResolvedValue("wh-1");
    deliverBookingNotifications.mockReset();
    deliverBookingNotifications.mockResolvedValue({
      appointmentId: "appt-orch-1",
      items: [{ channel: "customer_email", status: "sent" }],
    });
  });

  it("T1 named-staff success: one handleAppointmentEvent(confirmed) and one appointment.created webhook", async () => {
    const result = await bookAppointment({}, bookingForm());

    expect(result.error).toBeUndefined();
    expect(result.appointmentId).toBe("appt-orch-1");
    expect(handleAppointmentEvent).toHaveBeenCalledTimes(1);
    expect(handleAppointmentEvent).toHaveBeenCalledWith(
      "appt-orch-1",
      "confirmed",
      expect.objectContaining({}),
    );
    expect(enqueueWebhookJob).toHaveBeenCalledTimes(1);
    expect(enqueueWebhookJob).toHaveBeenCalledWith(
      "biz-gvm",
      "appointment.created",
      expect.objectContaining({ appointmentId: "appt-orch-1" }),
    );
    expect(deliverBookingNotifications).toHaveBeenCalledTimes(1);
    expect(deliverBookingNotifications).toHaveBeenCalledWith("appt-orch-1");
  });

  it("T2 persist failure: zero orchestrator, webhook, and notification delivery", async () => {
    rpcResult = {
      data: null,
      error: { message: "Time slot no longer available" },
    };

    const result = await bookAppointment({}, bookingForm());

    expect(result.error).toMatch(/time slot/i);
    expect(handleAppointmentEvent).not.toHaveBeenCalled();
    expect(enqueueWebhookJob).not.toHaveBeenCalled();
    expect(deliverBookingNotifications).not.toHaveBeenCalled();
  });

  it("T3 request-approval pending maps to handleAppointmentEvent(created) with one appointment.created webhook", async () => {
    getPublicBusinessBySlug.mockResolvedValue({
      ...business,
      public_booking_mode: "request_approval",
    });

    const result = await bookAppointment({}, bookingForm());

    expect(result.error).toBeUndefined();
    expect(handleAppointmentEvent).toHaveBeenCalledTimes(1);
    expect(handleAppointmentEvent).toHaveBeenCalledWith(
      "appt-orch-1",
      "created",
      expect.objectContaining({}),
    );
    expect(enqueueWebhookJob).toHaveBeenCalledTimes(1);
    expect(enqueueWebhookJob).toHaveBeenCalledWith(
      "biz-gvm",
      "appointment.created",
      expect.objectContaining({ appointmentId: "appt-orch-1" }),
    );
  });

  it("T6 dashboard/staff createBooking still runs exactly one orchestration pass", async () => {
    const result = await createBooking(
      {
        channel: "staff",
        businessId: "biz-gvm",
        locationId: "loc-1",
        serviceId: "svc-1",
        staffId: "staff-1",
        customerId: "cust-1",
        requestedStart: "2026-08-28T16:30:00.000Z",
        requestedStatus: "confirmed",
        priceCents: 20000,
        taxCents: 0,
        depositCents: 0,
      },
      sessionBookingPersistence(),
    );

    expect(result.phase).toBe("success");
    expect(result.data?.appointmentId).toBe("appt-session-1");
    expect(handleAppointmentEvent).toHaveBeenCalledTimes(1);
    expect(handleAppointmentEvent).toHaveBeenCalledWith(
      "appt-session-1",
      "confirmed",
      expect.objectContaining({}),
    );
    expect(enqueueWebhookJob).toHaveBeenCalledTimes(1);
    expect(enqueueWebhookJob).toHaveBeenCalledWith(
      "biz-gvm",
      "appointment.created",
      expect.objectContaining({ appointmentId: "appt-session-1" }),
    );
    expect(deliverBookingNotifications).not.toHaveBeenCalled();
  });

  it("does not use a mocked createBooking for the public named-staff proof", async () => {
    const result = await createBooking(
      {
        channel: "public",
        businessId: "biz-gvm",
        locationId: "loc-1",
        serviceId: "svc-1",
        staffId: "staff-1",
        requestedStart: "2026-08-28T16:30:00.000Z",
        requestedStatus: "confirmed",
        priceCents: 20000,
        taxCents: 0,
        depositCents: 0,
      },
      publicBookingPersistence({
        customerName: "Test Customer",
        customerEmail: "guest@example.com",
        customerPhone: null,
      }),
    );

    expect(result.phase).toBe("success");
    expect(handleAppointmentEvent).toHaveBeenCalledTimes(1);
    expect(enqueueWebhookJob).toHaveBeenCalledTimes(1);
    expect(enqueueWebhookJob).toHaveBeenCalledWith(
      "biz-gvm",
      "appointment.created",
      expect.objectContaining({ appointmentId: "appt-orch-1" }),
    );
  });
});
