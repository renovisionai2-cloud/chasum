import { describe, expect, it } from "vitest";
import {
  resolveBookingFinancials,
  resolveDepositDueNowCents,
} from "@/lib/commerce/booking-financials";
import { resolveEditBookingPaymentSummary } from "@/lib/commerce/edit-booking-payment-summary";

describe("deposit due now", () => {
  it("fully paid fixed deposit → deposit due now $0", () => {
    const due = resolveDepositDueNowCents({
      depositRequiredCents: 5000,
      netPaidCents: 5000,
    });
    expect(due.amountPaidTowardDepositCents).toBe(5000);
    expect(due.depositDueNowCents).toBe(0);

    const f = resolveBookingFinancials({
      catalogPriceCents: 22000,
      taxInclusive: false,
      taxRates: [
        {
          id: "hst",
          name: "HST",
          rate_bps: 1300,
          inclusive: false,
          is_default: true,
          is_active: true,
        },
      ],
      depositRequiredCents: 5000,
      paidToDateCents: 5000,
      paymentTodayCents: 0,
    });
    expect(f.subtotalCents).toBe(22000);
    expect(f.taxCents).toBe(2860);
    expect(f.appointmentTotalCents).toBe(24860);
    expect(f.depositRequiredCents).toBe(5000);
    expect(f.depositDueNowCents).toBe(0);
    expect(f.paidToDateCents).toBe(5000);
    expect(f.remainingBalanceCents).toBe(19860);
    expect(f.paymentStatus).toBe("deposit_paid");
  });

  it("partially paid deposit → deposit due now $30", () => {
    const due = resolveDepositDueNowCents({
      depositRequiredCents: 5000,
      netPaidCents: 2000,
    });
    expect(due.depositDueNowCents).toBe(3000);
  });

  it("no payment → deposit due now $50", () => {
    const due = resolveDepositDueNowCents({
      depositRequiredCents: 5000,
      netPaidCents: 0,
    });
    expect(due.depositDueNowCents).toBe(5000);
  });

  it("edit booking summary keeps already paid and zero deposit due", () => {
    const summary = resolveEditBookingPaymentSummary({
      appointmentTotalCents: 24860,
      alreadyPaidCents: 5000,
      paymentTodayCents: 0,
      depositRequiredCents: 5000,
      paymentStatus: "deposit_paid",
    });
    expect(summary.depositDueNowCents).toBe(0);
    expect(summary.alreadyPaidCents).toBe(5000);
    expect(summary.remainingBalanceCents).toBe(19860);
    expect(summary.depositStatusLabel).toBe("Deposit paid");
  });
});
