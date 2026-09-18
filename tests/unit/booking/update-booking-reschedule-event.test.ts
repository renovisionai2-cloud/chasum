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
let existingRow: Record<string, unknown> | null = {
  id: "appt-1",
  business_id: "biz-1",
  service_id: "svc-1",
  staff_id: "staff-1",
  customer_id: "cust-1",
  location_id: "loc-1",
  start_time: "2026-09-16T18:00:00+00:00",
  end_time: "2026-09-16T18:45:00+00:00",
  status: "confirmed",
  notes: null,
  room_id: null,
  payment_status: "unpaid",
  amount_paid_cents: 0,
};

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
  cleanupMinutes: 15,
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

function intent(overrides: Partial<UpdateBookingIntent> = {}): UpdateBookingIntent {
  return {
    channel: "staff",
    businessId: "biz-1",
    appointmentId: "appt-1",
    locationId: "loc-1",
    serviceId: "svc-1",
    staffId: "staff-1",
    customerId: "cust-1",
    requestedStart: "2026-09-17T13:00:00+00:00",
    requestedStatus: "confirmed",
    notes: null,
    excludeAppointmentId: "appt-1",
    ...overrides,
  };
}

describe("updateBooking reschedule vs update events", () => {
  beforeEach(() => {
    eqCalls.length = 0;
    updateRows.length = 0;
    existingRow = {
      id: "appt-1",
      business_id: "biz-1",
      service_id: "svc-1",
      staff_id: "staff-1",
      customer_id: "cust-1",
      location_id: "loc-1",
      start_time: "2026-09-16T18:00:00+00:00",
      end_time: "2026-09-16T18:45:00+00:00",
      status: "confirmed",
      notes: null,
      room_id: null,
      payment_status: "unpaid",
      amount_paid_cents: 0,
    };
    emitBookingEvent.mockClear();
    createBookingEvent.mockClear();
    logAppointmentChange.mockClear();
    validateBooking.mockReset();
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-09-17T13:45:00+00:00",
    });
  });

  it("emits appointment.rescheduled with previousStartTime when start actually moves", async () => {
    const result = await updateBooking(intent());

    expect(result.phase).toBe("success");
    expect(result.data?.appointmentId).toBe("appt-1");
    expect(createBookingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "appointment.rescheduled",
        businessId: "biz-1",
        appointmentId: "appt-1",
        payload: expect.objectContaining({
          previousStartTime: "2026-09-16T18:00:00+00:00",
          previousEndTime: "2026-09-16T18:45:00+00:00",
        }),
      }),
    );
    expect(logAppointmentChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: "reschedule" }),
    );
    const row = updateRows[0] as Record<string, unknown>;
    expect(row.start_time).toBe("2026-09-17T13:00:00+00:00");
    expect(row).not.toHaveProperty("payment_status");
    expect(row).not.toHaveProperty("amount_paid_cents");
    expect(eqCalls.some((call) => call.column === "id" && call.value === "appt-1")).toBe(
      true,
    );
    expect(
      eqCalls.some((call) => call.column === "business_id" && call.value === "biz-1"),
    ).toBe(true);
  });

  it("emits appointment.updated when start is the same instant in a different ISO shape", async () => {
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-09-16T18:45:00+00:00",
    });

    await updateBooking(
      intent({
        requestedStart: "2026-09-16T18:00:00.000Z",
        notes: "front-desk note",
      }),
    );

    expect(createBookingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "appointment.updated",
        appointmentId: "appt-1",
      }),
    );
    expect(createBookingEvent.mock.calls[0]?.[0]).not.toEqual(
      expect.objectContaining({ type: "appointment.rescheduled" }),
    );
    expect(logAppointmentChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update" }),
    );
  });

  describe.each(["completed", "no_show"] as const)("%s occurrence integrity", (status) => {
    it.each(["same", "start", "end"] as const)(
      "emits one dedicated event for confirmed transition with %s range",
      async (range) => {
        const requestedStart = range === "start"
          ? "2026-09-17T13:00:00+00:00"
          : "2026-09-16T18:00:00+00:00";
        const endTime = range === "start"
          ? "2026-09-17T13:45:00+00:00"
          : range === "end"
            ? "2026-09-16T19:00:00+00:00"
            : "2026-09-16T18:45:00+00:00";
        validateBooking.mockResolvedValue({ ok: true, context, endTime });

        const result = await updateBooking(intent({ requestedStatus: status, requestedStart }));

        expect(result.phase).toBe("success");
        expect(result.events).toHaveLength(1);
        expect(createBookingEvent).toHaveBeenCalledTimes(1);
        expect(emitBookingEvent).toHaveBeenCalledTimes(1);
        expect(emitBookingEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: `appointment.${status}` }),
        );
        expect(logAppointmentChange).toHaveBeenCalledTimes(1);
        expect(logAppointmentChange).toHaveBeenCalledWith(
          expect.objectContaining({ action: "update" }),
        );
      },
    );

    it.each(["same", "start", "end"] as const)(
      "emits one ordinary event for already-final status with %s range",
      async (range) => {
        existingRow = { ...existingRow, status };
        const requestedStart = range === "start"
          ? "2026-09-17T13:00:00+00:00"
          : "2026-09-16T18:00:00.000Z";
        const endTime = range === "start"
          ? "2026-09-17T13:45:00+00:00"
          : range === "end"
            ? "2026-09-16T19:00:00+00:00"
            : "2026-09-16T18:45:00.000Z";
        validateBooking.mockResolvedValue({ ok: true, context, endTime });

        const result = await updateBooking(intent({
          requestedStatus: status, requestedStart, notes: "follow-up note",
        }));

        expect(result.phase).toBe("success");
        expect(result.events).toHaveLength(1);
        expect(createBookingEvent).toHaveBeenCalledTimes(1);
        expect(emitBookingEvent).toHaveBeenCalledTimes(1);
        expect(emitBookingEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: range === "same" ? "appointment.updated" : "appointment.rescheduled",
            payload: expect.objectContaining(range === "same" ? {} : {
              previousStartTime: "2026-09-16T18:00:00+00:00",
              previousEndTime: "2026-09-16T18:45:00+00:00",
            }),
          }),
        );
        expect(logAppointmentChange).toHaveBeenCalledTimes(1);
        expect(logAppointmentChange).toHaveBeenCalledWith(
          expect.objectContaining({ action: range === "same" ? "update" : "reschedule" }),
        );
      },
    );
  });

  it("emits appointment.rescheduled when start is unchanged and resolved end moves", async () => {
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-09-16T19:00:00+00:00",
    });

    const result = await updateBooking(
      intent({
        requestedStart: "2026-09-16T18:00:00+00:00",
        notes: "extend to 60 minutes",
      }),
    );

    expect(result.phase).toBe("success");
    expect(createBookingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "appointment.rescheduled",
        businessId: "biz-1",
        appointmentId: "appt-1",
        channel: "staff",
        payload: expect.objectContaining({
          previousStartTime: "2026-09-16T18:00:00+00:00",
          previousEndTime: "2026-09-16T18:45:00+00:00",
          beforeState: expect.objectContaining({
            start_time: "2026-09-16T18:00:00+00:00",
            end_time: "2026-09-16T18:45:00+00:00",
          }),
        }),
      }),
    );
    expect(logAppointmentChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: "reschedule" }),
    );
    const row = updateRows[0] as Record<string, unknown>;
    expect(row.start_time).toBe("2026-09-16T18:00:00+00:00");
    expect(row.end_time).toBe("2026-09-16T19:00:00+00:00");
    expect(row).not.toHaveProperty("payment_status");
    expect(row).not.toHaveProperty("amount_paid_cents");
    expect(eqCalls.some((call) => call.column === "id" && call.value === "appt-1")).toBe(
      true,
    );
    expect(
      eqCalls.some((call) => call.column === "business_id" && call.value === "biz-1"),
    ).toBe(true);
  });

  it("emits appointment.updated for a notes-only edit with the same start and end instants", async () => {
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-09-16T18:45:00+00:00",
    });

    await updateBooking(
      intent({
        requestedStart: "2026-09-16T18:00:00+00:00",
        notes: "front-desk note only",
      }),
    );

    expect(createBookingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "appointment.updated",
        appointmentId: "appt-1",
        businessId: "biz-1",
      }),
    );
    expect(createBookingEvent.mock.calls[0]?.[0]).not.toEqual(
      expect.objectContaining({ type: "appointment.rescheduled" }),
    );
    expect(logAppointmentChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update" }),
    );
  });

  it("does not false-positive when start and end are equivalent ISO instants", async () => {
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-09-16T18:45:00.000Z",
    });

    await updateBooking(
      intent({
        requestedStart: "2026-09-16T18:00:00.000Z",
        notes: "same range, different ISO",
      }),
    );

    expect(createBookingEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "appointment.updated" }),
    );
    expect(createBookingEvent.mock.calls[0]?.[0]).not.toEqual(
      expect.objectContaining({ type: "appointment.rescheduled" }),
    );
    expect(logAppointmentChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update" }),
    );
  });

  it("keeps first confirmed transitions to completed and no_show ahead of an end-time-only range change", async () => {
    validateBooking.mockResolvedValue({
      ok: true,
      context,
      endTime: "2026-09-16T19:00:00+00:00",
    });

    await updateBooking(
      intent({
        requestedStatus: "completed",
        requestedStart: "2026-09-16T18:00:00+00:00",
      }),
    );
    expect(createBookingEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "appointment.completed" }),
    );
    expect(logAppointmentChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update" }),
    );

    createBookingEvent.mockClear();
    logAppointmentChange.mockClear();
    await updateBooking(
      intent({
        requestedStatus: "no_show",
        requestedStart: "2026-09-16T18:00:00+00:00",
      }),
    );
    expect(createBookingEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "appointment.no_show" }),
    );
    expect(logAppointmentChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update" }),
    );
  });

  it("rejects generic updateBooking cancellation instead of emitting appointment.cancelled", async () => {
    const result = await updateBooking(intent({ requestedStatus: "cancelled" }));

    expect(result.phase).toBe("rollback");
    expect(result.error).toMatch(/use cancel appointment/i);
    expect(createBookingEvent).not.toHaveBeenCalled();
    expect(updateRows).toEqual([]);
  });

  describe("omitted or null requestedStatus preserves stored operational status", () => {
    const SAME_START = "2026-09-16T18:00:00+00:00";
    const SAME_END = "2026-09-16T18:45:00+00:00";
    const MONEY_KEYS = [
      "payment_status",
      "amount_paid_cents",
      "price_cents",
      "tax_cents",
      "deposit_cents",
    ] as const;

    function omitRequestedStatus(
      overrides: Partial<UpdateBookingIntent> = {},
    ): UpdateBookingIntent {
      const next = intent({ requestedStart: SAME_START, ...overrides });
      delete next.requestedStatus;
      return next;
    }

    function nullRequestedStatus(
      overrides: Partial<UpdateBookingIntent> = {},
    ): UpdateBookingIntent {
      return intent({
        requestedStart: SAME_START,
        ...overrides,
        // FormData missing status can be null at runtime despite the optional type.
        requestedStatus: null as unknown as UpdateBookingIntent["requestedStatus"],
      });
    }

    function expectNoMoneyFields(row: Record<string, unknown>) {
      for (const key of MONEY_KEYS) {
        expect(row).not.toHaveProperty(key);
      }
    }

    function expectTenantFilters() {
      expect(
        eqCalls.some((call) => call.column === "id" && call.value === "appt-1"),
      ).toBe(true);
      expect(
        eqCalls.some(
          (call) => call.column === "business_id" && call.value === "biz-1",
        ),
      ).toBe(true);
    }

    beforeEach(() => {
      validateBooking.mockResolvedValue({
        ok: true,
        context,
        endTime: SAME_END,
      });
    });

    it.each(["completed", "no_show", "arrived", "waiting", "in_progress"] as const)(
      "preserves existing %s when requestedStatus is omitted",
      async (status) => {
        existingRow = { ...existingRow, status };
        const result = await updateBooking(omitRequestedStatus());

        expect(result.phase).toBe("success");
        expect(result.events).toHaveLength(1);
        const row = updateRows[0] as Record<string, unknown>;
        expect(row.status).toBe(status);
        expectNoMoneyFields(row);
        expectTenantFilters();
        expect(createBookingEvent).toHaveBeenCalledTimes(1);
        expect(emitBookingEvent).toHaveBeenCalledTimes(1);
        expect(createBookingEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: "appointment.updated" }),
        );
        expect(logAppointmentChange).toHaveBeenCalledWith(
          expect.objectContaining({
            action: "update",
            afterState: expect.objectContaining({ status }),
          }),
        );
      },
    );

    it.each(["completed", "no_show"] as const)(
      "preserves existing %s when requestedStatus is runtime null",
      async (status) => {
        existingRow = { ...existingRow, status };
        const result = await updateBooking(nullRequestedStatus());

        expect(result.phase).toBe("success");
        expect(result.events).toHaveLength(1);
        const row = updateRows[0] as Record<string, unknown>;
        expect(row.status).toBe(status);
        expectNoMoneyFields(row);
        expect(createBookingEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: "appointment.updated" }),
        );
      },
    );

    it.each(["pending", "confirmed"] as const)(
      "keeps existing %s through the pending/confirmed resolver when requestedStatus is omitted",
      async (status) => {
        existingRow = { ...existingRow, status };
        const result = await updateBooking(omitRequestedStatus());

        expect(result.phase).toBe("success");
        const row = updateRows[0] as Record<string, unknown>;
        expect(row.status).toBe(status);
        expect(createBookingEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: "appointment.updated" }),
        );
      },
    );

    it("emits appointment.rescheduled for retained completed when start moves and status is omitted", async () => {
      existingRow = { ...existingRow, status: "completed" };
      validateBooking.mockResolvedValue({
        ok: true,
        context,
        endTime: "2026-09-17T13:45:00+00:00",
      });

      const result = await updateBooking(
        omitRequestedStatus({ requestedStart: "2026-09-17T13:00:00+00:00" }),
      );

      expect(result.phase).toBe("success");
      expect(result.events).toHaveLength(1);
      expect((updateRows[0] as Record<string, unknown>).status).toBe("completed");
      expect(createBookingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "appointment.rescheduled",
          payload: expect.objectContaining({
            previousStartTime: "2026-09-16T18:00:00+00:00",
            previousEndTime: "2026-09-16T18:45:00+00:00",
          }),
        }),
      );
      expect(logAppointmentChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: "reschedule" }),
      );
    });

    it("emits appointment.rescheduled for retained no_show when end moves and status is omitted", async () => {
      existingRow = { ...existingRow, status: "no_show" };
      validateBooking.mockResolvedValue({
        ok: true,
        context,
        endTime: "2026-09-16T19:00:00+00:00",
      });

      const result = await updateBooking(omitRequestedStatus());

      expect(result.phase).toBe("success");
      expect(result.events).toHaveLength(1);
      expect((updateRows[0] as Record<string, unknown>).status).toBe("no_show");
      expect(createBookingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "appointment.rescheduled",
          payload: expect.objectContaining({
            previousStartTime: "2026-09-16T18:00:00+00:00",
            previousEndTime: "2026-09-16T18:45:00+00:00",
          }),
        }),
      );
    });
  });
});
