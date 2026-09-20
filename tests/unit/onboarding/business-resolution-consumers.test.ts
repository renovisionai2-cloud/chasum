import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  require: vi.fn(),
  user: vi.fn(),
  locations: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/actions/business", () => ({
  requireBusiness: mocks.require,
  getOrCreateBusiness: mocks.require,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.user },
    from: () => ({ update: mocks.update }),
    rpc: mocks.rpc,
  }),
}));
vi.mock("@/lib/actions/location", () => ({
  getLocations: mocks.locations,
  getLocationScope: vi.fn(),
  getLocationQuota: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  getSupabaseEnv: () => ({ url: "https://example.invalid" }),
}));
vi.mock("@/components/dashboard/shell", () => ({ DashboardShell: () => null }));
vi.mock("@/components/system/preview-build-badge", () => ({
  PreviewBuildBadge: () => null,
}));
vi.mock("@/lib/owner/auth", () => ({ isPlatformOwner: () => false }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(url);
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ data: { user: { id: "owner" } } });
});
describe("shared business resolution consumers", () => {
  it("dashboard stops before downstream location loads for a zero-business user", async () => {
    mocks.require.mockRejectedValue(new Error("/onboarding/business"));
    const { default: Layout } = await import("@/app/(dashboard)/layout");
    await expect(Layout({ children: null })).rejects.toThrow(
      "/onboarding/business",
    );
    expect(mocks.locations).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("business profile save remains a tenant-scoped session update", async () => {
    mocks.require.mockResolvedValue({
      id: "canonical",
      slug: "existing",
      timezone: "America/Toronto",
    });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockResolvedValue({ error: null });
    const { updateBusinessManagementProfile } = await import(
      "@/lib/actions/business-management"
    );
    const form = new FormData();
    form.set("name", "Updated Studio");
    form.set("slug", "updated-studio");
    await updateBusinessManagementProfile({}, form);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Updated Studio",
        slug: "updated-studio",
      }),
    );
    expect(mocks.eq).toHaveBeenCalledWith("id", "canonical");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
