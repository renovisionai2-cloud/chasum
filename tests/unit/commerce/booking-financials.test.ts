import { describe, expect, it } from "vitest";
import {
  paymentKindForAmount,
  resolveBookingFinancials,
  resolveDepositRequiredCents,
  suggestPaymentTodayCents,
} from "@/lib/commerce/booking-financials";
import { renderEmailTemplate } from "@/lib/communications/templates";

describe("resolveBookingFinancials", () => {
  it("includes tax in appointment total and remaining balance", () => {
    const f = resolveBookingFinancials({
      subtotalCents: 23600,
      taxCents: 2715,
      depositRequiredCents: 5000,
      paymentTodayCents: 5000,
      currency: "usd",
    });
    expect(f.appointmentTotalCents).toBe(26315);
    expect(f.depositRequiredCents).toBe(5000);
    expect(f.paymentTodayCents).toBe(5000);
    expect(f.remainingBalanceCents).toBe(21315);
    expect(f.paymentStatus).toBe("deposit_paid");
  });

  it("treats unpaid deposit requirement as deposit_required", () => {
    const f = resolveBookingFinancials({
      subtotalCents: 23600,
      taxCents: 2715,
      depositRequiredCents: 5000,
      paymentTodayCents: 0,
    });
    expect(f.remainingBalanceCents).toBe(26315);
    expect(f.paymentStatus).toBe("deposit_required");
  });

  it("marks fully paid when payment covers tax-inclusive total", () => {
    const f = resolveBookingFinancials({
      subtotalCents: 23600,
      taxCents: 2715,
      paymentTodayCents: 26315,
    });
    expect(f.remainingBalanceCents).toBe(0);
    expect(f.paymentStatus).toBe("fully_paid");
  });

  it("does not treat subtotal alone as fully paid", () => {
    const f = resolveBookingFinancials({
      subtotalCents: 23600,
      taxCents: 2715,
      paymentTodayCents: 23600,
    });
    expect(f.remainingBalanceCents).toBe(2715);
    expect(f.paymentStatus).toBe("partially_paid");
  });
});

describe("deposit helpers", () => {
  it("uses explicit deposit cents", () => {
    expect(
      resolveDepositRequiredCents({
        depositCents: 5000,
        depositRequired: true,
        subtotalCents: 23600,
      }),
    ).toBe(5000);
  });

  it("falls back to 20% when required without cents", () => {
    expect(
      resolveDepositRequiredCents({
        depositCents: 0,
        depositRequired: true,
        subtotalCents: 10000,
      }),
    ).toBe(2000);
  });

  it("suggests payment today by mode", () => {
    const base = resolveBookingFinancials({
      subtotalCents: 23600,
      taxCents: 2715,
      depositRequiredCents: 5000,
    });
    expect(suggestPaymentTodayCents("none", base)).toBe(0);
    expect(suggestPaymentTodayCents("deposit", base)).toBe(5000);
    expect(suggestPaymentTodayCents("full", base)).toBe(26315);
    expect(suggestPaymentTodayCents("custom", base, 10000)).toBe(10000);
  });

  it("classifies payment kind", () => {
    expect(paymentKindForAmount(5000, 5000, 26315)).toBe("deposit");
    expect(paymentKindForAmount(26315, 5000, 26315)).toBe("payment");
    expect(paymentKindForAmount(10000, 5000, 26315)).toBe("payment");
  });
});

describe("confirmation email financial copy", () => {
  const baseCtx = {
    businessId: "b1",
    businessName: "GVM Baby World Ultrasound",
    customerName: "Darshan Dindial",
    staffName: "Bobita Singh",
    serviceName: "Elite Package",
    startTime: "2026-08-10T21:30:00.000Z",
    endTime: "2026-08-10T22:00:00.000Z",
    subtotalCents: 23600,
    taxCents: 2715,
    appointmentTotalCents: 26315,
    amountCents: 26315,
    depositRequiredCents: 5000,
    branding: {
      businessName: "GVM Baby World Ultrasound",
      supportEmail: "ops@example.com",
      supportPhone: "555-0100",
      showChasumBranding: false,
      chasumBrandingStyle: "none" as const,
    },
  };

  it("shows tax-inclusive total and unpaid deposit wording", () => {
    const rendered = renderEmailTemplate("appointment.confirmation", {
      ...baseCtx,
      depositPaidCents: 0,
      remainingBalanceCents: 26315,
    });
    expect(rendered.html).toContain("$263.15");
    expect(rendered.html).not.toMatch(/Appointment total[\s\S]*\$236\.00/);
    expect(rendered.html).toContain("No payment was recorded");
    expect(rendered.html).toContain("Email GVM Baby World Ultrasound");
    expect(rendered.html).toContain("mailto:ops@example.com");
  });

  it("shows deposit paid and remaining balance", () => {
    const rendered = renderEmailTemplate("appointment.confirmation", {
      ...baseCtx,
      depositPaidCents: 5000,
      remainingBalanceCents: 21315,
      paymentMethodLabel: "Cash",
    });
    expect(rendered.html).toContain("$50.00 deposit was received");
    expect(rendered.html).toContain("$213.15");
    expect(rendered.html).toContain("Cash");
  });

  it("business email shows deposit not paid clearly", () => {
    const rendered = renderEmailTemplate("appointment.business", {
      ...baseCtx,
      depositPaidCents: 0,
      remainingBalanceCents: 26315,
      paymentStatusLabel: "Deposit required",
    });
    expect(rendered.html).toContain("$263.15");
    expect(rendered.html).toContain("Not paid");
    expect(rendered.subject).toMatch(/New appointment booked — Elite Package/);
  });
});
