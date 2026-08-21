import type { BillingProvider, PlanKey } from "@/lib/billing/types";

export const PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE =
  "Paid plan upgrades are not yet available in this environment.";

export const ENTERPRISE_SALES_MESSAGE =
  "Enterprise plans require contacting sales (sales@chasum.app).";

/** Self-serve paid catalog keys. Enterprise is sales-led, not checkout. */
export function isPaidSelfServePlan(
  planKey: string,
): planKey is Extract<PlanKey, "professional" | "business"> {
  return planKey === "professional" || planKey === "business";
}

/**
 * Refuse paid-plan changes unless a real Stripe provider is active.
 * Mock billing must never mint paid invoices, MRR, or paid subscription state.
 */
export function refusePaidPlanChange(input: {
  providerName: BillingProvider["name"];
  planKey: string;
}): string | null {
  if (input.planKey === "enterprise") {
    return ENTERPRISE_SALES_MESSAGE;
  }
  if (isPaidSelfServePlan(input.planKey) && input.providerName !== "stripe") {
    return PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE;
  }
  return null;
}
