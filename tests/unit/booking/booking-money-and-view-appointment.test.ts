import { describe, expect, it } from "vitest";
import {
  formatMoneyAmountDraft,
  isAllowedMoneyAmountDraft,
  normalizeMoneyAmountDraft,
  parseMoneyAmountDraft,
} from "@/lib/commerce/money-amount-input";
import { resolveBookingFinancials } from "@/lib/commerce/booking-financials";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Money amount draft helpers", () => {
  it("formats cents to two-decimal draft", () => {
    expect(formatMoneyAmountDraft(5000)).toBe("50.00");
    expect(formatMoneyAmountDraft(19097)).toBe("190.97");
  });

  it("allows temporary empty and partial decimal drafts", () => {
    expect(isAllowedMoneyAmountDraft("")).toBe(true);
    expect(isAllowedMoneyAmountDraft("5")).toBe(true);
    expect(isAllowedMoneyAmountDraft("50")).toBe(true);
    expect(isAllowedMoneyAmountDraft("50.")).toBe(true);
    expect(isAllowedMoneyAmountDraft("50.5")).toBe(true);
    expect(isAllowedMoneyAmountDraft("50.50")).toBe(true);
    expect(isAllowedMoneyAmountDraft("50.505")).toBe(false);
    expect(isAllowedMoneyAmountDraft("-5")).toBe(false);
    expect(isAllowedMoneyAmountDraft("abc")).toBe(false);
  });

  it("parses drafts without forcing empty to zero until normalize", () => {
    expect(parseMoneyAmountDraft("")).toBeNull();
    expect(parseMoneyAmountDraft(".")).toBeNull();
    expect(parseMoneyAmountDraft("75")).toBe(7500);
    expect(parseMoneyAmountDraft("50.5")).toBe(5050);
    expect(parseMoneyAmountDraft("50.50")).toBe(5050);
  });

  it("normalizes empty to zero on blur/commit without restoring a prior default", () => {
    expect(normalizeMoneyAmountDraft("", 5000)).toEqual({
      cents: 0,
      display: "0.00",
    });
    expect(normalizeMoneyAmountDraft("75", 5000)).toEqual({
      cents: 7500,
      display: "75.00",
    });
    expect(normalizeMoneyAmountDraft("60", 5000)).toEqual({
      cents: 6000,
      display: "60.00",
    });
  });
});

describe("Payment projection from edited amount", () => {
  it("recalculates remaining balance from payment today via resolveBookingFinancials", () => {
    const withToday = resolveBookingFinancials({
      catalogPriceCents: 19097,
      taxInclusive: true,
      taxCents: 0,
      depositRequiredCents: 5000,
      depositRequired: true,
      paymentTodayCents: 7500,
      currency: "cad",
    });
    expect(withToday.appointmentTotalCents).toBe(19097);
    expect(withToday.remainingBalanceCents).toBe(11597);
    expect(withToday.formatted.remainingBalance).toMatch(/115\.97/);
  });
});

describe("Booking payment amount input contract", () => {
  const root = process.cwd();

  it("uses MoneyAmountInput draft-on-focus instead of number+toFixed fighting", () => {
    const payment = readFileSync(
      join(root, "components/booking/booking-payment-section.tsx"),
      "utf8",
    );
    expect(payment).toContain("MoneyAmountInput");
    expect(payment).not.toContain('type="number"');
    expect(payment).not.toContain("toFixed(2)");
  });

  it("MoneyAmountInput allows temporary empty and select-all replace patterns", () => {
    const input = readFileSync(
      join(root, "components/ui/money-amount-input.tsx"),
      "utf8",
    );
    expect(input).toContain('type="text"');
    expect(input).toContain('inputMode="decimal"');
    expect(input).toContain("selectAllOnFirstFocus");
    expect(input).toContain("Temporary empty");
    expect(input).toContain("preventDefault");
  });
});

describe("View Appointment post-booking navigation", () => {
  const root = process.cwd();

  it("retains created appointment ID in success info", () => {
    const success = readFileSync(
      join(root, "components/booking-sheet/booking-success-state.tsx"),
      "utf8",
    );
    expect(success).toContain("appointmentId");
    expect(success).toContain("onViewAppointment(info.appointmentId)");
    expect(success).toContain("Book another");
    expect(success).toContain("Done");
    expect(success).toContain("Retry opening appointment");
  });

  it("BookingSheet wires View Appointment through onViewCreatedAppointment", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain("onViewCreatedAppointment");
    expect(booking).not.toContain(
      "window.location.href = `/dashboard/calendar?appointment=${id}`",
    );
    expect(booking).toContain("onBookAnother");
    expect(booking).toContain("onDone={onClose}");
  });

  it("Calendar opens created appointment via existing management workspace", () => {
    const calendar = readFileSync(
      join(root, "components/calendar/calendar-client.tsx"),
      "utf8",
    );
    expect(calendar).toContain("onViewCreatedAppointment={openCreatedAppointment}");
    expect(calendar).toContain("getCrmAppointmentForBooking");
    expect(calendar).toContain("openEdit(appt)");
  });
});
