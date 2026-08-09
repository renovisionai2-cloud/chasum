import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Chapter 4 Final Booking Interaction & Front-Desk Speed Pass", () => {
  const root = process.cwd();

  it("keeps the active decision dominant with compact customer search", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    const customer = readFileSync(
      join(root, "components/booking-sheet/customer-section.tsx"),
      "utf8",
    );
    expect(booking).toContain("BookingDecisionFrame");
    expect(booking).toContain("compact");
    expect(customer).toContain("compact = false");
    expect(customer).toContain("compact ? null");
  });

  it("uses shared primary selection chrome for payment modes", () => {
    const payment = readFileSync(
      join(root, "components/booking/booking-payment-section.tsx"),
      "utf8",
    );
    expect(payment).toContain("sm:grid-cols-2");
    expect(payment).toContain("border-primary bg-accent/30 ring-1 ring-primary/30");
    expect(payment).toContain("MoneyAmountInput");
  });

  it("advances after selection with a short confirmation beat", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("advanceAfterSelection");
    expect(booking).toContain("setTimeout(() => setFocusDecision(null), 120)");
  });

  it("time selection advances without a redundant Continue CTA", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("handleSlotSelect");
    expect(booking).toContain("advanceAfterSelection");
    // No dedicated Continue button gated on the datetime decision.
    expect(booking).not.toContain(
      'activeDecision === "datetime" ? (\n                <Button',
    );
    expect(booking).toContain('activeDecision === "payment"');
  });

  it("preserves progress navigation, Book another, and View Appointment", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("navigateToDecision");
    expect(booking).toContain("suppressedSuccessAppointmentId");
    expect(booking).toContain("onViewCreatedAppointment");
    expect(booking).toContain("onBookAnother");
    expect(booking).toContain("onDone={onClose}");
  });

  it("summary strip shows visible labels and progress stays single-row", () => {
    const strip = readFileSync(
      join(root, "components/booking-sheet/booking-summary-strip.tsx"),
      "utf8",
    );
    const progress = readFileSync(
      join(root, "components/booking-sheet/booking-progress.tsx"),
      "utf8",
    );
    expect(strip).toContain("uppercase tracking-wide");
    expect(strip).toContain("{chip.label}");
    expect(strip).not.toContain("sr-only");
    expect(progress).toContain("flex-nowrap");
    expect(progress).toContain("overflow-x-auto");
  });
});
