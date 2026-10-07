// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AvailabilityContext,
  UpdateBookingIntent,
} from "@/lib/booking-engine/types";

const { emitBookingEvent, logAppointmentChange } = vi.hoisted(() => ({
  emitBookingEvent: vi.fn(async (event: unknown) => event),
  logAppointmentChange: vi.fn().mockResolvedValue(undefined),
}));

const validateBooking = vi.fn();
const updateRows: unknown[] = [];
let updateError: Record<string, unknown> | null = null;

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
  createBookingEvent: (event: unknown) => event,
  emitBookingEvent: (event: unknown) => emitBookingEvent(event),
  onBookingEvent: () => () => undefined,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from() {
      const query: Record<string, unknown> = {};
      const self = () => query;
      query.select = self;
      query.eq = self;
      query.update = (row: unknown) => {
        updateRows.push(row);
        return query;
      };
      query.maybeSingle = async () => ({
        data: {
          id: "appt-1",
          business_id: "biz-1",
          customer_id: "cust-old",
          service_id: "svc-1",
          staff_id: "staff-1",
          location_id: "loc-1",
          start_time: "2026-10-07T14:00:00.000Z",
          end_time: "2026-10-07T14:30:00.000Z",
          status: "confirmed",
          notes: null,
          room_id: null,
        },
        error: null,
      });
      query.then = (
        onFulfilled: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve({ error: updateError }).then(onFulfilled, onRejected);
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
  durationMinutes: 30,
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
  composedAt: "2026-10-07T13:00:00.000Z",
};

const intent: UpdateBookingIntent = {
  channel: "staff",
  businessId: "biz-1",
  appointmentId: "appt-1",
  customerId: "cust-new",
  serviceId: "svc-1",
  staffId: "staff-1",
  locationId: "loc-1",
  requestedStart: "2026-10-07T14:00:00.000Z",
  requestedStatus: "confirmed",
};

const constraint =
  "commerce_transactions_appt_business_customer_financial_fk";
const calmMessage =
  "This appointment has financial history, so its customer cannot be changed. Create a new appointment for the correct customer; handle any refund or reversal separately.";

describe("updateBooking financial-attribution failure mapping", () => {
  beforeEach(() => {
    updateRows.length = 0;
    updateError = null;
    emitBookingEvent.mockClear();
    logAppointmentChange.mockClear();
    validateBooking.mockReset();
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-10-07T14:30:00.000Z",
    });
  });

  it.each(["message", "details", "hint"] as const)(
    "maps an actual PostgREST-shaped 23503 carrying the exact constraint in %s",
    async (field) => {
      updateError = {
        code: "23503",
        message: "update failed",
        details: null,
        hint: null,
        [field]: `violates foreign key constraint "${constraint}"`,
      };

      const result = await updateBooking(intent);

      expect(result).toEqual({ phase: "rollback", error: calmMessage });
      expect(updateRows).toHaveLength(1);
      expect(emitBookingEvent).not.toHaveBeenCalled();
      expect(logAppointmentChange).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      code: "23503",
      message: "violates foreign key constraint some_other_constraint",
    },
    {
      code: "23503",
      message: `violates foreign key constraint ${constraint}_suffix`,
    },
    {
      code: "23503",
      message: `violates foreign key constraint prefix_${constraint}`,
    },
    {
      code: "23514",
      message: constraint,
    },
    {
      code: "23514",
      message: "LEGACY_APPOINTMENT_LEDGER_ATTRIBUTION_IMMUTABLE",
    },
  ])("leaves unrelated database failures unchanged: %#", async (error) => {
    updateError = error;

    const result = await updateBooking(intent);

    expect(result).toEqual({ phase: "rollback", error: error.message });
    expect(emitBookingEvent).not.toHaveBeenCalled();
    expect(logAppointmentChange).not.toHaveBeenCalled();
  });

  it("keeps normal update semantics when PostgreSQL accepts the mutation", async () => {
    const result = await updateBooking(intent);

    expect(result.phase).toBe("success");
    expect(updateRows).toEqual([
      expect.objectContaining({ customer_id: "cust-new" }),
    ]);
    expect(emitBookingEvent).toHaveBeenCalledTimes(1);
    expect(logAppointmentChange).toHaveBeenCalledTimes(1);
  });
});
