import { shouldFailClosedTenantCreate } from "@/lib/access/operator-membership";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types/booking";
import { redirect } from "next/navigation";
import { cache } from "react";

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
export async function resolveBusinessForUser(
  userId: string,
): Promise<Business | null> {
  const supabase = await createClient();

  const { data: alphaMembership, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id, created_at, businesses(*)")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .order("created_at", { ascending: true });

  if (membershipError)
    throw new Error("Business access could not be verified.");
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

  const { data: owned, error: ownerError } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (ownerError) throw new Error("Business access could not be verified.");
  return owned;
}

export const getBusiness = cache(async (): Promise<Business | null> => {
  const user = await requireUser();
  return resolveBusinessForUser(user.id);
});

/** Resolve only. Authentication and dashboard reads never create a tenant. */
export const requireBusiness = cache(async (): Promise<Business> => {
  const user = await requireUser();
  const existing = await resolveBusinessForUser(user.id);
  if (existing) return existing;
  if (
    shouldFailClosedTenantCreate({
      resolvedBusiness: existing,
      appMetadata: user.app_metadata,
    })
  )
    redirect("/access-denied");
  redirect("/onboarding/business");
});

/** @deprecated Compatibility alias; resolves or redirects, NEVER creates. */
export const getOrCreateBusiness = requireBusiness;

/**
 * Canonical slug lookup only (`businesses.slug`).
 * Public booking entry points must use `getPublicBusinessBySlug` /
 * `resolvePublicBookingBySlug` so historical aliases redirect or resolve
 * to the same immutable business id.
 */
export async function getBusinessBySlug(
  slug: string,
): Promise<Business | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}
