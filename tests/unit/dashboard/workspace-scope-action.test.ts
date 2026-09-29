import { beforeEach, describe, expect, it, vi } from "vitest";
import { setLocationScope } from "@/lib/actions/location";
import { parseLocationScope } from "@/lib/location/constants";

const mocks = vi.hoisted(() => ({
  business: vi.fn(), client: vi.fn(), cookies: vi.fn(), setCookie: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: mocks.business }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@/lib/location/scope", () => ({ readLocationScopeCookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.business.mockResolvedValue({ id: "current-business" });
  mocks.cookies.mockResolvedValue({ set: mocks.setCookie });
});

describe("existing canonical workspace setter used by M1A", () => {
  it("verifies tenant ownership, writes the HTTP-only canonical cookie and invalidates the dashboard layout", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: "owned-location" } }) };
    const from = vi.fn().mockReturnValue(query);
    mocks.client.mockResolvedValue({ from });
    await setLocationScope("owned-location");
    expect(from).toHaveBeenCalledExactlyOnceWith("locations");
    expect(query.eq.mock.calls).toEqual([["id", "owned-location"], ["business_id", "current-business"]]);
    expect(mocks.setCookie).toHaveBeenCalledExactlyOnceWith("chasum_location_scope", "owned-location", {
      path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365,
    });
    expect(mocks.revalidate).toHaveBeenCalledExactlyOnceWith("/dashboard", "layout");
    expect(parseLocationScope(mocks.setCookie.mock.calls[0][1], "default")).toEqual({ mode: "single", locationId: "owned-location" });
  });

  it("rejects an unavailable or foreign location before cookie mutation or refresh", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null }) };
    mocks.client.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });
    await expect(setLocationScope("foreign-location")).rejects.toThrow("Location not found");
    expect(query.eq).toHaveBeenCalledWith("business_id", "current-business");
    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("round-trips ALL without collapsing to the default location", async () => {
    const from = vi.fn();
    mocks.client.mockResolvedValue({ from });
    await setLocationScope("ALL");
    expect(from).not.toHaveBeenCalled();
    expect(mocks.setCookie).toHaveBeenCalledWith("chasum_location_scope", "ALL", expect.objectContaining({ path: "/", httpOnly: true }));
    expect(parseLocationScope(mocks.setCookie.mock.calls[0][1], "default")).toEqual({ mode: "all" });
  });
});
