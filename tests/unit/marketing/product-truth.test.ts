import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FALLBACK_PLANS } from "@/lib/billing/catalog";
import {
  maxLocationsForPlan,
  maxStaffForPlan,
  SAAS_SUBSCRIPTION_CURRENCY_DECISION,
} from "@/lib/billing/plan-entitlements";
import {
  PRICING_COMPARISON_SECTIONS,
  PRICING_PLANS,
} from "@/lib/marketing/pricing";
import {
  ROADMAP_AVAILABLE_TODAY,
  ROADMAP_COMING_SOON,
} from "@/lib/marketing/roadmap";
import { STATUS_LAST_UPDATED } from "@/lib/marketing/resources-status";
import { FREE_PLAN_UPGRADE_CTA } from "@/lib/marketing/pricing";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("marketing product truth", () => {
  it("does not present Inventory as Available Today", () => {
    const business = PRICING_PLANS.find((p) => p.id === "business");
    const enterprise = PRICING_PLANS.find((p) => p.id === "enterprise");
    expect(business?.features.inventory).not.toBe(true);
    expect(enterprise?.features.inventory).not.toBe(true);
    expect(business?.features.inventory).toBe("Coming soon");
    expect(enterprise?.features.inventory).toBe("Coming soon");

    const inventoryRow = PRICING_COMPARISON_SECTIONS.flatMap((s) => s.rows).find(
      (row) => row.id === "inventory",
    );
    expect(inventoryRow?.note).toMatch(/coming soon/i);
    expect(inventoryRow?.business).not.toBe(true);
    expect(inventoryRow?.enterprise).not.toBe(true);

    const comingSoonTitles = ROADMAP_COMING_SOON.cards.map((c) => c.title);
    expect(comingSoonTitles).toContain("Inventory Management");
  });

  it("keeps Voice AI / AI Phone Calls as Coming Soon and does not rewrite notes as currently available", () => {
    const pricingSrc = read("components/landing/pricing.tsx");
    expect(pricingSrc).not.toMatch(
      /Available where configured on paid plans/,
    );
    expect(pricingSrc).not.toMatch(/row\.note\.includes\("Voice AI"\)/);

    const comingSoonTitles = ROADMAP_COMING_SOON.cards.map((c) => c.title);
    expect(comingSoonTitles).toContain("AI Phone Calls");

    const messaging = PRICING_PLANS.find((p) => p.id === "professional")
      ?.features.business_messaging;
    expect(messaging).toBe(true);
  });

  it("represents Packages and Memberships independently", () => {
    const available = ROADMAP_AVAILABLE_TODAY.cards.map((c) => c.title);
    const comingSoon = ROADMAP_COMING_SOON.cards.map((c) => c.title);
    expect(available).toContain("Service Packages");
    expect(comingSoon).toContain("Memberships");
    expect(comingSoon).not.toContain("Memberships & Service Packages");
    expect(available).not.toContain("Memberships");
  });

  it("matches marketing numeric limits to the enforcement catalog", () => {
    expect(FALLBACK_PLANS.find((p) => p.planKey === "business")?.maxLocations).toBe(
      6,
    );
    expect(maxLocationsForPlan("business")).toBe(6);
    expect(maxStaffForPlan("starter")).toBe(1);
    expect(maxStaffForPlan("professional")).toBe(3);
    expect(maxStaffForPlan("business")).toBeNull();

    const business = PRICING_PLANS.find((p) => p.planKey === "business");
    expect(business?.features.location_limit).toBe("Up to 6");
    expect(business?.features.staff_limit).toBe("Unlimited");
  });

  it("records that SaaS subscription currency is not invented", () => {
    expect(SAAS_SUBSCRIPTION_CURRENCY_DECISION).toMatch(
      /PRODUCT OWNER DECISION REQUIRED/,
    );
    const professional = PRICING_PLANS.find((p) => p.id === "professional");
    expect(professional?.monthlyPrice).toBe("$79");
  });

  it("uses Apply for Professional for in-product paid-plan upgrade CTAs", () => {
    expect(FREE_PLAN_UPGRADE_CTA).toBe("Apply for Professional");
    const billing = read("components/billing/billing-manager.tsx");
    expect(billing).toMatch(/FREE_PLAN_UPGRADE_CTA/);
    expect(billing).toMatch(/Paid plans are currently approved through Private Alpha/);
    expect(billing).not.toMatch(/>Apply for Private Alpha</);
  });

  it("deletes unused fabricated marketing components", () => {
    expect(existsSync(join(root, "components/landing/testimonials.tsx"))).toBe(
      false,
    );
    expect(existsSync(join(root, "components/landing/logo-cloud.tsx"))).toBe(
      false,
    );
    expect(existsSync(join(root, "components/landing/impact-counters.tsx"))).toBe(
      false,
    );
    const homepage = read("lib/marketing/homepage.ts");
    expect(homepage).not.toMatch(/export const IMPACT_STATS/);
    expect(homepage).not.toMatch(/export const TESTIMONIALS/);
    expect(homepage).not.toMatch(/export const LOGO_CLOUD/);
  });

  it("stamps a current manually reviewed status date", () => {
    expect(STATUS_LAST_UPDATED).toBe("2026-08-22");
    const status = read("lib/marketing/resources-status.ts");
    expect(status).toMatch(/not live monitoring/i);
  });
});
