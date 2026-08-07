import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  confirmButtonLabel,
  defaultBookingPaymentDraft,
} from "@/components/booking/booking-payment-section";
import {
  bookingStageVisualState,
  bookingWorkflowStatus,
  isAppointmentStageReady,
} from "@/components/booking-sheet/booking-workflow";

describe("Booking progressive workflow helpers", () => {
  it("only marks the active stage as active", () => {
    expect(
      bookingStageVisualState("time", "time", {
        customer: true,
        appointment: true,
      }),
    ).toBe("active");
    expect(
      bookingStageVisualState("customer", "time", { customer: true }),
    ).toBe("complete");
    expect(
      bookingStageVisualState("payment", "time", {
        customer: true,
        appointment: true,
      }),
    ).toBe("upcoming");
    expect(
      bookingStageVisualState("confirm", "time", {
        customer: true,
        appointment: true,
      }),
    ).toBe("locked");
  });

  it("advances appointment readiness only when service, location, date, and employee are valid", () => {
    expect(
      isAppointmentStageReady({
        serviceId: "s1",
        locationId: "l1",
        date: "2026-08-08",
        needsNamedEmployee: false,
      }),
    ).toBe(true);
    expect(
      isAppointmentStageReady({
        serviceId: "s1",
        locationId: "l1",
        date: "2026-08-08",
        needsNamedEmployee: true,
      }),
    ).toBe(false);
  });

  it("exposes footer status copy for each stage", () => {
    expect(
      bookingWorkflowStatus({
        step: "time",
        canSubmit: false,
        hasCustomer: true,
        appointmentReady: true,
        hasTime: false,
      }),
    ).toBe("Choose a time");
    expect(
      bookingWorkflowStatus({
        step: "payment",
        canSubmit: false,
        hasCustomer: true,
        appointmentReady: true,
        hasTime: true,
      }),
    ).toBe("Choose payment");
    expect(
      bookingWorkflowStatus({
        step: "confirm",
        canSubmit: true,
        hasCustomer: true,
        appointmentReady: true,
        hasTime: true,
      }),
    ).toBe("Ready to book");
  });
});

describe("Booking workspace UX contract — progressive stages", () => {
  const root = process.cwd();

  it("does not expose Narrow/Standard/Wide to booking users", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("showWidthControls={false}");
    expect(booking).not.toMatch(/showWidthControls=\{true\}/);
  });

  it("uses true progressive stages instead of one vertical create form", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("workflowStep");
    expect(booking).toContain("<BookingStage");
    expect(booking).toContain('title="Customer"');
    expect(booking).toContain('title="Appointment"');
    expect(booking).toContain('title="Time"');
    expect(booking).toContain('title="Payment"');
    expect(booking).toContain('title="Confirm"');
    expect(booking).toContain("BookingConfirmStep");
    expect(booking).toContain('setWorkflowStep("appointment")');
    expect(booking).toContain('setWorkflowStep("payment")');
    expect(booking).toContain('setWorkflowStep("confirm")');
  });

  it("keeps time grid always expanded in workspace mode", () => {
    const avail = readFileSync(
      join(root, "components/booking-sheet/availability-section.tsx"),
      "utf8",
    );
    const selector = readFileSync(
      join(root, "components/scheduling/available-time-selector.tsx"),
      "utf8",
    );
    expect(avail).toContain("workspaceMode");
    expect(avail).toContain("alwaysExpanded={workspaceMode}");
    expect(selector).toContain("alwaysExpanded");
  });

  it("uses one payment decision card and no create-path Balance section", () => {
    const payment = readFileSync(
      join(root, "components/booking/booking-payment-section.tsx"),
      "utf8",
    );
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(payment).toContain('variant = "decision"');
    expect(payment).toContain("Appointment total");
    expect(payment).toContain("Balance after confirmation");
    expect(payment).toContain("Send payment receipt email");
    expect(booking).toContain('variant="decision"');
    expect(booking).toContain("includeFormFields={false}");
    expect(booking).toContain('name="payment_mode"');
    expect(booking).toContain('name="payment_amount_cents"');
    // PaymentsSection / Balance only on edit path
    const createBranch = booking.slice(
      booking.indexOf("{!isEditing ? ("),
      booking.indexOf(") : ("),
    );
    expect(createBranch).not.toContain("<PaymentsSection");
    expect(createBranch).not.toContain("BookingReviewCard");
  });

  it("sticky footer persists with Continue then Confirm", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("footerStatus");
    expect(booking).toContain("Continue");
    expect(booking).toContain('workflowStep === "payment"');
    expect(booking).toContain('workflowStep !== "confirm"');
    expect(confirmButtonLabel("none", 0, "cad")).toBe("Confirm appointment");
    expect(confirmButtonLabel("deposit", 5000, "cad")).toMatch(
      /Confirm & record/,
    );
    expect(defaultBookingPaymentDraft(5000).mode).toBe("none");
  });

  it("keeps Summer secondary on create and timeline on edit", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("SummerAssistant");
    expect(booking).toContain("TimelineSection");
    // Timeline only after the edit branch marker in create/edit split
    const timelineAt = booking.lastIndexOf("<TimelineSection");
    const editMarker = booking.lastIndexOf("<>\n            <CustomerSection");
    expect(timelineAt).toBeGreaterThan(editMarker);
    expect(booking).toContain('workspaceMode');
  });
});
