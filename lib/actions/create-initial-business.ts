"use server";

import { getBusiness, requireUser } from "@/lib/actions/business";
import { RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES } from "@/lib/booking/interval";
import { marketingPlanIdToDbKey } from "@/lib/marketing/pricing";
import { preferredSlugForBusinessName } from "@/lib/onboarding/business-name";
import { validateFirstBusinessInput } from "@/lib/onboarding/first-business";
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

function readSubmittedFields(formData: FormData) {
  return {
    name: String(formData.get("businessName") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    currency: String(formData.get("currency") ?? ""),
  };
}

async function stampOperatingProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    businessId: string;
    ownerId: string;
    timezone: string;
    currency: string;
    preferredPlan?: string;
    seedBookingInterval: boolean;
  },
): Promise<{ error?: string }> {
  const patch: {
    timezone: string;
    currency: string;
    subscription_plan_key?: string;
    appointment_interval_minutes?: number;
  } = {
    timezone: input.timezone,
    currency: input.currency,
  };
  if (input.preferredPlan) {
    patch.subscription_plan_key = marketingPlanIdToDbKey(input.preferredPlan);
  }
  if (input.seedBookingInterval) {
    patch.appointment_interval_minutes =
      RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES;
  }

  const { data, error } = await supabase
    .from("businesses")
    .update(patch)
    .eq("id", input.businessId)
    .eq("owner_id", input.ownerId)
    .select("id, timezone, currency, appointment_interval_minutes")
    .single();

  if (error || !data) {
    return {
      error:
        "Your business could not be saved with the selected timezone and currency. Please try again.",
    };
  }

  if (data.timezone !== input.timezone || data.currency !== input.currency) {
    return {
      error:
        "Your business could not be saved with the selected timezone and currency. Please try again.",
    };
  }

  if (
    input.seedBookingInterval &&
    data.appointment_interval_minutes !==
      RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES
  ) {
    return {
      error:
        "Your business could not be saved with the recommended booking interval. Please try again.",
    };
  }

  const { error: locationError } = await supabase
    .from("locations")
    .update({ timezone: input.timezone })
    .eq("business_id", input.businessId)
    .eq("is_default", true);

  if (locationError) {
    return {
      error:
        "Your business was created, but the location timezone could not be saved. Open Business settings to set it.",
    };
  }

  if (input.seedBookingInterval) {
    const { data: defaultLocations, error: defaultLocationError } =
      await supabase
        .from("locations")
        .select("id")
        .eq("business_id", input.businessId)
        .eq("is_default", true);

    if (defaultLocationError) {
      return {
        error:
          "Your business was created, but the location booking interval could not be saved. Open Business settings to set it.",
      };
    }

    const locationIds = (defaultLocations ?? []).map((row) => String(row.id));
    if (locationIds.length > 0) {
      const { error: settingsError } = await supabase
        .from("location_settings")
        .update({
          appointment_interval_minutes:
            RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES,
        })
        .in("location_id", locationIds);

      if (settingsError) {
        return {
          error:
            "Your business was created, but the location booking interval could not be saved. Open Business settings to set it.",
        };
      }
    }
  }

  return {};
}

/**
 * Explicit first-tenant creation. Call only from the onboarding form submit.
 * Does not infer a name from auth metadata. Does not create SaaS billing rows.
 */
export async function createInitialBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = validateFirstBusinessInput(readSubmittedFields(formData));
  const existing = await getBusiness();

  if (existing) {
    if (
      parsed.ok &&
      existing.owner_id === user.id &&
      existing.name.trim() === parsed.value.name
    ) {
      const supabase = await createClient();
      const preferred = user.user_metadata?.preferred_plan as string | undefined;
      // Existing tenants keep their interval. Timezone/currency/plan may
      // still be repaired after a partial first create. There is no
      // persisted onboarding-incomplete signal, so configuration values
      // (including New York + USD + 30) must never imply a rewrite.
      const stamped = await stampOperatingProfile(supabase, {
        businessId: existing.id,
        ownerId: user.id,
        timezone: parsed.value.timezone,
        currency: parsed.value.currency,
        preferredPlan: preferred,
        seedBookingInterval: false,
      });
      if (stamped.error) {
        return { error: stamped.error };
      }
    }
    redirect(DASHBOARD_PATH);
  }

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const preferredSlug = preferredSlugForBusinessName(parsed.value.name, user.id);

  const { data, error } = await supabase.rpc("ensure_business_for_owner", {
    p_name: parsed.value.name,
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
  if (created.owner_id !== user.id || created.name.trim() !== parsed.value.name) {
    redirect(DASHBOARD_PATH);
  }

  const preferred = user.user_metadata?.preferred_plan as string | undefined;
  // First create in this request: getBusiness() found no tenant. Seed 15
  // here only — never from timezone/currency/interval inference.
  const stamped = await stampOperatingProfile(supabase, {
    businessId: created.id,
    ownerId: user.id,
    timezone: parsed.value.timezone,
    currency: parsed.value.currency,
    preferredPlan: preferred,
    seedBookingInterval: true,
  });
  if (stamped.error) {
    return { error: stamped.error };
  }

  redirect(DASHBOARD_PATH);
}
