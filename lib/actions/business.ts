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
import { BUSINESS_ONBOARDING_PATH } from "@/lib/tenancy/post-auth-destination";
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

/**
 * Require an already-authorized tenant for dashboard product work.
 * Retrieval only — does not create a business as a side effect.
 * Zero-business users are sent to explicit onboarding.
 *
 * Historical name kept so existing loaders keep using the canonical resolver.
 */
export const getOrCreateBusiness = cache(async (): Promise<Business> => {
  const existing = await getBusiness();
  if (existing) return existing;
  redirect(BUSINESS_ONBOARDING_PATH);
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
