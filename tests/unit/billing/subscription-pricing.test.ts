import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FALLBACK_PLANS, formatPlanPrice, PLAN_RANK } from "@/lib/billing/catalog";
import {
  ANNUAL_PAID_MONTHS,
  FIRST_25_ALPHA_OFFER,
  STANDARD_MONTHLY_PRICES,
  SUBSCRIPTION_CURRENCY,
  annualPriceCents,
  calculateAlphaSavings,
  formatCadFromCents,
} from "@/lib/billing/pricing";
import { SAAS_SUBSCRIPTION_CURRENCY_DECISION } from "@/lib/billing/plan-entitlements";

describe("approved CAD subscription pricing", () => {
  it("locks standard amounts and the ten-month annual derivation", () => {
    expect(SUBSCRIPTION_CURRENCY).toBe("CAD");
    expect(SAAS_SUBSCRIPTION_CURRENCY_DECISION).toContain("CAD");
    expect(SAAS_SUBSCRIPTION_CURRENCY_DECISION).not.toContain("REQUIRED");
    expect(STANDARD_MONTHLY_PRICES).toEqual({ professional: 7900, business: 14900 });
    expect(ANNUAL_PAID_MONTHS).toBe(10);
    expect(annualPriceCents(7900)).toBe(79000);
    expect(annualPriceCents(14900)).toBe(149000);
  });

  it("keeps the first-25 offer separate from standard rates", () => {
    expect(FIRST_25_ALPHA_OFFER.businessLimit).toBe(25);
    expect(FIRST_25_ALPHA_OFFER.monthlyPriceCents).toEqual({ professional: 5900, business: 12900 });
    expect(annualPriceCents(5900)).toBe(59000);
    expect(annualPriceCents(12900)).toBe(129000);
  });

  it.each([
    ["professional", 94800, 70800, 11800, 59000, 35800],
    ["business", 178800, 154800, 25800, 129000, 49800],
  ] as const)("explains both %s savings without double counting", (plan, regular, alphaMonthlyYear, extra, annual, combined) => {
    const savings = calculateAlphaSavings(plan);
    expect(savings).toMatchObject({
      regularYearAtMonthlyCents: regular,
      lifetimeSavingPerMonthCents: 2000,
      lifetimeSavingPerYearCents: 24000,
      alphaYearAtMonthlyCents: alphaMonthlyYear,
      additionalAnnualSavingCents: extra,
      annualTotalCents: annual,
      combinedAnnualSavingCents: combined,
    });
    expect(savings.regularYearAtMonthlyCents - savings.lifetimeSavingPerYearCents).toBe(alphaMonthlyYear);
    expect(alphaMonthlyYear - extra).toBe(annual);
    expect(24000 + extra).toBe(combined);
    expect(regular - annual).toBe(combined);
    expect(Object.values(savings).every(Number.isInteger)).toBe(true);
  });

  it("preserves catalog amounts, ordering, limits, Free and Custom", () => {
    expect(FALLBACK_PLANS.map((p) => [p.planKey, p.monthlyPriceCents, p.yearlyPriceCents, p.maxLocations, p.sortOrder, p.isActive])).toEqual([
      ["starter", 0, 0, 1, 1, true],
      ["professional", 7900, 79000, 3, 2, true],
      ["business", 14900, 149000, 6, 3, true],
      ["enterprise", null, null, null, 4, true],
    ]);
    expect(PLAN_RANK).toEqual({ starter: 0, professional: 1, business: 2, enterprise: 3 });
    expect(formatPlanPrice(FALLBACK_PLANS[0], "yearly")).toBe("$0");
    expect(formatPlanPrice(FALLBACK_PLANS[3], "monthly")).toBe("Custom");
    expect(formatPlanPrice(FALLBACK_PLANS[1], "monthly")).toBe("CAD $79/month");
    expect(formatPlanPrice(FALLBACK_PLANS[2], "yearly")).toBe("CAD $1,490/year");
  });

  it("formats supplied runtime catalog amounts without substituting list or Alpha prices", () => {
    const runtimePlan = { ...FALLBACK_PLANS[1], monthlyPriceCents: 8123, yearlyPriceCents: 82345 };
    expect(formatPlanPrice(runtimePlan, "monthly")).toBe("CAD $81.23/month");
    expect(formatPlanPrice(runtimePlan, "yearly")).toBe("CAD $823.45/year");
    expect(formatCadFromCents(129000)).toBe("CAD $1,290");
  });

  it("keeps offer representation independent of tenant flags, transports and redemption", () => {
    const source = readFileSync("lib/billing/pricing.ts", "utf8");
    expect(source).not.toMatch(/^import\s/m);
    expect(source).not.toMatch(/private_alpha_enabled|privateAlphaEnabled|process\.env|fetch\(|supabase|next\/server/);
  });
});
