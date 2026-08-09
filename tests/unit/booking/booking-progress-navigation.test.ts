import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bookingDecisionAccess,
  firstMissingDecision,
} from "@/components/booking-sheet/booking-workflow";

const baseFacts = {
  customerId: null as string | null,
  serviceId: "",
  needsNamedEmployee: true,
  date: "2026-08-08",
  slot: null as string | null,
  slotValid: false,
  paymentAcknowledged: false,
  success: false,
};

describe("bookingDecisionAccess — progress navigation", () => {
  it("allows revisiting a prefilled Service without a customer yet", () => {
    const facts = {
      ...baseFacts,
      serviceId: "svc-premium",
      needsNamedEmployee: false,
      date: "2026-08-07",
      slot: "2026-08-07T15:00:00.000Z",
      slotValid: true,
    };
    expect(firstMissingDecision(facts)).toBe("customer");
    expect(bookingDecisionAccess("service", facts).accessible).toBe(true);
    expect(bookingDecisionAccess("employee", facts).accessible).toBe(true);
    expect(bookingDecisionAccess("datetime", facts).accessible).toBe(true);
    expect(bookingDecisionAccess("customer", facts).accessible).toBe(true);
  });

  it("keeps Payment and Review disabled until prerequisites exist", () => {
    const facts = {
      ...baseFacts,
      serviceId: "svc-1",
      needsNamedEmployee: false,
    };
    expect(bookingDecisionAccess("payment", facts)).toEqual({
      accessible: false,
      reason: "Choose a time first",
    });
    expect(bookingDecisionAccess("review", facts).accessible).toBe(false);
    expect(bookingDecisionAccess("review", facts).reason).toMatch(/payment/i);
  });

  it("opens Payment when a valid time exists", () => {
    const facts = {
      ...baseFacts,
      customerId: "c1",
      serviceId: "s1",
      needsNamedEmployee: false,
      slot: "2026-08-08T13:00:00.000Z",
      slotValid: true,
    };
    expect(bookingDecisionAccess("payment", facts).accessible).toBe(true);
    expect(bookingDecisionAccess("review", facts).accessible).toBe(false);
  });

  it("opens Review only after payment is acknowledged with a complete booking", () => {
    const facts = {
      ...baseFacts,
      customerId: "c1",
      serviceId: "s1",
      needsNamedEmployee: false,
      slot: "2026-08-08T13:00:00.000Z",
      slotValid: true,
      paymentAcknowledged: true,
    };
    expect(bookingDecisionAccess("review", facts).accessible).toBe(true);
  });

  it("blocks Employee and Date & time until service is known", () => {
    expect(bookingDecisionAccess("employee", baseFacts)).toEqual({
      accessible: false,
      reason: "Choose a service first",
    });
    expect(bookingDecisionAccess("datetime", baseFacts).reason).toMatch(
      /service/i,
    );
  });
});

describe("Booking progress + Book another contract", () => {
  const root = process.cwd();

  it("progress stages are real buttons with aria-current and disabled semantics", () => {
    const progress = readFileSync(
      join(root, "components/booking-sheet/booking-progress.tsx"),
      "utf8",
    );
    expect(progress).toContain('type="button"');
    expect(progress).toContain("onNavigate");
    expect(progress).toContain("bookingDecisionAccess");
    expect(progress).toContain('aria-current={isActive ? "step"');
    expect(progress).toContain("disabled={disabled}");
    expect(progress).toContain("cursor-not-allowed");
    expect(progress).not.toMatch(/<span[^>]*onClick/);
  });

  it("Book another suppresses success re-hydration and resets fresh booking state", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("suppressedSuccessAppointmentId");
    expect(booking).toContain("onBookAnother");
    expect(booking).toContain("setSuccessInfo(null)");
    expect(booking).toContain('setServiceId("")');
    expect(booking).toContain("setSelectedCustomer(null)");
    expect(booking).toContain("setPaymentAcknowledged(false)");
    expect(booking).toContain("defaultBookingPaymentDraft()");
    expect(booking).toContain("navigateToDecision");
    expect(booking).toContain("onViewCreatedAppointment");
    expect(booking).toContain("onDone={onClose}");
  });

  it("does not close the workspace on Book another", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    const start = booking.indexOf("onBookAnother={() => {");
    const end = booking.indexOf("onDone={onClose}", start);
    const block = booking.slice(start, end);
    expect(block).not.toContain("onClose()");
    expect(block).toContain("suppressedSuccessAppointmentId.current");
  });
});
