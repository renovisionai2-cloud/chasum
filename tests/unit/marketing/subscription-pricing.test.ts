import { describe, expect, it } from "vitest";
import { FALLBACK_PLANS, formatPlanPrice } from "@/lib/billing/catalog";
import { productPlanKeyForNewBusiness } from "@/lib/billing/private-alpha-plan";
import { MARKETING_PLANS, PRICING_PLANS, getPlanPrice, getPricingPlan } from "@/lib/marketing/pricing";
import { PRICING_KNOWLEDGE } from "@/lib/website-concierge/knowledge/pricing";

describe("public subscription price contract", () => {
  it.each([
    ["professional", "CAD $79", "CAD $790"],
    ["business", "CAD $149", "CAD $1,490"],
  ])("shows actual %s totals and explicit upfront annual billing", (id, monthly, yearly) => {
    const plan = getPricingPlan(id);
    expect(getPlanPrice(plan, "monthly")).toEqual({ price: monthly, suffix: "/month" });
    expect(getPlanPrice(plan, "yearly")).toEqual({ price: yearly, suffix: "/year", note: "Paid upfront for 12 months." });
    const catalog = FALLBACK_PLANS.find((p) => p.planKey === plan.planKey)!;
    for (const period of ["monthly", "yearly"] as const) {
      const price = getPlanPrice(plan, period);
      expect(price.price + price.suffix).toBe(formatPlanPrice(catalog, period));
    }
  });

  it("keeps Free and Custom outside paid-upfront promises", () => {
    for (const period of ["monthly", "yearly"] as const) {
      expect(getPlanPrice(getPricingPlan("free"), period)).toEqual({ price: "$0" });
      expect(getPlanPrice(getPricingPlan("enterprise"), period)).toEqual({ price: "Custom" });
    }
  });

  it("keeps monthly legacy adapters, features and acquisition routes", () => {
    expect(MARKETING_PLANS.map((p) => [p.id, p.price, p.priceSuffix, p.href])).toEqual([
      ["free", "$0", undefined, "/apply"],
      ["professional", "CAD $79", "/month", "/apply"],
      ["business", "CAD $149", "/month", "/apply"],
      ["enterprise", "Custom", undefined, "/contact#walkthrough"],
    ]);
    expect(PRICING_PLANS.map((p) => [p.features.staff_limit, p.features.location_limit, p.features.summer, p.features.sms_reminders])).toEqual([
      ["1", "1", false, false], ["Up to 3", "Up to 3", true, true], ["Unlimited", "Up to 6", true, true], ["Unlimited", "Unlimited", true, true],
    ]);
    expect(MARKETING_PLANS[1].groups[0].items).toEqual(["Everything in Free"]);
  });

  it.each([true, false])("does not infer an Alpha offer from tenant flag %s", (enabled) => {
    // Extra tenant metadata must not select offer pricing or change the signup plan.
    const plan = { ...getPricingPlan("professional"), private_alpha_enabled: enabled, privateAlphaEnabled: enabled };
    expect(getPlanPrice(plan, "monthly").price).toBe("CAD $79");
    expect(getPlanPrice(plan, "yearly").price).toBe("CAD $790");
    expect(productPlanKeyForNewBusiness(plan.id)).toBe("starter");
  });

  it("keeps website pricing knowledge on the same annual totals", () => {
    const body = PRICING_KNOWLEDGE.find((entry) => entry.id === "pricing-plans")!.body;
    expect(body).toContain("CAD $790/year, paid upfront for 12 months");
    expect(body).toContain("CAD $1,490/year, paid upfront for 12 months");
    expect(body).not.toMatch(/\$63\b|\$119\b|20%/);
  });
});
