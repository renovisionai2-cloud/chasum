// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CancelIntent } from "@/lib/booking-engine/types";

const { emitBookingEvent, createBookingEvent, logAppointmentChange } = vi.hoisted(
  () => ({
    emitBookingEvent: vi.fn(async (event: unknown) => event),
    createBookingEvent: vi.fn((event: unknown) => event),
    logAppointmentChange: vi.fn().mockResolvedValue(undefined),
  }),
);

const eqCalls: Array<{ table: string; column: string; value: unknown }> = [];
const updateRows: unknown[] = [];
let existingRow: Record<string, unknown> | null = {
  id: "appt-1",
  status: "confirmed",
  start_time: "2026-09-17T13:00:00+00:00",
  end_time: "2026-09-17T13:30:00+00:00",
};

vi.mock("@/lib/booking-engine/conflicts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/booking-engine/conflicts")>();
  return {
    ...actual,
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

import { cancelBooking } from "@/lib/booking-engine/mutations/cancel";

function intent(overrides: Partial<CancelIntent> = {}): CancelIntent {
  return {
    channel: "staff",
    businessId: "biz-1",
    appointmentId: "appt-1",
    ...overrides,
  };
}

describe("cancelBooking first cancellation vs already-cancelled no-op", () => {
  beforeEach(() => {
    eqCalls.length = 0;
    updateRows.length = 0;
    existingRow = {
      id: "appt-1",
      status: "confirmed",
      start_time: "2026-09-17T13:00:00+00:00",
      end_time: "2026-09-17T13:30:00+00:00",
    };
    emitBookingEvent.mockClear();
    createBookingEvent.mockClear();
    logAppointmentChange.mockClear();
  });

  it("scopes the read/write by appointment id + business_id and writes only status=cancelled", async () => {
    const result = await cancelBooking(intent());

    expect(result.phase).toBe("success");
    expect(result.data?.appointmentId).toBe("appt-1");
    expect(updateRows).toEqual([{ status: "cancelled" }]);
    expect(
      eqCalls.some((call) => call.column === "id" && call.value === "appt-1"),
    ).toBe(true);
    expect(
      eqCalls.some(
        (call) => call.column === "business_id" && call.value === "biz-1",
      ),
    ).toBe(true);
    expect(createBookingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "appointment.cancelled",
        businessId: "biz-1",
        appointmentId: "appt-1",
        channel: "staff",
      }),
    );
    expect(result.events).toEqual([
      expect.objectContaining({ type: "appointment.cancelled" }),
    ]);
    expect(logAppointmentChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "cancel",
        businessId: "biz-1",
        appointmentId: "appt-1",
        beforeState: expect.objectContaining({
          status: "confirmed",
          start_time: "2026-09-17T13:00:00+00:00",
          end_time: "2026-09-17T13:30:00+00:00",
        }),
        afterState: expect.objectContaining({ status: "cancelled" }),
      }),
    );
  });

  it("returns success without write, audit, or event when already cancelled", async () => {
    existingRow = {
      id: "appt-1",
      status: "cancelled",
      start_time: "2026-09-17T13:00:00+00:00",
      end_time: "2026-09-17T13:30:00+00:00",
    };

    const result = await cancelBooking(intent());

    expect(result.phase).toBe("success");
    expect(result.data?.appointmentId).toBe("appt-1");
    expect(result.events).toBeUndefined();
    expect(updateRows).toEqual([]);
    expect(logAppointmentChange).not.toHaveBeenCalled();
    expect(createBookingEvent).not.toHaveBeenCalled();
    expect(emitBookingEvent).not.toHaveBeenCalled();
  });
});
