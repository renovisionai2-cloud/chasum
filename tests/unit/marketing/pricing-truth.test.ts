import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  APPLY_PLAN_INTENT_IDS,
  PRICING_ANNUAL_BADGE,
  PRICING_ANNUAL_NOTE,
  PRICING_COMPARISON_SECTIONS,
  PRICING_FAQ_ITEMS,
  PRICING_FINAL_BODY,
  PRICING_FINAL_PRIMARY_CTA,
  PRICING_PLANS,
  PRICING_WORKFLOW_HEADLINE,
  PRICING_WORKFLOW_STEPS,
  applyHrefForPlan,
  getPlanPrice,
  resolveApplyPlanIntent,
} from "@/lib/marketing/pricing";
import { PRICING_KNOWLEDGE } from "@/lib/website-concierge/knowledge/pricing";
import { CTA_APPLY_LABEL } from "@/lib/marketing/alpha";

function allPricingCopy(): string {
  return [
    JSON.stringify(PRICING_PLANS),
    JSON.stringify(PRICING_FAQ_ITEMS),
    JSON.stringify(PRICING_WORKFLOW_STEPS),
    PRICING_WORKFLOW_HEADLINE,
    PRICING_FINAL_BODY,
    PRICING_KNOWLEDGE.map((entry) => entry.body).join("\n"),
  ].join("\n");
}

describe("Pricing commercial truth", () => {
  it("keeps public monthly prices at $0 / $79 / $149 / Custom", () => {
    const byId = Object.fromEntries(PRICING_PLANS.map((p) => [p.id, p]));
    expect(byId.free?.monthlyPrice).toBe("$0");
    expect(byId.professional?.monthlyPrice).toBe("$79");
    expect(byId.business?.monthlyPrice).toBe("$149");
    expect(byId.enterprise?.monthlyPrice).toBe("Custom");
    expect(allPricingCopy()).not.toMatch(/\$59/);
    expect(allPricingCopy()).not.toMatch(/\$590/);
  });

  it("uses 10-for-12 annual totals instead of 20% monthly equivalents", () => {
    const professional = PRICING_PLANS.find((p) => p.id === "professional")!;
    const business = PRICING_PLANS.find((p) => p.id === "business")!;
    expect(professional.yearlyTotal).toBe("$790");
    expect(business.yearlyTotal).toBe("$1,490");
    expect(getPlanPrice(professional, "yearly")).toEqual({
      price: "$790",
      suffix: " / year",
      note: PRICING_ANNUAL_NOTE,
    });
    expect(getPlanPrice(business, "yearly")).toEqual({
      price: "$1,490",
      suffix: " / year",
      note: PRICING_ANNUAL_NOTE,
    });
    expect(PRICING_ANNUAL_BADGE).toBe("Save 2 months");
    expect(allPricingCopy()).not.toMatch(/20%/);
    expect(allPricingCopy()).not.toMatch(/\$63/);
    expect(allPricingCopy()).not.toMatch(/\$119/);
  });

  it("uses honest Apply CTAs with plan query intent", () => {
    const byId = Object.fromEntries(PRICING_PLANS.map((p) => [p.id, p]));
    expect(byId.free?.ctaLabel).toBe("Apply for Free");
    expect(byId.professional?.ctaLabel).toBe("Apply for Professional");
    expect(byId.business?.ctaLabel).toBe("Apply for Business");
    expect(byId.enterprise?.ctaLabel).toBe("Contact Sales");
    expect(applyHrefForPlan("professional")).toBe("/apply?plan=professional");
    expect(PRICING_FINAL_PRIMARY_CTA).toBe(CTA_APPLY_LABEL);
    expect(PRICING_FINAL_BODY.toLowerCase()).not.toContain("start free");
  });

  it("does not sell Inventory, gift-card storefronts, or hosted calling", () => {
    const planCopy = JSON.stringify(PRICING_PLANS);
    const tableCopy = JSON.stringify(PRICING_COMPARISON_SECTIONS);
    const faqCopy = JSON.stringify(PRICING_FAQ_ITEMS);
    expect(planCopy).not.toMatch(/Inventory/);
    expect(tableCopy).not.toMatch(/Inventory/);
    expect(`${planCopy}${tableCopy}${faqCopy}`).not.toMatch(/Gift Cards/);
    expect(`${planCopy}${tableCopy}${faqCopy}`).toMatch(/Gift Certificates/);
    expect(`${planCopy}${tableCopy}${faqCopy}`).not.toMatch(
      /Business Calls & Texting/,
    );
    expect(`${planCopy}${tableCopy}`).toMatch(/Customer Communications/);
    expect(`${planCopy}${tableCopy}`).toMatch(/Payments & Financials/);
    expect(`${planCopy}${tableCopy}`).toMatch(/Manual-first/);
  });

  it("keeps Business at 6 locations and does not assign Memberships to a tier", () => {
    const business = PRICING_PLANS.find((p) => p.id === "business")!;
    expect(business.features.location_limit).toBe("Up to 6");
    expect(allPricingCopy()).not.toMatch(/Memberships & Packages/);
  });

  it("does not show Custom Permissions as a shipped Enterprise inclusion", () => {
    const enterprise = PRICING_PLANS.find((p) => p.id === "enterprise")!;
    expect(enterprise.features.custom_permissions).toBe(false);
    expect(enterprise.cardFeatures).not.toContain("custom_permissions");
  });

  it("keeps Invoicing as Professional+ Early Access without claiming a runtime gate", () => {
    const byId = Object.fromEntries(PRICING_PLANS.map((p) => [p.id, p]));
    expect(byId.free?.features.invoicing).toBe(false);
    expect(byId.professional?.features.invoicing).toBe(true);
    expect(byId.business?.features.invoicing).toBe(true);
    const invoicing = PRICING_COMPARISON_SECTIONS.flatMap((s) => s.rows).find(
      (row) => row.id === "invoicing",
    );
    expect(invoicing?.note).toMatch(/Early Access/);
  });

  it("aligns Summer FAQ with assistive AI Business Manager maturity", () => {
    const faq = PRICING_FAQ_ITEMS.map((item) => `${item.q} ${item.a}`).join("\n");
    expect(faq).not.toMatch(/AI Receptionist/);
    expect(faq).not.toMatch(/automate everyday work/i);
    expect(faq).not.toMatch(/Answering calls and appointment requests/);
    expect(faq).toMatch(/Helping with customer questions and appointment requests/);
    expect(faq).toMatch(/observe, understand, recommend/i);
    expect(faq).toMatch(/Access is currently through Private Alpha/);
  });

  it("connects the journey without automatic checkout or SMS-always claims", () => {
    expect(PRICING_WORKFLOW_HEADLINE).toBe(
      "From first booking to repeat customer—connected.",
    );
    expect(PRICING_WORKFLOW_HEADLINE.toLowerCase()).not.toContain("automatically");
    const payment = PRICING_WORKFLOW_STEPS.find((s) => s.title === "Payment Recorded");
    expect(payment?.detail).toMatch(/deposits, invoices and receipts/i);
    const confirmation = PRICING_WORKFLOW_STEPS.find(
      (s) => s.title === "Confirmation Sent",
    );
    expect(confirmation?.detail).toMatch(/configured email and SMS/);
  });
});

describe("Apply plan acquisition intent", () => {
  it("accepts only Free / Professional / Business query values", () => {
    expect(resolveApplyPlanIntent("professional")).toBe("professional");
    expect(resolveApplyPlanIntent("enterprise")).toBeNull();
    expect(resolveApplyPlanIntent("starter")).toBeNull();
    expect(resolveApplyPlanIntent(undefined)).toBeNull();
    expect(APPLY_PLAN_INTENT_IDS).toEqual(["free", "professional", "business"]);
  });

  it("keeps Apply as lead capture with no billing mutation APIs", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/actions/design-partner.ts"),
      "utf8",
    );
    expect(source).toContain("preferred_plan");
    expect(source).toContain("Interested plan");
    expect(source).not.toMatch(/subscription_plan_key/);
    expect(source).not.toMatch(/@\/lib\/billing/);
    expect(source).not.toMatch(/changePlan|assignPlan|stripe/i);
  });
});
