/**
 * Plan feature gates for GVM / Private Alpha.
 * Marketing: Free (starter) = email only; Professional+ = SMS when Twilio is configured.
 */

import { APPLY_HREF } from "@/lib/marketing/alpha";
import { FREE_PLAN_UPGRADE_CTA } from "@/lib/marketing/pricing";

export function planIncludesSms(
  planKey: string | null | undefined,
): boolean {
  const key = (planKey ?? "starter").toLowerCase();
  return key !== "starter" && key !== "free";
}

export const SMS_PLAN_UPGRADE_MESSAGE =
  "SMS is not included on the Free plan. Upgrade to Professional to text customers from Chasum — your plan includes email only.";

export const SMS_PLAN_UPGRADE_CTA = FREE_PLAN_UPGRADE_CTA;
export const SMS_PLAN_UPGRADE_HREF = APPLY_HREF;

export const SMS_PROVIDER_MISSING_MESSAGE =
  "SMS is enabled on your plan, but Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER, then try again.";
