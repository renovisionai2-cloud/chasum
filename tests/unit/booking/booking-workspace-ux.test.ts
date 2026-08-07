import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  confirmButtonLabel,
  defaultBookingPaymentDraft,
} from "@/components/booking/booking-payment-section";

describe("Booking workspace UX contract", () => {
  const root = process.cwd();

  it("does not expose Narrow/Standard/Wide to booking users", () => {
    const sheet = readFileSync(join(root, "components/ui/sheet.tsx"), "utf8");
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(sheet).toContain("showWidthControls");
    expect(booking).toContain("showWidthControls={false}");
    expect(booking).not.toMatch(/showWidthControls=\{true\}/);
  });

  it("places available time immediately after appointment date section", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    const body = booking.slice(booking.lastIndexOf("return ("));
    const appt = body.indexOf("<AppointmentSection");
    const avail = body.indexOf("<AvailabilitySection");
    const payment = body.indexOf("<BookingPaymentSection");
    expect(appt).toBeGreaterThan(-1);
    expect(avail).toBeGreaterThan(appt);
    expect(payment).toBeGreaterThan(avail);
  });

  it("collapses notes, duration override, and omits mid-flow price card", () => {
    const appointment = readFileSync(
      join(root, "components/booking-sheet/appointment-section.tsx"),
      "utf8",
    );
    expect(appointment).toContain("+ Add note");
    expect(appointment).toContain("Edit duration");
    expect(appointment).not.toContain("BookingPriceSummary");
  });

  it("collapses customer search after selection and history by default", () => {
    const customer = readFileSync(
      join(root, "components/booking-sheet/customer-section.tsx"),
      "utf8",
    );
    expect(customer).toContain("selected ? null");
    expect(customer).toContain("View history");
  });

  it("keeps timeline and Summer secondary", () => {
    const timeline = readFileSync(
      join(root, "components/booking-sheet/timeline-section.tsx"),
      "utf8",
    );
    const summer = readFileSync(
      join(root, "components/booking-sheet/summer-assistant.tsx"),
      "utf8",
    );
    expect(timeline).toContain("View customer history");
    expect(summer).toContain("Ask Summer");
  });

  it("uses one primary payment summary with projected balance language", () => {
    const payment = readFileSync(
      join(root, "components/booking/booking-payment-section.tsx"),
      "utf8",
    );
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(payment).toContain("Balance after confirmation");
    expect(payment).toContain("Payment being recorded");
    expect(payment).not.toMatch(/Balance after booking/);
    expect(booking).toContain("isEditing ? (");
    expect(booking).toContain("<PaymentsSection");
    expect(booking).not.toContain("BookingReviewCard");
  });

  it("preserves payment form field names for createAppointment", () => {
    const payment = readFileSync(
      join(root, "components/booking/booking-payment-section.tsx"),
      "utf8",
    );
    expect(payment).toContain('name="payment_mode"');
    expect(payment).toContain('name="payment_amount_cents"');
    expect(payment).toContain('name="payment_send_receipt"');
  });

  it("sticky footer uses ready/continue and confirm wording", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("Ready to book");
    expect(booking).toContain("Choose a time to continue");
    expect(booking).toContain("Cancel");
    expect(confirmButtonLabel("none", 0, "cad")).toBe("Confirm appointment");
    expect(confirmButtonLabel("deposit", 5000, "cad")).toMatch(/Confirm & record/);
    expect(defaultBookingPaymentDraft(5000).mode).toBe("none");
  });
});
