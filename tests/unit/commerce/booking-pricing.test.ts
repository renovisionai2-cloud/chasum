import { describe, expect, it } from "vitest";
import { computeBookingPricing } from "@/lib/commerce/booking-pricing";
import type { TaxRate } from "@/lib/business/types";

const cadDefault: TaxRate = {
  id: "t1",
  business_id: "b1",
  name: "HST",
  rate_bps: 1300,
  country: "CA",
  region: "ON",
  inclusive: false,
  is_default: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

describe("computeBookingPricing", () => {
  it("applies business default tax and formats CAD", () => {
    const result = computeBookingPricing({
      subtotalCents: 10000,
      taxRates: [cadDefault],
      currency: "cad",
    });
    expect(result.taxCents).toBe(1300);
    expect(result.totalCents).toBe(11300);
    expect(result.formatted.taxes).toContain("13");
  });

  it("prefers service tax_rate_bps when set", () => {
    const result = computeBookingPricing({
      subtotalCents: 10000,
      serviceTaxRateBps: 500,
      taxRates: [cadDefault],
      currency: "usd",
    });
    expect(result.taxCents).toBe(500);
    expect(result.totalCents).toBe(10500);
  });

  it("shows zero tax when none configured", () => {
    const result = computeBookingPricing({
      subtotalCents: 2500,
      currency: "usd",
    });
    expect(result.taxCents).toBe(0);
    expect(result.totalCents).toBe(2500);
  });

  it("handles inclusive tax without increasing total", () => {
    const inclusive: TaxRate = { ...cadDefault, inclusive: true, rate_bps: 1000 };
    const result = computeBookingPricing({
      subtotalCents: 11000,
      taxRates: [inclusive],
      currency: "cad",
    });
    expect(result.totalCents).toBe(11000);
    expect(result.taxCents).toBeGreaterThan(0);
  });
});
