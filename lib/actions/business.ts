import { RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES } from "@/lib/booking/interval";
import { marketingPlanIdToDbKey } from "@/lib/marketing/pricing";
import { isPlaceholderBusiness } from "@/lib/onboarding/setup-progress";
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/supabase/errors";
import {
  mergeAuthorizedBusinesses,
  pickActiveBusiness,
  type AuthorizedBusiness,
  type MembershipJoinRow,
  type OwnedBusinessRow,
} from "@/lib/tenancy/authorize";
import { readActiveBusinessCookie } from "@/lib/tenancy/cookie";
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

function asBusiness(value: unknown): Business | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  return row as Business;
}

function toOwnedRow(row: Business): OwnedBusinessRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    private_alpha_enabled: row.private_alpha_enabled,
    created_at: row.created_at,
  };
}

async function loadAuthorizedForUser(
  userId: string,
): Promise<{ authorized: AuthorizedBusiness[]; byId: Map<string, Business> }> {
  const supabase = await createClient();
  const byId = new Map<string, Business>();

  const { data: ownedRows } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId);

  const owned: OwnedBusinessRow[] = [];
  for (const row of ownedRows ?? []) {
    const biz = asBusiness(row);
    if (!biz) continue;
    byId.set(biz.id, biz);
    owned.push(toOwnedRow(biz));
  }

  const memberships: MembershipJoinRow[] = [];
  const { data: memberRows, error: memberError } = await supabase
    .from("business_members")
    .select("business_id, role, created_at, businesses(*)")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"]);

  if (memberError) {
    logQueryError("tenancy.business_members", memberError.message);
  } else {
    for (const row of memberRows ?? []) {
      const biz = asBusiness(row.businesses);
      if (biz) byId.set(biz.id, biz);
      memberships.push({
        business_id: String(row.business_id),
        role: String(row.role ?? ""),
        created_at: String(row.created_at ?? ""),
        business: biz ? toOwnedRow(biz) : null,
      });
    }
  }

  return {
    authorized: mergeAuthorizedBusinesses({ owned, memberships }),
    byId,
  };
}

/**
 * Businesses the signed-in user may operate.
 * Built only from owner_id + business_members — never from a client-supplied id.
 */
export const listAuthorizedBusinesses = cache(
  async (): Promise<AuthorizedBusiness[]> => {
    const user = await requireUser();
    const { authorized } = await loadAuthorizedForUser(user.id);
    return authorized;
  },
);

async function resolveAuthorizedActiveBusiness(
  userId: string,
): Promise<Business | null> {
  const { authorized, byId } = await loadAuthorizedForUser(userId);
  const preferredId = await readActiveBusinessCookie();
  const picked = pickActiveBusiness({ authorized, preferredId });
  if (!picked) return null;
  return byId.get(picked.id) ?? null;
}

export const getBusiness = cache(async (): Promise<Business | null> => {
  const user = await requireUser();
  return resolveAuthorizedActiveBusiness(user.id);
});

/** Deduped per request — layout + pages often call this many times. */
export const getOrCreateBusiness = cache(async (): Promise<Business> => {
  const user = await requireUser();
  const existing = await resolveAuthorizedActiveBusiness(user.id);
  if (existing) return existing;

  const supabase = await createClient();

  const baseName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    "My Business";
  const emailPrefix = user.email?.split("@")[0] ?? "business";
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
 * Public booking lookup by slug. Not a dashboard tenant resolver.
 * Do not use this to activate a tenant from operator UI.
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
