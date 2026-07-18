import { describe, expect, it } from "vitest";
import { deriveAppointmentPaymentStatus } from "@/lib/commerce/mappers";

describe("deriveAppointmentPaymentStatus", () => {
  it("marks unpaid when nothing paid", () => {
    expect(
      deriveAppointmentPaymentStatus({
        priceCents: 10_000,
        depositRequiredCents: 0,
        amountPaidCents: 0,
        amountRefundedCents: 0,
      }),
    ).toBe("unpaid");
  });

  it("tracks deposits", () => {
    expect(
      deriveAppointmentPaymentStatus({
        priceCents: 10_000,
        depositRequiredCents: 2_500,
        amountPaidCents: 0,
        amountRefundedCents: 0,
      }),
    ).toBe("deposit_required");

    expect(
      deriveAppointmentPaymentStatus({
        priceCents: 10_000,
        depositRequiredCents: 2_500,
        amountPaidCents: 2_500,
        amountRefundedCents: 0,
      }),
    ).toBe("deposit_paid");
  });

  it("handles full pay and refunds", () => {
    expect(
      deriveAppointmentPaymentStatus({
        priceCents: 10_000,
        depositRequiredCents: 0,
        amountPaidCents: 10_000,
        amountRefundedCents: 0,
      }),
    ).toBe("fully_paid");

    expect(
      deriveAppointmentPaymentStatus({
        priceCents: 10_000,
        depositRequiredCents: 0,
        amountPaidCents: 10_000,
        amountRefundedCents: 10_000,
      }),
    ).toBe("refunded");
  });

  it("voids when flagged", () => {
    expect(
      deriveAppointmentPaymentStatus({
        priceCents: 10_000,
        depositRequiredCents: 0,
        amountPaidCents: 5_000,
        amountRefundedCents: 0,
        voided: true,
      }),
    ).toBe("voided");
  });
});
