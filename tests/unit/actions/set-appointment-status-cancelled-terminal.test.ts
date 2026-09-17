// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateBooking, getOrCreateBusiness, revalidatePath } = vi.hoisted(
  () => ({
    updateBooking: vi.fn(),
    getOrCreateBusiness: vi.fn(),
    revalidatePath: vi.fn(),
  }),
);

let existingRow: Record<string, unknown> | null = {
  id: "appt-1",
  location_id: "loc-1",
  service_id: "svc-1",
  staff_id: "staff-1",
  customer_id: "cust-1",
  start_time: "2026-09-16T18:00:00+00:00",
  end_time: "2026-09-16T18:45:00+00:00",
  notes: null,
  status: "cancelled",
};

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
}));

vi.mock("@/lib/booking-engine", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/booking-engine")>();
  return {
    ...actual,
    updateBooking: (...args: unknown[]) => updateBooking(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from() {
      const query: Record<string, unknown> = {};
      const self = () => query;
      query.select = self;
      query.eq = self;
      query.maybeSingle = async () => ({ data: existingRow, error: null });
      return query;
    },
  }),
}));

import { setAppointmentStatus } from "@/lib/actions/appointments";

describe("setAppointmentStatus cancelled terminal defense", () => {
  beforeEach(() => {
    updateBooking.mockReset();
    revalidatePath.mockClear();
    getOrCreateBusiness.mockReset();
    getOrCreateBusiness.mockResolvedValue({ id: "biz-1" });
    existingRow = {
      id: "appt-1",
      location_id: "loc-1",
      service_id: "svc-1",
      staff_id: "staff-1",
      customer_id: "cust-1",
      start_time: "2026-09-16T18:00:00+00:00",
      end_time: "2026-09-16T18:45:00+00:00",
      notes: null,
      status: "cancelled",
    };
  });

  it.each(["arrived", "completed", "confirmed", "pending", "waiting", "in_progress", "no_show"] as const)(
    "rejects %s on an existing cancelled appointment without calling updateBooking",
    async (status) => {
      const result = await setAppointmentStatus("appt-1", status);

      expect(result.error).toMatch(/cancelled appointments are terminal/i);
      expect(updateBooking).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("does not use setAppointmentStatus as an alternate cancel path", async () => {
    existingRow = { ...existingRow, status: "confirmed" };

    const result = await setAppointmentStatus("appt-1", "cancelled");

    expect(result.error).toMatch(/use cancel appointment/i);
    expect(updateBooking).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
