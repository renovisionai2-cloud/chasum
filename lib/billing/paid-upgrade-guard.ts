import type {
  BillingProvider,
  BillingSubscription,
  PlanKey,
} from "@/lib/billing/types";

export const PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE =
  "Paid plan upgrades are not yet available in this environment.";

export const ENTERPRISE_SALES_MESSAGE =
  "Enterprise plans require contacting sales (sales@chasum.app).";

export const NO_CANCELLABLE_SUBSCRIPTION_MESSAGE =
  "There is no paid subscription to cancel.";

/** Self-serve paid catalog keys. Enterprise is sales-led, not checkout. */
export function isPaidSelfServePlan(
  planKey: string,
): planKey is Extract<PlanKey, "professional" | "business"> {
  return planKey === "professional" || planKey === "business";
}

/**
 * Free/starter tenants without a real Stripe subscription or trial are not
 * on a cancellable paid plan. Cancel controls must not write fake events.
 */
export function hasCancellablePaidSubscription(input: {
  planKey: string;
  status: string;
  stripeSubscriptionId?: string | null;
}): boolean {
  if (input.stripeSubscriptionId) return true;
  if (input.status === "trialing") return true;
  if (input.planKey === "starter") return false;
  if (input.status === "canceled") return false;
  return isPaidSelfServePlan(input.planKey) || input.planKey === "enterprise";
}

export function showSubscriptionLifecycleControls(
  subscription: Pick<
    BillingSubscription,
    "planKey" | "status" | "stripeSubscriptionId"
  >,
): boolean {
  if (hasCancellablePaidSubscription(subscription)) return true;
  if (subscription.status !== "canceled") return false;
  return (
    isPaidSelfServePlan(subscription.planKey) ||
    subscription.planKey === "enterprise" ||
    Boolean(subscription.stripeSubscriptionId)
  );
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
