// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cancelBooking,
  enqueueWaitlistNotification,
  revalidatePath,
  getOrCreateBusiness,
} = vi.hoisted(() => ({
  cancelBooking: vi.fn(),
  enqueueWaitlistNotification: vi.fn().mockResolvedValue(undefined),
  revalidatePath: vi.fn(),
  getOrCreateBusiness: vi.fn(),
}));

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
}));

vi.mock("@/lib/booking-engine", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/booking-engine")>();
  return {
    ...actual,
    cancelBooking: (...args: unknown[]) => cancelBooking(...args),
  };
});

vi.mock("@/lib/integrations/automation/waitlist", () => ({
  enqueueWaitlistNotification: (...args: unknown[]) =>
    enqueueWaitlistNotification(...args),
  notifyWaitlistForSlot: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

import { cancelAppointment } from "@/lib/actions/appointments";

const cancelledEvent = {
  type: "appointment.cancelled" as const,
  businessId: "biz-1",
  appointmentId: "appt-1",
  channel: "staff" as const,
  occurredAt: "2026-09-16T23:02:21.000Z",
};

describe("cancelAppointment waitlist enqueue uses the cancellation event", () => {
  beforeEach(() => {
    cancelBooking.mockReset();
    enqueueWaitlistNotification.mockClear();
    revalidatePath.mockClear();
    getOrCreateBusiness.mockReset();
    getOrCreateBusiness.mockResolvedValue({ id: "biz-1" });
  });

  it("enqueues waitlist once and revalidates when appointment.cancelled is present", async () => {
    cancelBooking.mockResolvedValue({
      phase: "success",
      data: { appointmentId: "appt-1" },
      events: [cancelledEvent],
    });

    const result = await cancelAppointment("appt-1");

    expect(result.success).toBe("Appointment cancelled.");
    expect(cancelBooking).toHaveBeenCalledWith({
      channel: "staff",
      businessId: "biz-1",
      appointmentId: "appt-1",
    });
    expect(enqueueWaitlistNotification).toHaveBeenCalledTimes(1);
    expect(enqueueWaitlistNotification).toHaveBeenCalledWith("biz-1", "appt-1");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/calendar");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/clients");
  });

  it("does not enqueue waitlist on already-cancelled success with no event", async () => {
    cancelBooking.mockResolvedValue({
      phase: "success",
      data: { appointmentId: "appt-1" },
    });

    const result = await cancelAppointment("appt-1");

    expect(result.success).toBe("Appointment cancelled.");
    expect(enqueueWaitlistNotification).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("does not enqueue waitlist on rollback", async () => {
    cancelBooking.mockResolvedValue({
      phase: "rollback",
      error: "Appointment not found.",
    });

    const result = await cancelAppointment("appt-1");

    expect(result.error).toBe("Appointment not found.");
    expect(enqueueWaitlistNotification).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
