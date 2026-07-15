import type { BillingInterval, BillingPlan, PlanKey } from "@/lib/billing/types";
import { formatUsdFromCents } from "@/lib/owner/constants";

/** Canonical plan order for Billing Phase 1 (Free = starter). */
export const BILLING_PLAN_ORDER: PlanKey[] = [
  "starter",
  "professional",
  "business",
  "enterprise",
];

export const PLAN_RANK: Record<PlanKey, number> = {
  starter: 0,
  professional: 1,
  business: 2,
  enterprise: 3,
};

/** Fallback catalog when DB rows are unavailable. */
export const FALLBACK_PLANS: BillingPlan[] = [
  {
    planKey: "starter",
    name: "Free",
    description: "Everything you need to experience Chasum.",
    maxLocations: 1,
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    sortOrder: 1,
    isActive: true,
  },
  {
    planKey: "professional",
    name: "Professional",
    description:
      "Powerful scheduling, AI assistance, and automation for professionals.",
    maxLocations: 3,
    monthlyPriceCents: 7900,
    yearlyPriceCents: 79000,
    sortOrder: 2,
    isActive: true,
  },
  {
    planKey: "business",
    name: "Business",
    description:
      "Multi-location management, advanced automation, and collaboration for growing teams.",
    maxLocations: 10,
    monthlyPriceCents: 14900,
    yearlyPriceCents: 149000,
    sortOrder: 3,
    isActive: true,
  },
  {
    planKey: "enterprise",
    name: "Enterprise",
    description:
      "Custom onboarding, advanced security, dedicated support, and tailored solutions.",
    maxLocations: null,
    monthlyPriceCents: null,
    yearlyPriceCents: null,
    sortOrder: 4,
    isActive: true,
  },
];

export function isPlanKey(value: string): value is PlanKey {
  return BILLING_PLAN_ORDER.includes(value as PlanKey);
}

export function planPriceCents(
  plan: BillingPlan,
  interval: BillingInterval,
): number | null {
  if (interval === "yearly") return plan.yearlyPriceCents;
  return plan.monthlyPriceCents;
}

export function formatPlanPrice(
  plan: BillingPlan,
  interval: BillingInterval,
): string {
  const cents = planPriceCents(plan, interval);
  if (cents === null) return "Custom";
  if (cents === 0) return "$0";
  return `${formatUsdFromCents(cents)}${interval === "yearly" ? "/year" : "/month"}`;
}

export function comparePlans(from: PlanKey, to: PlanKey): "upgrade" | "downgrade" | "same" {
  const diff = PLAN_RANK[to] - PLAN_RANK[from];
  if (diff > 0) return "upgrade";
  if (diff < 0) return "downgrade";
  return "same";
}

export function trialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function addBillingPeriod(
  from: Date,
  interval: BillingInterval,
): Date {
  const next = new Date(from);
  if (interval === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}
