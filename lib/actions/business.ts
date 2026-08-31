import { createClient } from "@/lib/supabase/server";
import { isPlatformOwner } from "@/lib/owner/auth";
import { resolvePostAuthDestination } from "@/lib/tenancy/post-auth-destination";
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
 * Retrieval only — never inserts.
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

/**
 * Require an already-authorized tenant for dashboard product work.
 * Retrieval only — does not create a business as a side effect.
 * Zero-business users are sent to explicit onboarding (or /owner for
 * Platform Admins). Historical name kept so existing loaders keep using
 * the canonical resolver.
 */
export const getOrCreateBusiness = cache(async (): Promise<Business> => {
  const user = await requireUser();
  const existing = await resolveBusinessForUser(user.id);
  if (existing) return existing;

  const isAdmin = await isPlatformOwner(user);
  redirect(
    resolvePostAuthDestination({
      hasAccessibleBusiness: false,
      isPlatformAdmin: isAdmin,
    }),
  );
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
