import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { firstMissingDecision, bookingFactsFromValues } from "@/components/booking-sheet/booking-workflow";
import {
  BOOKING_SHEET_MANAGEMENT_MAX_PX,
} from "@/components/ui/sheet";

describe("Existing appointment expandable management workspace", () => {
  const root = process.cwd();

  it("exposes Expand only for existing appointments (not New Appointment)", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("AppointmentExpandToggle");
    expect(booking).toContain("{isEditing ? (");
    expect(booking).toContain("managementExpanded");
    expect(booking).toContain('widthMode={');
    expect(booking).toContain('"management"');
    // Expand toggle gated to edit
    expect(booking).toMatch(/isEditing \? \(\s*<AppointmentExpandToggle/);
  });

  it("uses a materially wider management width mode on Sheet", () => {
    const sheet = readFileSync(join(root, "components/ui/sheet.tsx"), "utf8");
    expect(sheet).toContain("BOOKING_SHEET_MANAGEMENT_MAX_PX");
    expect(sheet).toContain('widthMode === "management"');
    expect(BOOKING_SHEET_MANAGEMENT_MAX_PX).toBeGreaterThanOrEqual(1100);
    expect(sheet).not.toMatch(/showWidthControls=\{true\}/);
  });

  it("expanded mode uses multi-column layout", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.9fr)]");
    expect(booking).toContain("AppointmentManagementActions");
    expect(booking).toContain("AppointmentCustomerContext");
  });

  it("keeps sticky management actions and wired collect/reschedule", () => {
    const actions = readFileSync(
      join(root, "components/booking-sheet/appointment-management-actions.tsx"),
      "utf8",
    );
    const toggle = readFileSync(
      join(root, "components/booking-sheet/appointment-expand-toggle.tsx"),
      "utf8",
    );
    expect(actions).toContain("Reschedule");
    expect(actions).toContain("Collect");
    expect(actions).toContain("Message");
    expect(toggle).toContain("aria-expanded");
    expect(toggle).toContain("Expand appointment");
    expect(toggle).toContain("hidden min-h-10");
    expect(toggle).toContain("md:inline-flex");
  });

  it("does not reintroduce Narrow/Standard/Wide to users", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("showWidthControls={false}");
  });
});

describe("Adaptive New Appointment regression (protected)", () => {
  it("still asks only for missing decisions", () => {
    expect(
      firstMissingDecision(
        bookingFactsFromValues({
          customerId: "c1",
          serviceId: "",
          needsNamedEmployee: true,
          date: "",
          slot: null,
          slotValid: false,
          paymentAcknowledged: false,
          success: false,
        }),
      ),
    ).toBe("service");
  });

  it("create path still uses adaptive workspace chrome", () => {
    const booking = readFileSync(
      join(process.cwd(), "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("firstMissingDecision");
    expect(booking).toContain("BookingSummaryStrip");
    expect(booking).toContain("BookingDatetimePanel");
    expect(booking).toContain("BookingSuccessState");
  });
});
