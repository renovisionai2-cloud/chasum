import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitStore } from "@/lib/security/rate-limit";
import { resolveRequestedStatus } from "@/lib/booking-engine/availability/compose";
import type { AvailabilityContext, BookingIntent } from "@/lib/booking-engine/types";

const getPublicBusinessBySlug = vi.fn();
const createBooking = vi.fn();
const previewAvailableSlots = vi.fn();
const handleAppointmentEvent = vi.fn();
const deliverBookingNotifications = vi.fn();
const rpcCalls: Array<{ name: string; args: unknown }> = [];

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

vi.mock("@/lib/booking-engine", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/booking-engine")>();
  return {
    ...actual,
    createBooking: (...args: unknown[]) => createBooking(...args),
    previewAvailableSlots: (...args: unknown[]) =>
      previewAvailableSlots(...args),
  };
});

vi.mock("@/lib/integrations/notifications/orchestrator", () => ({
  handleAppointmentEvent: (...args: unknown[]) =>
    handleAppointmentEvent(...args),
}));

vi.mock("@/lib/notifications/booking-delivery", () => ({
  deliverBookingNotifications: (...args: unknown[]) =>
    deliverBookingNotifications(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (name: string, args: unknown) => {
      rpcCalls.push({ name, args });
      if (name === "upsert_booking_customer") {
        return { data: "cust-1", error: null };
      }
      return { data: null, error: { message: `unexpected rpc ${name}` } };
    },
    from(table: string) {
      const query: Record<string, unknown> = {};
      const self = () => query;
      query.select = self;
      query.eq = self;
      query.maybeSingle = async () => {
        if (table === "locations") {
          return { data: { name: "Main" }, error: null };
        }
        if (table === "tax_rates") {
          return { data: [], error: null };
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
        return { data: null, error: { message: "not found" } };
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
        if (table === "staff_services") {
          return Promise.resolve({
            data: [
              {
                staff_id: "staff-1",
                staff: {
                  id: "staff-1",
                  name: "Alex Rivera",
                  is_active: true,
                  location_id: "loc-1",
                },
              },
            ],
            error: null,
          }).then(onFulfilled, onRejected);
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
import { publicBookingStaffIdForEngine } from "@/lib/booking/public-write-path";

const PUBLIC_BOOKING_SOURCE = readFileSync(
  join(process.cwd(), "lib/actions/public-booking.ts"),
  "utf8",
);

function bookingForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const values: Record<string, string> = {
    slug: "gvm-baby-world",
    location_id: "loc-1",
    service_id: "svc-1",
    staff_id: "staff-1",
    any_staff: "0",
    start_time: "2026-08-28T16:10:00.000Z",
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
  slug: "gvm-baby-world",
  public_booking_mode: "public" as const,
  booking_invite_code: null,
};

function statusContext(
  overrides: Partial<AvailabilityContext> = {},
): AvailabilityContext {
  return {
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
    composedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("public booking write-path convergence", () => {
  beforeEach(() => {
    resetRateLimitStore();
    rpcCalls.length = 0;
    getPublicBusinessBySlug.mockReset();
    createBooking.mockReset();
    handleAppointmentEvent.mockReset();
    deliverBookingNotifications.mockReset();
    getPublicBusinessBySlug.mockResolvedValue(business);
    createBooking.mockResolvedValue({
      phase: "success",
      data: { appointmentId: "appt-1" },
      events: [],
    });
    previewAvailableSlots.mockResolvedValue({
      slots: [{ start: "2026-08-28T16:10:00.000Z", score: 1 }],
    });
    handleAppointmentEvent.mockResolvedValue(undefined);
    deliverBookingNotifications.mockResolvedValue({
      appointmentId: "appt-1",
      items: [{ channel: "customer_email", status: "sent" }],
    });
  });

  it("does not call the legacy create_public_appointment RPC from public booking", () => {
    expect(PUBLIC_BOOKING_SOURCE).not.toContain(
      'rpc(\n      "create_public_appointment"',
    );
    expect(PUBLIC_BOOKING_SOURCE).not.toContain(
      'rpc("create_public_appointment"',
    );
  });

  it("routes named staff through Booking Engine with the selected staff id", () => {
    expect(
      publicBookingStaffIdForEngine({
        anyStaff: false,
        selectedStaffId: "staff-1",
      }),
    ).toBe("staff-1");
  });

  it("keeps any-staff unassigned (null) for the Booking Engine", () => {
    expect(
      publicBookingStaffIdForEngine({
        anyStaff: true,
        selectedStaffId: "",
      }),
    ).toBeNull();
  });

  it("preserves pending and confirmed status when requested", () => {
    const ctx = statusContext();
    expect(resolveRequestedStatus(ctx, "pending")).toBe("pending");
    expect(resolveRequestedStatus(ctx, "confirmed")).toBe("confirmed");
  });

  it("creates a named-staff public booking via createBooking, not RPC", async () => {
    const result = await bookAppointment({}, bookingForm());

    expect(result.error).toBeUndefined();
    expect(result.appointmentId).toBe("appt-1");
    expect(rpcCalls.map((call) => call.name)).toEqual([
      "upsert_booking_customer",
    ]);
    expect(createBooking).toHaveBeenCalledTimes(1);

    const intent = createBooking.mock.calls[0]?.[0] as BookingIntent;
    expect(intent.channel).toBe("public");
    expect(intent.staffId).toBe("staff-1");
    expect(intent.customerId).toBe("cust-1");
    expect(intent.requestedStatus).toBe("confirmed");
    expect(intent.requestedStart).toBe("2026-08-28T16:10:00.000Z");
    expect(intent.priceCents).toBe(20000);
    expect(intent.taxCents).toBe(0);
    expect(intent.depositCents).toBe(0);
  });

  it("creates a request-approval named-staff booking as pending", async () => {
    getPublicBusinessBySlug.mockResolvedValue({
      ...business,
      public_booking_mode: "request_approval",
    });

    const result = await bookAppointment({}, bookingForm());

    expect(result.error).toBeUndefined();
    const intent = createBooking.mock.calls[0]?.[0] as BookingIntent;
    expect(intent.requestedStatus).toBe("pending");
    expect(handleAppointmentEvent).toHaveBeenCalledWith("appt-1", "created");
  });

  it("preserves customer identity on the engine intent", async () => {
    await bookAppointment(
      {},
      bookingForm({
        customer_name: "Jordan Lee",
        customer_email: "jordan@example.com",
      }),
    );

    const upsert = rpcCalls.find((call) => call.name === "upsert_booking_customer");
    expect(upsert?.args).toMatchObject({
      p_business_id: "biz-gvm",
      p_name: "Jordan Lee",
      p_email: "jordan@example.com",
    });
    const intent = createBooking.mock.calls[0]?.[0] as BookingIntent;
    expect(intent.customerId).toBe("cust-1");
  });

  it("fires the same post-success notification workflow as any-staff", async () => {
    await bookAppointment({}, bookingForm());

    expect(handleAppointmentEvent).toHaveBeenCalledTimes(1);
    expect(handleAppointmentEvent).toHaveBeenCalledWith("appt-1", "confirmed");
    expect(deliverBookingNotifications).toHaveBeenCalledTimes(1);
    expect(deliverBookingNotifications).toHaveBeenCalledWith("appt-1");
  });

  it("does not invent financials — passes catalog-resolved cents into createBooking", async () => {
    await bookAppointment({}, bookingForm());
    const intent = createBooking.mock.calls[0]?.[0] as BookingIntent;
    expect(intent.priceCents).toBe(20000);
    expect(typeof intent.taxCents).toBe("number");
    expect(typeof intent.depositCents).toBe("number");
  });

  it("leaves the unassigned-staff gate unchanged while 034 is unapplied", async () => {
    const result = await bookAppointment(
      {},
      bookingForm({ staff_id: "", any_staff: "1" }),
    );

    expect(result.error).toMatch(/choose a team member/i);
    expect(createBooking).not.toHaveBeenCalled();
    expect(rpcCalls.map((call) => call.name)).toEqual([
      "upsert_booking_customer",
    ]);
  });

  it("rate-limits public booking instead of silently creating duplicates", async () => {
    for (let i = 0; i < 30; i += 1) {
      const result = await bookAppointment({}, bookingForm());
      expect(result.error).toBeUndefined();
    }
    expect(createBooking).toHaveBeenCalledTimes(30);

    createBooking.mockClear();
    const blocked = await bookAppointment({}, bookingForm());
    expect(blocked.error).toMatch(/too many requests/i);
    expect(createBooking).not.toHaveBeenCalled();
  });
});
