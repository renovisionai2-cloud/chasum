"use server";

import { getBusiness, requireUser } from "@/lib/actions/business";
import { marketingPlanIdToDbKey } from "@/lib/marketing/pricing";
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

async function applyPreferredPlan(
  business: Business,
  preferredPlan: string | undefined,
): Promise<Business> {
  if (!preferredPlan) return business;
  const planKey = marketingPlanIdToDbKey(preferredPlan);
  if (business.subscription_plan_key === planKey) return business;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .update({ subscription_plan_key: planKey })
    .eq("id", business.id)
    .select("*")
    .single();

  if (error || !data) return business;
  return data as Business;
}

/**
 * Explicit first-tenant creation. Call only from the onboarding form submit.
 * Does not infer a name from auth metadata. Does not create Stripe billing.
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

  const parsed = validateBusinessName(String(formData.get("businessName") ?? ""));
  if (!parsed.ok) {
    return { error: parsed.error };
  }

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

  const preferred = user.user_metadata?.preferred_plan as string | undefined;
  await applyPreferredPlan(created, preferred);

  redirect(DASHBOARD_PATH);
}
