import { describe, expect, it } from "vitest";
import { computeBookingPricing } from "@/lib/commerce/booking-pricing";
import type { TaxRate } from "@/lib/business/types";

/**
 * Documents the intended Balance model vs Price summary:
 * - Appointment total = subtotal + tax
 * - Outstanding before payment = appointment total
 * - Deposit due now ≠ remaining balance after deposit
 * - Do not treat pre-tax service.price as Outstanding
 */
describe("booking balance pricing model", () => {
  it("keeps deposit distinct from outstanding total", () => {
    const taxRates: TaxRate[] = [
      {
        id: "t1",
        business_id: "b1",
        name: "Sales tax",
        rate_bps: 1150,
        country: null,
        region: null,
        inclusive: false,
        is_default: true,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ];
    const pricing = computeBookingPricing({
      subtotalCents: 22000,
      serviceTaxRateBps: 0,
      taxRates,
      currency: "usd",
    });

    // $220 + 11.5% tax = $245.30
    expect(pricing.subtotalCents).toBe(22000);
    expect(pricing.taxCents).toBe(2530);
    expect(pricing.totalCents).toBe(24530);

    const depositCents = 5000;
    const netPaid = 0;
    const outstandingTotal = Math.max(0, pricing.totalCents - netPaid);
    const remainingAfterDeposit = Math.max(
      0,
      pricing.totalCents - Math.max(depositCents, netPaid),
    );

    expect(outstandingTotal).toBe(24530);
    expect(remainingAfterDeposit).toBe(19530);
    // Regression: pre-tax $220 must not be labeled Outstanding when tax applies
    expect(outstandingTotal).not.toBe(22000);
  });
});
