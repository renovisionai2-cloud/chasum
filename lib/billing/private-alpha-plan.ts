import { normalizePlanKey, planDisplayName } from "@/lib/billing/plan-entitlements";
import type { PlanKey } from "@/lib/billing/types";

/**
 * Phase 4A — Private Alpha / design-partner plan honesty.
 * Product plan (subscription_plan_key) is distinct from Private Alpha
 * feature elevation (private_alpha_enabled).
 */

/** /owner may assign these product plans during Private Alpha. */
export const OWNER_ASSIGNABLE_PLAN_KEYS = ["starter", "professional"] as const;

export type OwnerAssignablePlanKey = (typeof OWNER_ASSIGNABLE_PLAN_KEYS)[number];

export const TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE =
  "Plan changes during Private Alpha are arranged with Chasum. Self-serve subscription changes are not available.";

export const PRIVATE_ALPHA_BILLING_ARRANGEMENT =
  "During Private Alpha, billing is arranged with Chasum. Self-serve checkout is not open.";

export const PRIVATE_ALPHA_PLAN_REQUEST_CTA = "Request a plan change";
export const PRIVATE_ALPHA_PLAN_REQUEST_HREF = "/apply";

const BUSINESS_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * New businesses always start on Free (`starter`).
 * Signup `preferred_plan` is acquisition intent only and must never become
 * the billed product plan.
 */
export function productPlanKeyForNewBusiness(
  preferredPlan?: string | null,
): PlanKey {
  void preferredPlan;
  return "starter";
}

export function isOwnerAssignablePlanKey(
  value: string,
): value is OwnerAssignablePlanKey {
  return (OWNER_ASSIGNABLE_PLAN_KEYS as readonly string[]).includes(value);
}

export function isBusinessId(value: string): boolean {
  return BUSINESS_ID_RE.test(value);
}

export function publicPlanName(planKey: string | null | undefined): string {
  return planDisplayName(normalizePlanKey(planKey));
}

export function privateAlphaStatusLabel(enabled: boolean): string {
  return enabled ? "Enabled" : "Off";
}
