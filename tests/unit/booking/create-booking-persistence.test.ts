import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AvailabilityContext, BookingIntent } from "@/lib/booking-engine/types";
import { publicBookingPersistence } from "@/lib/booking-engine/adapters/public";
import { sessionBookingPersistence } from "@/lib/booking-engine/persistence";

const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
const appointmentInserts: unknown[] = [];
let rpcResult: { data: string | null; error: { message: string } | null } = {
  data: "appt-public",
  error: null,
};

const { emitBookingEvent, createBookingEvent } = vi.hoisted(() => ({
  emitBookingEvent: vi.fn(async (event: unknown) => event),
  createBookingEvent: vi.fn((event: unknown) => event),
}));

const validateBooking = vi.fn();

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

vi.mock("@/lib/booking-engine/events", () => ({
  createBookingEvent: (event: unknown) => createBookingEvent(event),
  emitBookingEvent: (event: unknown) => emitBookingEvent(event),
  onBookingEvent: () => () => undefined,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args });
      if (name === "book_public_appointment") {
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
              price: 200,
              deposit_cents: 0,
              deposit_required: false,
              tax_rate_bps: null,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      };
      query.insert = (row: unknown) => {
        if (table === "appointments") {
          appointmentInserts.push(row);
        }
        return {
          select: () => ({
            single: async () => ({
              data: { id: "appt-session" },
              error: null,
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

import { createBooking } from "@/lib/booking-engine/mutations/create";

const context: AvailabilityContext = {
  businessId: "biz-1",
  locationId: "loc-1",
  serviceId: "svc-1",
  staffId: "staff-1",
  channel: "public",
  timezone: "America/Toronto",
  intervalMinutes: 30,
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

function namedStaffIntent(
  overrides: Partial<BookingIntent> = {},
): BookingIntent {
  return {
    channel: "public",
    businessId: "biz-1",
    locationId: "loc-1",
    serviceId: "svc-1",
    staffId: "staff-1",
    customerId: "cust-1",
    requestedStart: "2026-08-28T16:30:00.000Z",
    requestedStatus: "confirmed",
    priceCents: 20000,
    taxCents: 0,
    depositCents: 0,
    ...overrides,
  };
}

describe("createBooking persistence strategy seam", () => {
  beforeEach(() => {
    rpcCalls.length = 0;
    appointmentInserts.length = 0;
    rpcResult = { data: "appt-public", error: null };
    emitBookingEvent.mockClear();
    createBookingEvent.mockClear();
    validateBooking.mockReset();
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-08-28T17:00:00.000Z",
    });
  });

  it("uses session/RLS insert by default, including when channel is public", async () => {
    const result = await createBooking(namedStaffIntent());

    expect(result.phase).toBe("success");
    expect(result.data?.appointmentId).toBe("appt-session");
    expect(appointmentInserts).toHaveLength(1);
    expect(rpcCalls.map((call) => call.name)).not.toContain(
      "book_public_appointment",
    );
    const row = appointmentInserts[0] as Record<string, unknown>;
    expect(row.staff_id).toBe("staff-1");
    expect(row.customer_id).toBe("cust-1");
    expect(row.start_time).toBe("2026-08-28T16:30:00.000Z");
    expect(row.end_time).toBe("2026-08-28T17:00:00.000Z");
    expect(row.status).toBe("confirmed");
    expect(row.price_cents).toBe(20000);
    expect(emitBookingEvent).toHaveBeenCalledTimes(1);
    expect(emitBookingEvent.mock.calls[0]?.[0]).toMatchObject({
      type: "appointment.created",
      appointmentId: "appt-session",
    });
  });

  it("does not treat an explicit session strategy as privileged even for public channel", async () => {
    await createBooking(namedStaffIntent(), sessionBookingPersistence());
    expect(appointmentInserts).toHaveLength(1);
    expect(rpcCalls).toEqual([]);
  });

  it("invokes book_public_appointment only when the public_rpc strategy is passed", async () => {
    const result = await createBooking(
      namedStaffIntent({ customerId: undefined }),
      publicBookingPersistence({
        customerName: "Jordan Lee",
        customerEmail: "jordan@example.com",
        customerPhone: "555-0100",
      }),
    );

    expect(result.phase).toBe("success");
    expect(result.data?.appointmentId).toBe("appt-public");
    expect(appointmentInserts).toEqual([]);
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0]?.name).toBe("book_public_appointment");
    expect(rpcCalls[0]?.args).toMatchObject({
      p_business_id: "biz-1",
      p_location_id: "loc-1",
      p_service_id: "svc-1",
      p_staff_id: "staff-1",
      p_customer_name: "Jordan Lee",
      p_customer_email: "jordan@example.com",
      p_customer_phone: "555-0100",
      p_start_time: "2026-08-28T16:30:00.000Z",
      p_end_time: "2026-08-28T17:00:00.000Z",
      p_status: "confirmed",
      // 040-compatible payload. 041 ignores these and stamps catalog amounts.
      p_price_cents: 20000,
      p_tax_cents: 0,
      p_deposit_cents: 0,
    });
    expect(emitBookingEvent).toHaveBeenCalledTimes(1);
    expect(emitBookingEvent.mock.calls[0]?.[0]).toMatchObject({
      type: "appointment.created",
      appointmentId: "appt-public",
    });
  });

  it("passes pending through the public RPC without rewriting it to another lifecycle state", async () => {
    await createBooking(
      namedStaffIntent({
        customerId: undefined,
        requestedStatus: "pending",
      }),
      publicBookingPersistence({
        customerName: "Jordan Lee",
        customerEmail: "jordan@example.com",
        customerPhone: null,
      }),
    );

    expect(rpcCalls[0]?.args.p_status).toBe("pending");
  });

  it("maps overlapping public RPC errors to a friendly conflict and does not insert", async () => {
    rpcResult = {
      data: null,
      error: { message: "Time slot no longer available" },
    };

    const result = await createBooking(
      namedStaffIntent({ customerId: undefined }),
      publicBookingPersistence({
        customerName: "Jordan Lee",
        customerEmail: "jordan@example.com",
        customerPhone: null,
      }),
    );

    expect(appointmentInserts).toEqual([]);
    expect(result.phase).toBe("conflict");
    expect(result.error).toMatch(/time slot/i);
    expect(result.conflicts?.[0]?.code).toBe("STAFF_BUSY");
    expect(emitBookingEvent).not.toHaveBeenCalled();
  });

  it("keeps dashboard/staff channel on the session writer", async () => {
    const result = await createBooking(
      namedStaffIntent({ channel: "staff", requestedStatus: "pending" }),
    );

    expect(result.phase).toBe("success");
    expect(result.data?.appointmentId).toBe("appt-session");
    expect(rpcCalls).toEqual([]);
    expect(appointmentInserts).toHaveLength(1);
  });

  it("emits appointment.created exactly once for session and public_rpc success, and never on persist failure", async () => {
    const session = await createBooking(namedStaffIntent());
    expect(session.phase).toBe("success");
    expect(emitBookingEvent).toHaveBeenCalledTimes(1);
    expect(createBookingEvent).toHaveBeenCalledTimes(1);
    expect(createBookingEvent.mock.calls[0]?.[0]).toMatchObject({
      type: "appointment.created",
    });

    emitBookingEvent.mockClear();
    createBookingEvent.mockClear();

    const publicRpc = await createBooking(
      namedStaffIntent({ customerId: undefined }),
      publicBookingPersistence({
        customerName: "Jordan Lee",
        customerEmail: "jordan@example.com",
        customerPhone: null,
      }),
    );
    expect(publicRpc.phase).toBe("success");
    expect(emitBookingEvent).toHaveBeenCalledTimes(1);
    expect(emitBookingEvent.mock.calls[0]?.[0]).toMatchObject({
      type: "appointment.created",
      appointmentId: "appt-public",
    });

    emitBookingEvent.mockClear();
    rpcResult = {
      data: null,
      error: { message: "Time slot no longer available" },
    };
    const failed = await createBooking(
      namedStaffIntent({ customerId: undefined }),
      publicBookingPersistence({
        customerName: "Jordan Lee",
        customerEmail: "jordan@example.com",
        customerPhone: null,
      }),
    );
    expect(failed.phase).toBe("conflict");
    expect(emitBookingEvent).not.toHaveBeenCalled();
  });
});
