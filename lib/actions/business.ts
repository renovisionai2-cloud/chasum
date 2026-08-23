import { RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES } from "@/lib/booking/interval";
import { createClient } from "@/lib/supabase/server";
import { marketingPlanIdToDbKey } from "@/lib/marketing/pricing";
import { isPlaceholderBusiness } from "@/lib/onboarding/setup-progress";
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

/**
 * Resolve the active business for the signed-in user.
 * Order: Private Alpha co-owner membership → any owner/admin membership → primary owner_id.
 */
async function resolveBusinessForUser(
  userId: string,
): Promise<Business | null> {
  const supabase = await createClient();

  const { data: alphaMembership } = await supabase
    .from("business_members")
    .select("business_id, created_at, businesses(*)")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .order("created_at", { ascending: true });

  const memberRows = alphaMembership ?? [];
  const alphaHit = memberRows.find((row) => {
    const biz = row.businesses as unknown as Business | Business[] | null;
    const b = Array.isArray(biz) ? biz[0] : biz;
    return Boolean(b?.private_alpha_enabled);
  });
  if (alphaHit) {
    const biz = alphaHit.businesses as unknown as Business | Business[];
    return (Array.isArray(biz) ? biz[0] : biz) ?? null;
  }

  if (memberRows[0]) {
    const biz = memberRows[0].businesses as unknown as Business | Business[];
    const b = Array.isArray(biz) ? biz[0] : biz;
    if (b) return b;
  }

  const { data: owned } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  return owned;
}

export const getBusiness = cache(async (): Promise<Business | null> => {
  const user = await requireUser();
  return resolveBusinessForUser(user.id);
});

/** Deduped per request — layout + pages often call this many times. */
export const getOrCreateBusiness = cache(async (): Promise<Business> => {
  const user = await requireUser();
  const existing = await resolveBusinessForUser(user.id);
  if (existing) return existing;
  // TENANT IDENTITY SAFETY GATE: this path creates a tenant only when the
  // signed-in user has no membership and no owned business. It does not
  // detect whether another tenant already represents the same real-world
  // business. Do not use slug/name uniqueness as proof of a new identity.

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

  let business = data as Business;

  // Recommend 15 only for brand-new placeholder tenants. Never rewrite a named
  // existing business (including live GVM) if this path is hit unexpectedly.
  if (isPlaceholderBusiness(business)) {
    const { data: seeded, error: intervalError } = await supabase
      .from("businesses")
      .update({
        appointment_interval_minutes: RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES,
      })
      .eq("id", business.id)
      .select("*")
      .single();
    if (!intervalError && seeded) {
      business = seeded as Business;
      const { data: locs } = await supabase
        .from("locations")
        .select("id")
        .eq("business_id", business.id);
      const locationIds = (locs ?? []).map((row) => row.id);
      if (locationIds.length > 0) {
        await supabase
          .from("location_settings")
          .update({
            appointment_interval_minutes:
              RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES,
          })
          .in("location_id", locationIds);
      }
    }
  }

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

/**
 * Canonical slug lookup only (`businesses.slug`).
 * Public booking entry points must use `getPublicBusinessBySlug` /
 * `resolvePublicBookingBySlug` so historical aliases redirect or resolve
 * to the same immutable business id.
 */
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}
