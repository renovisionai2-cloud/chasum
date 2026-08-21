import { describe, expect, it } from "vitest";
import {
  formatTaxRatePercent,
  parseTaxPercentInput,
} from "@/lib/commerce/tax-rate-percent";
import { resolveBookingFinancials } from "@/lib/commerce/booking-financials";
import { renderEmailTemplate } from "@/lib/communications/templates";
import {
  resolveTenantEmailBranding,
  toBrandingContext,
} from "@/lib/communications/tenant-email-branding";

describe("parseTaxPercentInput", () => {
  it("saves 13 as 1300 basis points", () => {
    const parsed = parseTaxPercentInput("13");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.rateBps).toBe(1300);
      expect(parsed.percent).toBe(13);
    }
  });

  it("normalizes 13% to 1300 basis points", () => {
    const parsed = parseTaxPercentInput("13%");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.rateBps).toBe(1300);
    }
  });

  it("rejects blank and invalid input instead of silently saving zero", () => {
    expect(parseTaxPercentInput("").ok).toBe(false);
    expect(parseTaxPercentInput("   ").ok).toBe(false);
    expect(parseTaxPercentInput("thirteen").ok).toBe(false);
    expect(parseTaxPercentInput("13 percent").ok).toBe(false);
    expect(parseTaxPercentInput("-5").ok).toBe(false);
    expect(parseTaxPercentInput("250").ok).toBe(false);
  });

  it("treats 0.13 as 0.13% (13 bps), not 13%", () => {
    const parsed = parseTaxPercentInput("0.13");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.rateBps).toBe(13);
    }
  });

  it("create and edit paths use the same parser", () => {
    const create = parseTaxPercentInput("13%");
    const edit = parseTaxPercentInput("13");
    expect(create.ok && edit.ok).toBe(true);
    if (create.ok && edit.ok) {
      expect(create.rateBps).toBe(edit.rateBps);
      expect(create.rateBps).toBe(1300);
    }
  });
});

describe("formatTaxRatePercent", () => {
  it("displays 1300 bps as 13.00%", () => {
    expect(formatTaxRatePercent(1300)).toBe("13.00%");
  });

  it("displays 0 bps as 0.00%", () => {
    expect(formatTaxRatePercent(0)).toBe("0.00%");
  });
});

describe("exclusive $700 after corrected HST", () => {
  const rates = [
    {
      id: "hst",
      name: "HST",
      rate_bps: 1300,
      inclusive: false,
      is_default: true,
      is_active: true,
    },
  ];

  it("produces $91 tax and $791 total", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: rates,
      depositRequiredCents: 5000,
    });
    expect(f.taxRateBps).toBe(1300);
    expect(f.subtotalCents).toBe(70000);
    expect(f.taxCents).toBe(9100);
    expect(f.appointmentTotalCents).toBe(79100);
  });

  it("fixed $50 deposit leaves $741 remaining", () => {
    const f = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: rates,
      depositRequiredCents: 5000,
      paymentTodayCents: 5000,
    });
    expect(f.depositRequiredCents).toBe(5000);
    expect(f.remainingBalanceCents).toBe(74100);
  });
});

describe("customer email branding preserved", () => {
  it("keeps mailto and omits Powered by Chasum for Private Alpha", () => {
    const branding = toBrandingContext(
      resolveTenantEmailBranding(
        {
          name: "GVM Baby World Ultrasound",
          email: "gvmbabyworld@gmail.com",
          notification_email: null,
          subscription_plan_key: "starter",
          private_alpha_enabled: true,
        },
        "customer",
      ),
    );
    const rendered = renderEmailTemplate("appointment.confirmation", {
      businessId: "biz",
      businessName: "GVM Baby World Ultrasound",
      customerName: "Ana",
      staffName: "Bobita",
      serviceName: "Early Gender (10-15 weeks)",
      startTime: "2026-08-05T15:00:00.000Z",
      subtotalCents: 70000,
      taxCents: 9100,
      taxRateBps: 1300,
      taxLabel: "HST",
      appointmentTotalCents: 79100,
      depositRequiredCents: 5000,
      depositPaidCents: 5000,
      remainingBalanceCents: 74100,
      branding,
    });
    expect(rendered.html).toContain("mailto:gvmbabyworld@gmail.com?subject=");
    expect(rendered.html).toContain("Email GVM Baby World Ultrasound");
    expect(rendered.html).not.toMatch(/Powered by Chasum/i);
    expect(rendered.html).toContain("$791.00");
    expect(rendered.html).toContain("$91.00");
  });
});
