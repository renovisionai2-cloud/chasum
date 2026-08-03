import { describe, expect, it } from "vitest";
import {
  paymentKindForAmount,
  resolveBookingFinancials,
  resolveDepositRequiredCents,
  resolveFinancialsFromAppointment,
  suggestPaymentTodayCents,
} from "@/lib/commerce/booking-financials";
import { renderEmailTemplate } from "@/lib/communications/templates";
import {
  formatFromHeader,
  resolveTenantEmailBranding,
} from "@/lib/communications/tenant-email-branding";

describe("resolveBookingFinancials — tax inclusive catalog", () => {
  const inclusiveRates = [
    {
      id: "t1",
      name: "HST",
      rate_bps: 1300,
      inclusive: true,
      is_default: true,
      is_active: true,
    },
  ];

  it("extracts tax from inclusive $236 list price", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 23600,
      taxRates: inclusiveRates,
      depositRequiredCents: 5000,
      paymentTodayCents: 5000,
      currency: "usd",
    });
    expect(f.taxInclusive).toBe(true);
    expect(f.subtotalCents).toBe(20885);
    expect(f.taxCents).toBe(2715);
    expect(f.appointmentTotalCents).toBe(23600);
    expect(f.remainingBalanceCents).toBe(18600);
    expect(f.paymentStatus).toBe("deposit_paid");
  });

  it("shows unpaid deposit against inclusive total", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 23600,
      taxRates: inclusiveRates,
      depositRequiredCents: 5000,
    });
    expect(f.appointmentTotalCents).toBe(23600);
    expect(f.remainingBalanceCents).toBe(23600);
    expect(f.paymentStatus).toBe("deposit_required");
  });
});

describe("resolveBookingFinancials — tax exclusive catalog", () => {
  const exclusiveRates = [
    {
      id: "t1",
      name: "HST",
      rate_bps: 1300,
      inclusive: false,
      is_default: true,
      is_active: true,
    },
  ];

  it("adds tax on exclusive $236 list price", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 23600,
      taxRates: exclusiveRates,
      depositRequiredCents: 5000,
      paymentTodayCents: 5000,
    });
    expect(f.taxInclusive).toBe(false);
    expect(f.subtotalCents).toBe(23600);
    expect(f.taxCents).toBe(3068);
    expect(f.appointmentTotalCents).toBe(26668);
    expect(f.remainingBalanceCents).toBe(21668);
  });
});

describe("persisted appointment rebuild", () => {
  it("rebuilds from exclusive stamp + tax", () => {
    const f = resolveFinancialsFromAppointment({
      priceCents: 20885,
      taxCents: 2715,
      depositCents: 5000,
      amountPaidCents: 5000,
    });
    expect(f.appointmentTotalCents).toBe(23600);
    expect(f.remainingBalanceCents).toBe(18600);
  });
});

describe("deposit helpers", () => {
  it("uses explicit deposit cents", () => {
    expect(
      resolveDepositRequiredCents({
        depositCents: 5000,
        depositRequired: true,
        baseCents: 23600,
      }),
    ).toBe(5000);
  });

  it("falls back to 20% of appointment total", () => {
    expect(
      resolveDepositRequiredCents({
        depositCents: 0,
        depositRequired: true,
        baseCents: 10000,
      }),
    ).toBe(2000);
  });

  it("suggests payment today by mode", () => {
    const base = resolveBookingFinancials({
      catalogPriceCents: 23600,
      taxInclusive: true,
      taxCents: 2715,
      depositRequiredCents: 5000,
    });
    expect(suggestPaymentTodayCents("none", base)).toBe(0);
    expect(suggestPaymentTodayCents("deposit", base)).toBe(5000);
    expect(suggestPaymentTodayCents("full", base)).toBe(23600);
    expect(suggestPaymentTodayCents("custom", base, 10000)).toBe(10000);
  });

  it("classifies payment kind", () => {
    expect(paymentKindForAmount(5000, 5000, 23600)).toBe("deposit");
    expect(paymentKindForAmount(23600, 5000, 23600)).toBe("payment");
  });
});

describe("confirmation email financial copy (inclusive)", () => {
  const baseCtx = {
    businessId: "b1",
    businessName: "GVM Baby World Ultrasound",
    customerName: "Ana Ramoersad",
    staffName: "Bobita Singh",
    serviceName: "Elite Package",
    startTime: "2026-08-10T21:30:00.000Z",
    endTime: "2026-08-10T22:00:00.000Z",
    subtotalCents: 20885,
    taxCents: 2715,
    appointmentTotalCents: 23600,
    amountCents: 23600,
    depositRequiredCents: 5000,
    branding: {
      businessName: "GVM Baby World Ultrasound",
      supportEmail: "ops@example.com",
      supportPhone: "555-0100",
      showChasumBranding: false,
      chasumBrandingStyle: "none" as const,
    },
  };

  it("shows inclusive total $236 not $263.15", () => {
    const rendered = renderEmailTemplate("appointment.confirmation", {
      ...baseCtx,
      depositPaidCents: 5000,
      remainingBalanceCents: 18600,
      paymentMethodLabel: "E-Transfer",
    });
    expect(rendered.html).toContain("$236.00");
    expect(rendered.html).toContain("$208.85");
    expect(rendered.html).toContain("$186.00");
    expect(rendered.html).not.toContain("$263.15");
    expect(rendered.html).toContain("$50.00 deposit was received");
  });

  it("omits Powered by when branding removal entitled", () => {
    const rendered = renderEmailTemplate("appointment.confirmation", {
      ...baseCtx,
      depositPaidCents: 0,
      remainingBalanceCents: 23600,
      branding: {
        ...baseCtx.branding,
        optOutFooter: "Powered by Chasum",
        showChasumBranding: false,
      },
    });
    expect(rendered.html).not.toMatch(/Powered by Chasum/i);
  });
});

describe("sender identity", () => {
  it("quotes multi-word business display names", () => {
    expect(
      formatFromHeader(
        "GVM Baby World Ultrasound",
        "Chasum <notifications@chasumai.com>",
      ),
    ).toBe('"GVM Baby World Ultrasound" <notifications@chasumai.com>');
  });

  it("Private Alpha customer branding removes Powered by", () => {
    const tenant = resolveTenantEmailBranding(
      {
        name: "GVM Baby World Ultrasound",
        email: "ops@example.com",
        notification_email: "bookings@example.com",
        subscription_plan_key: "starter",
        private_alpha_enabled: true,
        communications_opt_out_footer: "Powered by Chasum",
      },
      "customer",
    );
    expect(tenant.showChasumBranding).toBe(false);
    expect(tenant.footerText).not.toMatch(/Powered by Chasum/i);
    expect(tenant.fromHeader).toContain("GVM Baby World Ultrasound");
    expect(tenant.fromHeader).toContain("notifications@chasumai.com");
    expect(tenant.replyToAddress).toBe("bookings@example.com");
  });
});
