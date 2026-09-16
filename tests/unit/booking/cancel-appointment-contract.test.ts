import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("cancellation confirmation and waitlist idempotency source guards", () => {
  it("Booking Sheet opens a confirmation dialog instead of cancelling immediately", () => {
    const src = source("components/booking-sheet/booking-sheet.tsx");
    expect(src).toContain("CancelAppointmentDialog");
    expect(src).toContain("setCancelConfirmOpen(true)");
    expect(src).toContain("canCancel={canCancel}");
    expect(src).toContain('appointment?.status !== "cancelled"');
    expect(src).toContain("confirmCancelAppointment");
    expect(src).not.toMatch(
      /onCancel=\{\(\) => \{\s*if \(!appointment\) return;\s*startBusy\(async \(\) => \{\s*const result = await cancelAppointment/,
    );
  });

  it("Quick Actions Cancel is gated on canCancel", () => {
    const src = source("components/booking-sheet/quick-actions-menu.tsx");
    expect(src).toContain("canCancel");
    expect(src).toContain("show: isEditing && canCancel");
  });

  it("cancelAppointment enqueues waitlist only when appointment.cancelled is in result.events", () => {
    const src = source("lib/actions/appointments.ts");
    expect(src).toContain("cancellationOccurred");
    expect(src).toContain('event.type === "appointment.cancelled"');
    expect(src).toContain("enqueueWaitlistNotification(business.id, id)");
    expect(src).not.toMatch(
      /if \(result\.phase === "success"\) \{\s*await enqueueWaitlistNotification/,
    );
  });
});
