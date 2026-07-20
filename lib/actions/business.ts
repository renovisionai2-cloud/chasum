import { createClient } from "@/lib/supabase/server";
import { marketingPlanIdToDbKey } from "@/lib/marketing/pricing";
import type { Business } from "@/lib/types/booking";
import { redirect } from "next/navigation";
import { cache } from "react";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

export const getBusiness = cache(async (): Promise<Business | null> => {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return data;
});

/** Deduped per request — layout + pages often call this many times. */
export const getOrCreateBusiness = cache(async (): Promise<Business> => {
  const user = await requireUser();
  const supabase = await createClient();

  const baseName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    "My Business";
  const emailPrefix = user.email?.split("@")[0] ?? "business";
  // Prefer a human slug from the display name; avoid long opaque email local-parts.
  const fromName = slugify(baseName);
  const fromEmail = slugify(emailPrefix);
  const preferredSlug =
    fromName && fromName !== "my-business" && fromName.length >= 3
      ? fromName
      : fromEmail && !/\d{8,}/.test(fromEmail) && fromEmail.length <= 32
        ? fromEmail
        : `biz-${user.id.replace(/-/g, "").slice(0, 8)}`;

  const { data, error } = await supabase.rpc("ensure_business_for_owner", {
    p_name: baseName,
    p_preferred_slug: preferredSlug,
  });

  if (error) {
    throw new Error(error.message);
  }

  const business = data as Business;
  const preferred = user.user_metadata?.preferred_plan as string | undefined;
  if (preferred) {
    const planKey = marketingPlanIdToDbKey(preferred);
    if (business.subscription_plan_key !== planKey) {
      const { data: updated, error: planError } = await supabase
        .from("businesses")
        .update({ subscription_plan_key: planKey })
        .eq("id", business.id)
        .select("*")
        .single();
      if (!planError && updated) {
        return updated as Business;
      }
    }
  }

  return business;
});

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}
