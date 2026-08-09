import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  confirmButtonLabel,
  defaultBookingPaymentDraft,
} from "@/components/booking/booking-payment-section";
import {
  firstMissingDecision,
  previousDecision,
  bookingFooterStatus,
} from "@/components/booking-sheet/booking-workflow";

describe("Adaptive booking decisions", () => {
  it("skips known customer and asks for service next", () => {
    expect(
      firstMissingDecision({
        customerId: "c1",
        serviceId: "",
        needsNamedEmployee: true,
        date: "2026-08-08",
        slot: null,
        slotValid: false,
        paymentAcknowledged: false,
        success: false,
      }),
    ).toBe("service");
  });

  it("skips datetime when slot already known from calendar context", () => {
    expect(
      firstMissingDecision({
        customerId: "c1",
        serviceId: "s1",
        needsNamedEmployee: false,
        date: "2026-08-08",
        slot: "2026-08-08T13:30:00.000Z",
        slotValid: true,
        paymentAcknowledged: false,
        success: false,
      }),
    ).toBe("payment");
  });

  it("requires employee when named staff is mandatory", () => {
    expect(
      firstMissingDecision({
        customerId: "c1",
        serviceId: "s1",
        needsNamedEmployee: true,
        date: "2026-08-08",
        slot: null,
        slotValid: false,
        paymentAcknowledged: false,
        success: false,
      }),
    ).toBe("employee");
  });

  it("reaches review only after payment is acknowledged", () => {
    expect(
      firstMissingDecision({
        customerId: "c1",
        serviceId: "s1",
        needsNamedEmployee: false,
        date: "2026-08-08",
        slot: "2026-08-08T13:30:00.000Z",
        slotValid: true,
        paymentAcknowledged: true,
        success: false,
      }),
    ).toBe("review");
  });

  it("supports Back to a prior decision", () => {
    expect(
      previousDecision("payment", {
        customerId: "c1",
        serviceId: "s1",
        needsNamedEmployee: false,
        date: "2026-08-08",
        slot: "2026-08-08T13:30:00.000Z",
        slotValid: true,
        paymentAcknowledged: false,
        success: false,
      }),
    ).toBe("datetime");
  });

  it("exposes footer status for the active decision", () => {
    expect(bookingFooterStatus("datetime")).toBe("Choose a date and time");
    expect(bookingFooterStatus("review")).toBe("Ready to book");
  });
});

describe("Adaptive booking workspace contract", () => {
  const root = process.cwd();

  it("does not expose Narrow/Standard/Wide", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("showWidthControls={false}");
  });

  it("uses one active decision and summary strip — not stage cards", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("firstMissingDecision");
    expect(booking).toContain("BookingSummaryStrip");
    expect(booking).toContain("BookingDecisionFrame");
    expect(booking).toContain("BookingDatetimePanel");
    expect(booking).toContain("BookingSuccessState");
    expect(booking).toContain("BookingMoreOptions");
    expect(booking).not.toContain("<BookingStage");
  });

  it("unifies date and time and expands the time grid", () => {
    const panel = readFileSync(
      join(root, "components/booking-sheet/booking-datetime-panel.tsx"),
      "utf8",
    );
    expect(panel).toContain("DateField");
    expect(panel).toContain("workspaceMode");
    expect(panel).toContain("AvailabilitySection");
    expect(panel).toContain("onAfterSelect");
  });

  it("keeps payment as one checkout card with footer field wiring", () => {
    const payment = readFileSync(
      join(root, "components/booking/booking-payment-section.tsx"),
      "utf8",
    );
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(payment).toContain("Appointment total");
    expect(payment).toContain("Balance after confirmation");
    expect(booking).toContain('name="payment_mode"');
    expect(booking).toContain('name="payment_amount_cents"');
    expect(booking).toContain("includeFormFields={false}");
    expect(confirmButtonLabel("deposit", 5000, "cad")).toMatch(
      /Confirm & record/,
    );
    expect(defaultBookingPaymentDraft(5000).mode).toBe("none");
  });

  it("does not fake Any professional or waitlist in employee UI", () => {
    const employee = readFileSync(
      join(root, "components/booking-sheet/booking-employee-decision.tsx"),
      "utf8",
    );
    expect(employee).toContain("ASSIGN_LATER_COMING_SOON_LABEL");
    expect(employee).not.toContain("Add to waitlist");
    // Coming-soon note stays truthful and compact — no fake selectable “any pro”.
    expect(employee).not.toMatch(/onClick=\{.*any available/i);
  });

  it("keeps More options and silent hints secondary", () => {
    const more = readFileSync(
      join(root, "components/booking-sheet/booking-more-options.tsx"),
      "utf8",
    );
    const hints = readFileSync(
      join(root, "components/booking-sheet/booking-silent-hints.tsx"),
      "utf8",
    );
    expect(more).toContain("More options");
    expect(hints).toContain("Booking context");
  });

  it("does not invent a catalog service on blank create", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain(
      "do not silently invent a service from the catalog",
    );
  });
});
