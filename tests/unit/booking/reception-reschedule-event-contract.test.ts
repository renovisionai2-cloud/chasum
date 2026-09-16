import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Reception edit path reuses Booking Engine reschedule communications", () => {
  it("keeps Booking Sheet edits on updateAppointment, not a parallel writer", () => {
    const src = source("components/booking-sheet/booking-sheet.tsx");
    expect(src).toContain("isEditing ? updateAppointment : createAppointment");
    expect(src).not.toContain("rescheduleAppointment");
    expect(src).not.toContain("handleAppointmentEvent");
  });

  it("keeps updateAppointment on updateBooking with tenant-scoped ids", () => {
    const src = source("lib/actions/appointments.ts");
    expect(src).toContain("await updateBooking({");
    expect(src).toContain("appointmentId: id");
    expect(src).toContain("businessId: business.id");
    expect(src).not.toContain("handleAppointmentEvent");
    expect(src.match(/await updateBooking\(\{/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it("classifies a real start- or end-time range change as appointment.rescheduled", () => {
    const src = source("lib/booking-engine/mutations/update.ts");
    expect(src).toContain("scheduledRangeChanged");
    expect(src).toContain('"appointment.rescheduled"');
    expect(src).toContain("previousStartTime");
    expect(src).toContain("previousEndTime");
    expect(src).toContain('"appointment.updated"');
    expect(src).toContain('"appointment.completed"');
    expect(src).toContain('"appointment.no_show"');
    expect(src).toContain('"appointment.cancelled"');
  });

  it("leaves dedicated rescheduleBooking and the communications bridge intact", () => {
    const reschedule = source("lib/booking-engine/mutations/reschedule.ts");
    expect(reschedule).toContain('type: "appointment.rescheduled"');
    expect(reschedule).toContain("previousStartTime");
    expect(reschedule).toContain("previousEndTime");

    const bridge = source("lib/communications/events/booking-bridge.ts");
    expect(bridge).toContain('case "appointment.rescheduled"');
    expect(bridge).toContain('mapped = "rescheduled"');

    const orchestrator = source(
      "lib/integrations/notifications/orchestrator.ts",
    );
    expect(orchestrator).toContain('rescheduled: "appointment.reschedule"');
    expect(orchestrator).toContain('rescheduled: "appointment.rescheduled"');
  });
});
