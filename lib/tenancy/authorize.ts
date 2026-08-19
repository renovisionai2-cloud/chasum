/**
 * App-level authorized-tenant helpers.
 *
 * Client-provided business ids are never trusted. Callers must build
 * `authorized` only from owner_id rows and business_members rows for
 * the authenticated user, then pick from that list.
 *
 * RLS may still allow broader SELECT on `businesses` (public policy).
 * This module does not replace that policy.
 */

export type AuthorizedBusinessAccess = "owner" | "admin";

export type AuthorizedBusiness = {
  id: string;
  name: string;
  slug: string;
  access: AuthorizedBusinessAccess;
  privateAlphaEnabled: boolean;
  /** Membership created_at, or business created_at for primary owner rows. */
  sortAt: string;
};

export type OwnedBusinessRow = {
  id: string;
  name: string;
  slug: string;
  private_alpha_enabled?: boolean | null;
  created_at: string;
};

export type MembershipJoinRow = {
  business_id: string;
  role: string;
  created_at: string;
  business: OwnedBusinessRow | null;
};

function asAccess(role: string): AuthorizedBusinessAccess | null {
  if (role === "owner") return "owner";
  if (role === "admin") return "admin";
  return null;
}

function fromOwned(row: OwnedBusinessRow): AuthorizedBusiness {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    access: "owner",
    privateAlphaEnabled: Boolean(row.private_alpha_enabled),
    sortAt: row.created_at,
  };
}

/**
 * Union primary-owned businesses with co-owner memberships.
 * Primary owner_id wins over a membership row for the same id.
 */
export function mergeAuthorizedBusinesses(input: {
  owned: OwnedBusinessRow[];
  memberships: MembershipJoinRow[];
}): AuthorizedBusiness[] {
  const byId = new Map<string, AuthorizedBusiness>();

  for (const row of input.owned) {
    if (!row.id) continue;
    byId.set(row.id, fromOwned(row));
  }

  for (const row of input.memberships) {
    const access = asAccess(row.role);
    const biz = row.business;
    if (!access || !biz?.id) continue;
    const existing = byId.get(biz.id);
    if (existing) continue;
    byId.set(biz.id, {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      access,
      privateAlphaEnabled: Boolean(biz.private_alpha_enabled),
      sortAt: row.created_at || biz.created_at,
    });
  }

  return [...byId.values()].sort((a, b) => {
    if (a.sortAt !== b.sortAt) return a.sortAt.localeCompare(b.sortAt);
    return a.id.localeCompare(b.id);
  });
}

export function isAuthorizedBusinessId(
  authorized: AuthorizedBusiness[],
  businessId: string | null | undefined,
): boolean {
  const id = businessId?.trim() ?? "";
  if (!id) return false;
  return authorized.some((row) => row.id === id);
}

/**
 * Active tenant: persisted selection if authorized, else implicit order
 * matching historical resolveBusinessForUser:
 * Private Alpha membership → earliest membership/owned → first authorized.
 */
export function pickActiveBusiness(input: {
  authorized: AuthorizedBusiness[];
  preferredId?: string | null;
}): AuthorizedBusiness | null {
  const { authorized, preferredId } = input;
  if (authorized.length === 0) return null;

  if (preferredId && isAuthorizedBusinessId(authorized, preferredId)) {
    return authorized.find((row) => row.id === preferredId) ?? null;
  }

  const alpha = authorized
    .filter((row) => row.privateAlphaEnabled)
    .sort((a, b) => a.sortAt.localeCompare(b.sortAt) || a.id.localeCompare(b.id));
  if (alpha[0]) return alpha[0];

  return authorized[0] ?? null;
}
