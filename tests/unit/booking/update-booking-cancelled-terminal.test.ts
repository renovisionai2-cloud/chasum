// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AvailabilityContext, UpdateBookingIntent } from "@/lib/booking-engine/types";

const { emitBookingEvent, createBookingEvent, logAppointmentChange } = vi.hoisted(
  () => ({
    emitBookingEvent: vi.fn(async (event: unknown) => event),
    createBookingEvent: vi.fn((event: unknown) => event),
    logAppointmentChange: vi.fn().mockResolvedValue(undefined),
  }),
);

const validateBooking = vi.fn();
const eqCalls: Array<{ table: string; column: string; value: unknown }> = [];
const updateRows: unknown[] = [];
let existingRow: Record<string, unknown> | null = null;

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
    logAppointmentChange: (...args: unknown[]) => logAppointmentChange(...args),
  };
});

vi.mock("@/lib/booking-engine/events", () => ({
  createBookingEvent: (event: unknown) => createBookingEvent(event),
  emitBookingEvent: (event: unknown) => emitBookingEvent(event),
  onBookingEvent: () => () => undefined,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from(table: string) {
      const query: Record<string, unknown> = {};
      const self = () => query;
      query.select = self;
      query.eq = (column: string, value: unknown) => {
        eqCalls.push({ table, column, value });
        return query;
      };
      query.update = (row: unknown) => {
        updateRows.push(row);
        return query;
      };
      query.maybeSingle = async () => ({ data: existingRow, error: null });
      query.then = (
        onFulfilled: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve({ error: null }).then(onFulfilled, onRejected);
      return query;
    },
  }),
}));

import { updateBooking } from "@/lib/booking-engine/mutations/update";

const context: AvailabilityContext = {
  businessId: "biz-1",
  locationId: "loc-1",
  serviceId: "svc-1",
  staffId: "staff-1",
  channel: "staff",
  timezone: "America/Toronto",
  intervalMinutes: 15,
  durationMinutes: 45,
  cleanupMinutes: 0,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  minNoticeMinutes: null,
  maxBookingDaysAhead: null,
  maxAppointmentsPerDay: null,
  allowDoubleBooking: false,
  acceptOnlineBookings: true,
  bookingVisibility: "internal",
  confirmationMode: "inherit",
  priorityScheduling: 0,
  serviceActive: true,
  staffActive: true,
  composedAt: "2026-09-16T18:00:00.000Z",
};

const cancelledRow = {
  id: "appt-1",
  business_id: "biz-1",
  service_id: "svc-1",
  staff_id: "staff-1",
  customer_id: "cust-1",
  location_id: "loc-1",
  start_time: "2026-09-16T18:00:00+00:00",
  end_time: "2026-09-16T18:45:00+00:00",
  status: "cancelled",
  notes: "original note",
  room_id: null,
};

function intent(overrides: Partial<UpdateBookingIntent> = {}): UpdateBookingIntent {
  return {
    channel: "staff",
    businessId: "biz-1",
    appointmentId: "appt-1",
    locationId: "loc-1",
    serviceId: "svc-1",
    staffId: "staff-1",
    customerId: "cust-1",
    requestedStart: "2026-09-16T18:00:00+00:00",
    requestedEnd: "2026-09-16T18:45:00+00:00",
    requestedStatus: "cancelled",
    notes: "original note",
    excludeAppointmentId: "appt-1",
    ...overrides,
  };
}

describe("updateBooking cancelled terminal integrity", () => {
  beforeEach(() => {
    eqCalls.length = 0;
    updateRows.length = 0;
    existingRow = { ...cancelledRow };
    emitBookingEvent.mockClear();
    createBookingEvent.mockClear();
    logAppointmentChange.mockClear();
    validateBooking.mockReset();
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-09-16T18:45:00+00:00",
    });
  });

  it.each([
    "arrived",
    "completed",
    "confirmed",
    "waiting",
    "in_progress",
    "no_show",
    "pending",
  ] as const)("rejects existing cancelled + requested %s with zero write and zero event", async (status) => {
    const result = await updateBooking(intent({ requestedStatus: status }));

    expect(result.phase).toBe("rollback");
    expect(result.error).toMatch(/cancelled appointments are terminal/i);
    expect(updateRows).toEqual([]);
    expect(createBookingEvent).not.toHaveBeenCalled();
    expect(emitBookingEvent).not.toHaveBeenCalled();
    expect(validateBooking).not.toHaveBeenCalled();
  });

  it("no-ops when cancelled fields and notes are unchanged", async () => {
    const result = await updateBooking(intent());

    expect(result.phase).toBe("success");
    expect(result.data?.appointmentId).toBe("appt-1");
    expect(result.events ?? []).toEqual([]);
    expect(updateRows).toEqual([]);
    expect(createBookingEvent).not.toHaveBeenCalled();
    expect(emitBookingEvent).not.toHaveBeenCalled();
    expect(logAppointmentChange).not.toHaveBeenCalled();
    expect(validateBooking).not.toHaveBeenCalled();
  });

  it("persists notes only on a cancelled appointment without a cancellation event", async () => {
    const result = await updateBooking(intent({ notes: "front desk follow-up" }));

    expect(result.phase).toBe("success");
    expect(updateRows).toEqual([{ notes: "front desk follow-up" }]);
    expect(createBookingEvent).not.toHaveBeenCalled();
    expect(emitBookingEvent).not.toHaveBeenCalled();
    expect(logAppointmentChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        beforeState: expect.objectContaining({
          status: "cancelled",
          notes: "original note",
        }),
        afterState: expect.objectContaining({
          status: "cancelled",
          notes: "front desk follow-up",
        }),
      }),
    );
    expect(validateBooking).not.toHaveBeenCalled();
  });

  it("rejects a cancelled appointment duration change instead of discarding it", async () => {
    const result = await updateBooking(intent({ durationMinutes: 90 }));

    expect(result.phase).toBe("rollback");
    expect(result.error).toMatch(/can only update notes/i);
    expect(updateRows).toEqual([]);
    expect(createBookingEvent).not.toHaveBeenCalled();
    expect(validateBooking).not.toHaveBeenCalled();
  });

  it("rejects a cancelled appointment time change instead of discarding it", async () => {
    const result = await updateBooking(
      intent({ requestedStart: "2026-09-16T19:00:00+00:00" }),
    );

    expect(result.phase).toBe("rollback");
    expect(result.error).toMatch(/can only update notes/i);
    expect(updateRows).toEqual([]);
    expect(createBookingEvent).not.toHaveBeenCalled();
  });

  it.each(["serviceId", "staffId", "locationId", "customerId"] as const)(
    "rejects cancelled appointment %s change",
    async (field) => {
      const result = await updateBooking(intent({ [field]: `${field}-changed` }));

      expect(result.phase).toBe("rollback");
      expect(result.error).toMatch(/can only update notes/i);
      expect(updateRows).toEqual([]);
      expect(createBookingEvent).not.toHaveBeenCalled();
    },
  );

  it("rejects generic updateBooking cancellation of an active appointment", async () => {
    existingRow = { ...cancelledRow, status: "confirmed" };

    const result = await updateBooking(intent({ requestedStatus: "cancelled" }));

    expect(result.phase).toBe("rollback");
    expect(result.error).toMatch(/use cancel appointment/i);
    expect(updateRows).toEqual([]);
    expect(createBookingEvent).not.toHaveBeenCalled();
    expect(emitBookingEvent).not.toHaveBeenCalled();
    expect(validateBooking).not.toHaveBeenCalled();
  });
});
