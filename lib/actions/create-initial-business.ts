"use server";

import { getBusiness, requireUser } from "@/lib/actions/business";
import {
  DEFAULT_ONBOARDING_CURRENCY,
  DEFAULT_ONBOARDING_TIMEZONE,
  validateOnboardingCurrency,
  validateOnboardingTimezone,
} from "@/lib/onboarding/business-locale";
import {
  preferredSlugForBusinessName,
  validateBusinessName,
} from "@/lib/onboarding/business-name";
import { createClient } from "@/lib/supabase/server";
import { DASHBOARD_PATH } from "@/lib/tenancy/post-auth-destination";
import type { ActionState, Business } from "@/lib/types/booking";
import { redirect } from "next/navigation";

function asBusiness(value: unknown): Business | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  return row as Business;
}

/**
 * Explicit first-tenant creation. Call only from the onboarding form submit.
 * Does not infer a name from auth metadata. Does not copy signup plan
 * intent onto the billed product plan. Does not create Stripe billing.
 */
export async function createInitialBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const existing = await getBusiness();
  if (existing) {
    redirect(DASHBOARD_PATH);
  }

  const parsed = validateBusinessName(
    String(formData.get("businessName") ?? ""),
  );
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const timezone =
    validateOnboardingTimezone(String(formData.get("timezone") ?? "")) ??
    DEFAULT_ONBOARDING_TIMEZONE;
  const currency =
    validateOnboardingCurrency(String(formData.get("currency") ?? "")) ??
    DEFAULT_ONBOARDING_CURRENCY;

  const supabase = await createClient();
  const preferredSlug = preferredSlugForBusinessName(parsed.name, user.id);

  const { data, error } = await supabase.rpc("ensure_business_for_owner", {
    p_name: parsed.name,
    p_preferred_slug: preferredSlug,
  });

  if (error) {
    return { error: error.message };
  }

  const created = asBusiness(data);
  if (!created) {
    return { error: "Your business could not be created. Please try again." };
  }

  // RPC returns an existing authorized tenant if one already exists.
  // Never rename or re-plan another tenant as a side effect.
  if (created.owner_id !== user.id || created.name.trim() !== parsed.name) {
    redirect(DASHBOARD_PATH);
  }

  await supabase
    .from("businesses")
    .update({ timezone, currency })
    .eq("id", created.id)
    .eq("owner_id", user.id);

  redirect(DASHBOARD_PATH);
}
