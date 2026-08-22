/**
 * Canonical numeric plan entitlements.
 *
 * Marketing copy, billing fallback catalog, and server-side quota guards
 * must derive staff/location maxima from these constants so the numbers
 * cannot silently diverge.
 *
 * Inventory and Voice AI are product-status truths (Coming Soon), not
 * numeric entitlements — see lib/marketing/pricing.ts and the Roadmap.
 *
 * PRODUCT OWNER DECISION REQUIRED — SAAS SUBSCRIPTION CURRENCY:
 * No canonical Chasum SaaS list-price currency is locked. Do not invent
 * USD or CAD on public $79 / $149 labels. Tenant operational currency
 * (e.g. Chasum HQ = CAD) is separate.
 */

import type { PlanKey } from "@/lib/billing/types";

/** Finite maximum, or null = unlimited. */
export const PLAN_STAFF_LIMITS: Record<PlanKey, number | null> = {
  starter: 1,
  professional: 3,
  business: null,
  enterprise: null,
};

/** Finite maximum, or null = unlimited. Locked Business rule = 6 (not 10). */
export const PLAN_LOCATION_LIMITS: Record<PlanKey, number | null> = {
  starter: 1,
  professional: 3,
  business: 6,
  enterprise: null,
};

export const STAFF_LIMIT_REACHED_CODE = "STAFF_LIMIT_REACHED";
export const LOCATION_LIMIT_REACHED_CODE = "LOCATION_LIMIT_REACHED";

export const PAID_PLANS_PRIVATE_ALPHA_NOTE =
  "Paid plans are currently approved through Private Alpha.";

export const SAAS_SUBSCRIPTION_CURRENCY_DECISION =
  "PRODUCT OWNER DECISION REQUIRED — SAAS SUBSCRIPTION CURRENCY";

const PLAN_DISPLAY_NAME: Record<PlanKey, string> = {
  starter: "Free",
  professional: "Professional",
  business: "Business",
  enterprise: "Enterprise",
};

export function planDisplayName(planKey: PlanKey): string {
  return PLAN_DISPLAY_NAME[planKey];
}

export function normalizePlanKey(
  value: string | null | undefined,
): PlanKey {
  const key = String(value ?? "starter").toLowerCase();
  if (key === "free") return "starter";
  if (key === "pro") return "professional";
  if (
    key === "starter" ||
    key === "professional" ||
    key === "business" ||
    key === "enterprise"
  ) {
    return key;
  }
  return "starter";
}

export function maxStaffForPlan(
  planKey: string | null | undefined,
): number | null {
  return PLAN_STAFF_LIMITS[normalizePlanKey(planKey)];
}

export function maxLocationsForPlan(
  planKey: string | null | undefined,
): number | null {
  return PLAN_LOCATION_LIMITS[normalizePlanKey(planKey)];
}

export function marketingLimitLabel(max: number | null): string {
  if (max === null) return "Unlimited";
  if (max === 1) return "1";
  return `Up to ${max}`;
}

export function marketingStaffLimitLabel(
  planKey: string | null | undefined,
): string {
  return marketingLimitLabel(maxStaffForPlan(planKey));
}

export function marketingLocationLimitLabel(
  planKey: string | null | undefined,
): string {
  return marketingLimitLabel(maxLocationsForPlan(planKey));
}

export type StaffQuotaDecision = {
  allowed: boolean;
  max: number | null;
  currentCount: number;
  remaining: number | null;
  planKey: PlanKey;
  code: typeof STAFF_LIMIT_REACHED_CODE | null;
  message: string | null;
};

/**
 * Grandfathering: existing rows above the cap stay. This only decides
 * whether a NEW staff insert is allowed.
 */
export function evaluateStaffQuota(
  currentCount: number,
  planKey: string | null | undefined,
): StaffQuotaDecision {
  const key = normalizePlanKey(planKey);
  const max = maxStaffForPlan(key);
  if (max === null || currentCount < max) {
    return {
      allowed: true,
      max,
      currentCount,
      remaining: max === null ? null : Math.max(0, max - currentCount),
      planKey: key,
      code: null,
      message: null,
    };
  }
  return {
    allowed: false,
    max,
    currentCount,
    remaining: 0,
    planKey: key,
    code: STAFF_LIMIT_REACHED_CODE,
    message: staffLimitReachedMessage(key, max),
  };
}

export function staffLimitReachedMessage(
  planKey: PlanKey,
  max: number,
): string {
  const name = planDisplayName(planKey);
  if (max === 1) {
    return `You've reached the 1 staff member included in ${name}.`;
  }
  return `You've reached the ${max} staff members included in ${name}.`;
}

export type LocationQuotaDecision = {
  canAdd: boolean;
  max: number | null;
  currentCount: number;
  planKey: PlanKey;
  code: typeof LOCATION_LIMIT_REACHED_CODE | null;
  message: string | null;
};

/**
 * Application-layer location cap. Canonical catalog wins over a stale
 * database `subscription_plans.max_locations` (Business was seeded as 10).
 * Existing locations above the cap are grandfathered; only new adds block.
 *
 * Private Alpha RPC `can_add_location` may still return true. This helper
 * is the billed-plan product rule and must be applied in application code.
 */
export function evaluateLocationQuota(
  currentCount: number,
  planKey: string | null | undefined,
): LocationQuotaDecision {
  const key = normalizePlanKey(planKey);
  const max = maxLocationsForPlan(key);
  if (max === null || currentCount < max) {
    return {
      canAdd: true,
      max,
      currentCount,
      planKey: key,
      code: null,
      message: null,
    };
  }
  return {
    canAdd: false,
    max,
    currentCount,
    planKey: key,
    code: LOCATION_LIMIT_REACHED_CODE,
    message: locationLimitReachedMessage(key, max, currentCount),
  };
}

export function locationLimitReachedMessage(
  planKey: PlanKey,
  max: number,
  currentCount: number,
): string {
  const name = planDisplayName(planKey);
  return `You've reached the ${max} location${max === 1 ? "" : "s"} included in ${name} (${currentCount} in use).`;
}
