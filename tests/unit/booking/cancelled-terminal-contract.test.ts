import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("cancelled appointment terminal source guards", () => {
  it("updateBooking inspects existing status before requested status", () => {
    const src = source("lib/booking-engine/mutations/update.ts");
    expect(src).toContain('existing.status === "cancelled"');
    expect(src).toContain("Cancelled appointments are terminal.");
    expect(src).toContain("Use Cancel appointment to cancel this appointment.");
    expect(src).not.toMatch(
      /if \(status !== "cancelled"\) \{\s*const validation = await validateBooking/,
    );
  });

  it("Booking Sheet derives cancelled notes-only mode from the appointment record", () => {
    const src = source("components/booking-sheet/booking-sheet.tsx");
    expect(src).toContain("isCancelled");
    expect(src).toContain('appointment?.status === "cancelled"');
    expect(src).toContain("Save notes");
    expect(src).toContain("terminalCancelled");
    expect(src).toContain("if (isCancelled)");
    expect(src).toContain("previewBookingSheetAvailability");
    expect(src).toMatch(
      /const canSubmit = isCancelled\s*\n\s*\? !!selectedCustomer\?\.id/,
    );
  });

  it("Quick Actions hide lifecycle mutations on cancelled appointments", () => {
    const src = source("components/booking-sheet/quick-actions-menu.tsx");
    expect(src).toContain("terminalCancelled");
    expect(src).toContain("show: isEditing && !terminalCancelled");
    expect(src).toContain("show: isEditing && canCancel");
  });

  it("generic Booking Sheet status options do not include Cancelled for active appointments", () => {
    const src = source("components/booking-sheet/appointment-section.tsx");
    expect(src).toContain('value !== "cancelled"');
  });

  it("API PATCH rejects cancelled reactivation", () => {
    const src = source("app/api/v1/appointments/[id]/route.ts");
    expect(src).toContain('current.status === "cancelled"');
    expect(src).toContain("Cancelled appointments are terminal.");
  });
});
