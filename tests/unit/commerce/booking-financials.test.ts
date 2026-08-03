import { describe, expect, it } from "vitest";
import {
  paymentKindForAmount,
  resolveBookingFinancials,
  resolveConfiguredDepositCents,
  resolveDepositRequiredCents,
  resolveFinancialsFromAppointment,
  suggestPaymentTodayCents,
} from "@/lib/commerce/booking-financials";
import { renderEmailTemplate } from "@/lib/communications/templates";
import {
  formatFromHeader,
  resolveTenantEmailBranding,
} from "@/lib/communications/tenant-email-branding";

const exclusiveHst = [
  {
    id: "t1",
    name: "HST",
    rate_bps: 1300,
    inclusive: false,
    is_default: true,
    is_active: true,
  },
];

const inclusiveHst = [
  {
    id: "t1",
    name: "HST",
    rate_bps: 1300,
    inclusive: true,
    is_default: true,
    is_active: true,
  },
];

describe("tax-exclusive $700 @ 13% HST (GVM rule)", () => {
  it("adds tax: subtotal $700, tax $91, total $791", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
      depositRequiredCents: 5000,
      currency: "cad",
    });
    expect(f.taxInclusive).toBe(false);
    expect(f.subtotalCents).toBe(70000);
    expect(f.taxCents).toBe(9100);
    expect(f.appointmentTotalCents).toBe(79100);
    expect(f.depositRequiredCents).toBe(5000);
    expect(f.remainingBalanceCents).toBe(79100);
  });

  it("keeps fixed $50 deposit with $50 payment → $741 remaining", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
      depositRequiredCents: 5000,
      paymentTodayCents: 5000,
    });
    expect(f.depositRequiredCents).toBe(5000);
    expect(f.remainingBalanceCents).toBe(74100);
    expect(f.paymentStatus).toBe("deposit_paid");
  });

  it("no payment → $791 remaining and $50 still required", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
      depositRequiredCents: 5000,
    });
    expect(f.depositRequiredCents).toBe(5000);
    expect(f.remainingBalanceCents).toBe(79100);
    expect(f.paymentStatus).toBe("deposit_required");
  });

  it("pay in full → $791 payment and $0 balance", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
      depositRequiredCents: 5000,
      paymentTodayCents: 79100,
    });
    expect(f.remainingBalanceCents).toBe(0);
    expect(f.paymentStatus).toBe("fully_paid");
  });

  it("different payment amount", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
      depositRequiredCents: 5000,
      paymentTodayCents: 10000,
    });
    expect(f.remainingBalanceCents).toBe(69100);
  });

  it("deposit required is never derived from tax", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
      depositRequiredCents: 5000,
      depositRequired: true,
    });
    expect(f.depositRequiredCents).toBe(5000);
    expect(f.depositRequiredCents).not.toBe(Math.round(61947 * 0.2));
    expect(f.depositRequiredCents).not.toBe(f.taxCents);
  });

  it("integer-cent rounding for exclusive tax", () => {
    // 70000 * 1300 / 10000 = 9100 exactly
    expect(
      resolveBookingFinancials({
        catalogPriceCents: 70000,
        taxRates: exclusiveHst,
      }).taxCents,
    ).toBe(9100);
  });

  it("Quick Book and Booking Sheet produce identical values", () => {
    const input = {
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
      depositRequiredCents: 5000,
      depositRequired: true,
      currency: "cad",
    };
    const a = resolveBookingFinancials(input);
    const b = resolveBookingFinancials(input);
    expect(a).toEqual(b);
    expect(a.appointmentTotalCents).toBe(79100);
    expect(a.depositRequiredCents).toBe(5000);
  });
});

describe("tax-inclusive catalog still supported", () => {
  it("extracts tax from inclusive list price", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 23600,
      taxRates: inclusiveHst,
      depositRequiredCents: 5000,
      paymentTodayCents: 5000,
    });
    expect(f.taxInclusive).toBe(true);
    expect(f.subtotalCents).toBe(20885);
    expect(f.taxCents).toBe(2715);
    expect(f.appointmentTotalCents).toBe(23600);
    expect(f.remainingBalanceCents).toBe(18600);
  });
});

describe("non-taxable service", () => {
  it("keeps catalog as total with zero tax", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: [],
      depositRequiredCents: 5000,
    });
    expect(f.taxCents).toBe(0);
    expect(f.appointmentTotalCents).toBe(70000);
    expect(f.subtotalCents).toBe(70000);
  });
});

describe("persisted appointment rebuild (exclusive stamps)", () => {
  it("rebuilds $700 + $91 without treating total as inclusive", () => {
    const f = resolveFinancialsFromAppointment({
      priceCents: 70000,
      taxCents: 9100,
      depositCents: 5000,
      amountPaidCents: 5000,
    });
    expect(f.taxInclusive).toBe(false);
    expect(f.subtotalCents).toBe(70000);
    expect(f.taxCents).toBe(9100);
    expect(f.appointmentTotalCents).toBe(79100);
    expect(f.depositRequiredCents).toBe(5000);
    expect(f.remainingBalanceCents).toBe(74100);
  });
});

describe("deposit helpers", () => {
  it("uses explicit deposit cents", () => {
    expect(
      resolveDepositRequiredCents({
        depositCents: 5000,
        depositRequired: true,
        baseCents: 79100,
      }),
    ).toBe(5000);
  });

  it("falls back to 20% of appointment total only when no explicit cents", () => {
    expect(
      resolveDepositRequiredCents({
        depositCents: 0,
        depositRequired: true,
        baseCents: 79100,
      }),
    ).toBe(15820);
  });

  it("configured deposit never Math.max with percent of exclusive subtotal", () => {
    expect(
      resolveConfiguredDepositCents({
        appointmentDepositCents: 5000,
        serviceDepositCents: 5000,
        serviceDepositRequired: true,
        appointmentTotalCents: 79100,
      }),
    ).toBe(5000);
    // Regression: old sync used Math.max(5000, round(61947 * 0.2)) = 12389
    expect(
      resolveConfiguredDepositCents({
        appointmentDepositCents: 5000,
        serviceDepositCents: 0,
        serviceDepositRequired: true,
        appointmentTotalCents: 79100,
      }),
    ).toBe(5000);
  });
});

describe("payment suggestions", () => {
  const f = resolveBookingFinancials({
    catalogPriceCents: 70000,
    taxRates: exclusiveHst,
    depositRequiredCents: 5000,
  });

  it("suggests deposit / full / custom", () => {
    expect(suggestPaymentTodayCents("deposit", f)).toBe(5000);
    expect(suggestPaymentTodayCents("full", f)).toBe(79100);
    expect(suggestPaymentTodayCents("custom", f, 1234)).toBe(1234);
    expect(suggestPaymentTodayCents("none", f)).toBe(0);
  });

  it("classifies payment kind", () => {
    expect(paymentKindForAmount(5000, 5000, 79100)).toBe("deposit");
    expect(paymentKindForAmount(79100, 5000, 79100)).toBe("payment");
  });
});

describe("email financial copy — exclusive $700", () => {
  const branding = resolveTenantEmailBranding(
    {
      name: "GVM Baby World Ultrasound",
      email: "office@example.com",
      notification_email: "office@example.com",
      logo_url: null,
      primary_color: "#0b1324",
      subscription_plan_key: "professional",
      private_alpha_enabled: true,
      communications_opt_out_footer: null,
    },
    "customer",
  );

  const ctx = {
    businessId: "biz",
    businessName: "GVM Baby World Ultrasound",
    customerName: "Ana",
    staffName: "Bobita",
    serviceName: "Elite Package",
    startTime: "2026-08-07T15:00:00.000Z",
    subtotalCents: 70000,
    taxCents: 9100,
    taxRateBps: 1300,
    taxLabel: "HST",
    appointmentTotalCents: 79100,
    depositRequiredCents: 5000,
    depositPaidCents: 5000,
    remainingBalanceCents: 74100,
    paymentMethodLabel: "E-Transfer",
    paymentStatusLabel: "Deposit paid",
    branding: {
      businessName: branding.businessName,
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      showChasumBranding: branding.showChasumBranding,
      chasumBrandingStyle: branding.chasumBrandingStyle,
      optOutFooter: branding.footerText,
    },
  };

  it("customer email shows exclusive totals and $50 deposit", () => {
    const rendered = renderEmailTemplate("appointment.confirmation", ctx);
    expect(rendered.html).toContain("$700.00");
    expect(rendered.html).toContain("$91.00");
    expect(rendered.html).toContain("$791.00");
    expect(rendered.html).toContain("$50.00");
    expect(rendered.html).toContain("$741.00");
    expect(rendered.html).toContain("HST (13%)");
    expect(rendered.html).not.toContain("$123.89");
    expect(rendered.html).not.toContain("$619.47");
  });

  it("business email shows catalog subtotal and deposit required $50", () => {
    const rendered = renderEmailTemplate("appointment.business", {
      ...ctx,
      branding: {
        ...ctx.branding,
        showChasumBranding: true,
        chasumBrandingStyle: "product_context",
      },
    });
    expect(rendered.html).toContain("Catalog subtotal");
    expect(rendered.html).toContain("$700.00");
    expect(rendered.html).toContain("$91.00");
    expect(rendered.html).toContain("$791.00");
    expect(rendered.html).toContain("Deposit required");
    expect(rendered.html).toContain("$50.00");
    expect(rendered.html).toContain("$741.00");
  });

  it("payment receipt shows $791 total and $741 remaining", () => {
    const rendered = renderEmailTemplate("commerce.receipt", {
      ...ctx,
      amountCents: 5000,
      receiptNumber: "RCT-0001",
    });
    expect(rendered.html).toContain("$50.00");
    expect(rendered.html).toContain("$791.00");
    expect(rendered.html).toContain("$741.00");
    expect(rendered.html).not.toContain("$123.89");
  });

  it("From header quotes multi-word business name", () => {
    expect(formatFromHeader("GVM Baby World Ultrasound", "notifications@chasumai.com")).toBe(
      '"GVM Baby World Ultrasound" <notifications@chasumai.com>',
    );
  });
});
