/**
 * Private Alpha / plan entitlement helpers.
 * Free (starter) stays the billed plan; private_alpha_enabled unlocks partner features.
 */

import { APPLY_HREF } from "@/lib/marketing/alpha";
import { FREE_PLAN_UPGRADE_CTA } from "@/lib/marketing/pricing";

export type PlanGateBusiness = {
  subscription_plan_key?: string | null;
  private_alpha_enabled?: boolean | null;
};

export function businessHasPrivateAlpha(
  business: PlanGateBusiness | null | undefined,
): boolean {
  return Boolean(business?.private_alpha_enabled);
}

/** Effective plan key for feature gates (not billing display). */
export function effectivePlanKeyForFeatures(
  business: PlanGateBusiness | null | undefined,
): string {
  if (businessHasPrivateAlpha(business)) return "professional";
  return (business?.subscription_plan_key ?? "starter").toLowerCase();
}

export function planIncludesSms(
  planKeyOrBusiness: string | null | undefined | PlanGateBusiness,
): boolean {
  if (
    planKeyOrBusiness &&
    typeof planKeyOrBusiness === "object" &&
    businessHasPrivateAlpha(planKeyOrBusiness)
  ) {
    return true;
  }
  const key =
    typeof planKeyOrBusiness === "string" ||
    planKeyOrBusiness == null
      ? (planKeyOrBusiness ?? "starter")
      : (planKeyOrBusiness.subscription_plan_key ?? "starter");
  const normalized = String(key).toLowerCase();
  return normalized !== "starter" && normalized !== "free";
}

/**
 * Professional+ (and Private Alpha via effectivePlanKey) may remove
 * “Powered by Chasum” from customer-facing emails.
 * Alpha status alone does not force Chasum branding — it elevates to Professional.
 */
export function planAllowsRemoveBranding(
  business: PlanGateBusiness | null | undefined,
): boolean {
  const key = effectivePlanKeyForFeatures(business);
  return (
    key === "professional" ||
    key === "business" ||
    key === "enterprise" ||
    key === "pro"
  );
}

export const SMS_PLAN_UPGRADE_MESSAGE =
  "SMS is not included on the Free plan. Request Professional through Private Alpha to text customers from Chasum — your plan includes email only.";

export const SMS_PLAN_UPGRADE_CTA = FREE_PLAN_UPGRADE_CTA;
export const SMS_PLAN_UPGRADE_HREF = APPLY_HREF;

export const SMS_PROVIDER_MISSING_MESSAGE =
  "SMS is enabled on your plan, but Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER, then try again.";
