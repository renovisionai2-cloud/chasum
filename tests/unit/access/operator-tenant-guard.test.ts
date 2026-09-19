import { beforeEach, describe, expect, it, vi } from "vitest";

type MemberRow = {
  business_id: string;
  created_at: string;
  businesses: {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    private_alpha_enabled?: boolean;
  };
};

const runtime = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  memberRows: [] as MemberRow[],
  owned: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: () => runtime.getUser(),
    },
    from: (table: string) => {
      const api = {
        select: () => api,
        eq: () => api,
        in: () => api,
        order: async () =>
          table === "business_members"
            ? { data: runtime.memberRows, error: null }
            : { data: [], error: null },
        maybeSingle: async () =>
          table === "businesses"
            ? { data: runtime.owned, error: null }
            : { data: null, error: null },
      };
      return api;
    },
    rpc: (...args: unknown[]) => runtime.rpc(...args),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => runtime.redirect(url),
}));

const operatorUser = {
  id: "op-1",
  email: "op@tenant.test",
  app_metadata: { chasum_operator: { status: "invited" } },
  user_metadata: {},
};

describe("getOrCreateBusiness trusted-operator fail-closed", () => {
  beforeEach(() => {
    vi.resetModules();
    runtime.getUser.mockReset();
    runtime.rpc.mockReset();
    runtime.redirect.mockClear();
    runtime.memberRows = [];
    runtime.owned = null;
  });

  it("does not call ensure_business_for_owner when the invited marker is present and no membership exists", async () => {
    runtime.getUser.mockResolvedValue({
      data: {
        user: {
          ...operatorUser,
          app_metadata: { chasum_operator: { status: "invited" } },
        },
      },
    });
    const { getOrCreateBusiness } = await import("@/lib/actions/business");
    await expect(getOrCreateBusiness()).rejects.toThrow(
      "NEXT_REDIRECT:/access-denied",
    );
    expect(runtime.rpc).not.toHaveBeenCalled();
  });

  it("does not call ensure_business_for_owner when the revoked marker is present and no membership exists", async () => {
    runtime.getUser.mockResolvedValue({
      data: {
        user: {
          ...operatorUser,
          app_metadata: { chasum_operator: { status: "revoked" } },
        },
      },
    });
    const { getOrCreateBusiness } = await import("@/lib/actions/business");
    await expect(getOrCreateBusiness()).rejects.toThrow(
      "NEXT_REDIRECT:/access-denied",
    );
    expect(runtime.rpc).not.toHaveBeenCalled();
  });

  it("resolves the target tenant when the operator has membership and does not auto-create", async () => {
    runtime.memberRows = [
      {
        business_id: "biz-1",
        created_at: "2026-09-19T00:00:00.000Z",
        businesses: {
          id: "biz-1",
          name: "GVM Baby World",
          slug: "gvm-baby-world",
          owner_id: "owner-1",
          private_alpha_enabled: true,
        },
      },
    ];
    runtime.getUser.mockResolvedValue({ data: { user: operatorUser } });
    const { getOrCreateBusiness } = await import("@/lib/actions/business");
    const business = await getOrCreateBusiness();
    expect(business.id).toBe("biz-1");
    expect(runtime.rpc).not.toHaveBeenCalled();
  });

  it("still auto-creates for ordinary signup users without the marker", async () => {
    runtime.getUser.mockResolvedValue({
      data: {
        user: {
          id: "new-1",
          email: "founder@tenant.test",
          app_metadata: { provider: "email" },
          user_metadata: { full_name: "Founder" },
        },
      },
    });
    runtime.rpc.mockResolvedValue({
      data: {
        id: "biz-new",
        name: "Founder Studio",
        slug: "founder-studio",
        owner_id: "new-1",
      },
      error: null,
    });
    const { getOrCreateBusiness } = await import("@/lib/actions/business");
    const business = await getOrCreateBusiness();
    expect(runtime.rpc).toHaveBeenCalledWith(
      "ensure_business_for_owner",
      expect.any(Object),
    );
    expect(business.id).toBe("biz-new");
  });
});
