import { describe, expect, it } from "vitest";
import {
  isAuthorizedBusinessId,
  mergeAuthorizedBusinesses,
  pickActiveBusiness,
  type AuthorizedBusiness,
  type MembershipJoinRow,
  type OwnedBusinessRow,
} from "@/lib/tenancy/authorize";

const gvm: OwnedBusinessRow = {
  id: "biz-gvm",
  name: "GVM Baby World",
  slug: "gvm",
  private_alpha_enabled: false,
  created_at: "2026-01-01T00:00:00.000Z",
};

const hq: OwnedBusinessRow = {
  id: "biz-hq",
  name: "Chasum HQ",
  slug: "chasum-hq",
  private_alpha_enabled: false,
  created_at: "2026-08-01T00:00:00.000Z",
};

const alpha: OwnedBusinessRow = {
  id: "biz-alpha",
  name: "Design Partner",
  slug: "alpha",
  private_alpha_enabled: true,
  created_at: "2026-03-01T00:00:00.000Z",
};

function ownedOnly(rows: OwnedBusinessRow[]): AuthorizedBusiness[] {
  return mergeAuthorizedBusinesses({ owned: rows, memberships: [] });
}

describe("authorized business merge", () => {
  it("keeps a primary owned business and ignores duplicate membership", () => {
    const memberships: MembershipJoinRow[] = [
      {
        business_id: gvm.id,
        role: "owner",
        created_at: "2026-02-01T00:00:00.000Z",
        business: gvm,
      },
    ];
    const authorized = mergeAuthorizedBusinesses({
      owned: [gvm],
      memberships,
    });
    expect(authorized).toHaveLength(1);
    expect(authorized[0]?.id).toBe(gvm.id);
    expect(authorized[0]?.access).toBe("owner");
  });

  it("adds a co-owned tenant that the user does not primary-own", () => {
    const memberships: MembershipJoinRow[] = [
      {
        business_id: hq.id,
        role: "admin",
        created_at: "2026-08-02T00:00:00.000Z",
        business: hq,
      },
    ];
    const authorized = mergeAuthorizedBusinesses({
      owned: [gvm],
      memberships,
    });
    expect(authorized.map((row) => row.id)).toEqual([gvm.id, hq.id]);
    expect(authorized.find((row) => row.id === hq.id)?.access).toBe("admin");
  });

  it("ignores membership rows without owner/admin role", () => {
    const memberships: MembershipJoinRow[] = [
      {
        business_id: hq.id,
        role: "staff",
        created_at: "2026-08-02T00:00:00.000Z",
        business: hq,
      },
    ];
    expect(
      mergeAuthorizedBusinesses({ owned: [gvm], memberships }),
    ).toHaveLength(1);
  });
});

describe("pickActiveBusiness", () => {
  it("uses persisted selection only when it is authorized", () => {
    const authorized = ownedOnly([gvm, hq]);
    const picked = pickActiveBusiness({
      authorized,
      preferredId: hq.id,
    });
    expect(picked?.id).toBe(hq.id);
  });

  it("rejects an unauthorized business id and falls back safely", () => {
    const authorized = ownedOnly([gvm]);
    expect(isAuthorizedBusinessId(authorized, "biz-other")).toBe(false);
    const picked = pickActiveBusiness({
      authorized,
      preferredId: "biz-other",
    });
    expect(picked?.id).toBe(gvm.id);
  });

  it("keeps a single-business user on that tenant", () => {
    const authorized = ownedOnly([gvm]);
    expect(
      pickActiveBusiness({ authorized, preferredId: null })?.id,
    ).toBe(gvm.id);
    expect(
      pickActiveBusiness({ authorized, preferredId: gvm.id })?.id,
    ).toBe(gvm.id);
  });

  it("prefers Private Alpha when no valid cookie is stored", () => {
    const authorized = mergeAuthorizedBusinesses({
      owned: [gvm],
      memberships: [
        {
          business_id: alpha.id,
          role: "owner",
          created_at: "2026-03-02T00:00:00.000Z",
          business: alpha,
        },
      ],
    });
    expect(pickActiveBusiness({ authorized, preferredId: null })?.id).toBe(
      alpha.id,
    );
  });

  it("falls back when the stored business no longer exists", () => {
    const authorized = ownedOnly([gvm]);
    expect(
      pickActiveBusiness({
        authorized,
        preferredId: "deleted-tenant",
      })?.id,
    ).toBe(gvm.id);
  });

  it("returns null when the user has no authorized businesses", () => {
    expect(pickActiveBusiness({ authorized: [], preferredId: gvm.id })).toBe(
      null,
    );
  });
});
