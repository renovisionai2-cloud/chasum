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
  membershipError: null as { message: string } | null,
  ownerError: null as { message: string } | null,
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
            ? { data: runtime.memberRows, error: runtime.membershipError }
            : { data: [], error: null },
        maybeSingle: async () =>
          table === "businesses"
            ? { data: runtime.owned, error: runtime.ownerError }
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
    runtime.membershipError = null;
    runtime.ownerError = null;
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

  it("redirects ordinary signup users to explicit onboarding without creation", async () => {
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
    await expect(getOrCreateBusiness()).rejects.toThrow(
      "NEXT_REDIRECT:/onboarding/business",
    );
    expect(runtime.rpc).not.toHaveBeenCalled();
  });

  it.each(["GVM Baby World", "Chasum HQ"])(
    "preserves the existing primary tenant for %s",
    async (name) => {
      runtime.getUser.mockResolvedValue({
        data: { user: { id: "primary-owner", app_metadata: {} } },
      });
      runtime.owned = {
        id: "canonical-business",
        owner_id: "primary-owner",
        name,
      };
      const { requireBusiness } = await import("@/lib/actions/business");
      expect((await requireBusiness()).id).toBe("canonical-business");
      expect(runtime.rpc).not.toHaveBeenCalled();
    },
  );

  it("preserves membership-first Private Alpha precedence", async () => {
    runtime.getUser.mockResolvedValue({
      data: { user: { id: "member", app_metadata: {} } },
    });
    runtime.owned = { id: "older-shell" };
    runtime.memberRows = [
      {
        business_id: "other",
        created_at: "2020",
        businesses: {
          id: "other",
          name: "Other",
          slug: "other",
          owner_id: "someone",
        },
      },
      {
        business_id: "canonical",
        created_at: "2021",
        businesses: {
          id: "canonical",
          name: "Main",
          slug: "main",
          owner_id: "someone",
          private_alpha_enabled: true,
        },
      },
    ];
    const { requireBusiness } = await import("@/lib/actions/business");
    expect((await requireBusiness()).id).toBe("canonical");
    expect(runtime.rpc).not.toHaveBeenCalled();
  });

  it.each(["membershipError", "ownerError"] as const)(
    "fails closed on %s",
    async (field) => {
      runtime.getUser.mockResolvedValue({
        data: { user: { id: "member", app_metadata: {} } },
      });
      runtime[field] = { message: "lookup failed" };
      const { requireBusiness } = await import("@/lib/actions/business");
      await expect(requireBusiness()).rejects.toThrow(
        "Business access could not be verified",
      );
      expect(runtime.rpc).not.toHaveBeenCalled();
    },
  );
});
