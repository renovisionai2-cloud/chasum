import { beforeEach, describe, expect, it, vi } from "vitest";
import { enableServiceAtLocation, getOperatorServiceCatalog, getPublicServices, getServices } from "@/lib/actions/services";
const mock = vi.hoisted(() => ({ from: vi.fn(), business: vi.fn(), revalidate: vi.fn(), scope: vi.fn() }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: mock.business }));
vi.mock("@/lib/actions/location", () => ({ getLocationScope: mock.scope, getActiveLocationId: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mock.from }) }));
vi.mock("next/cache", () => ({ revalidatePath: mock.revalidate }));
function query(data: unknown, error: unknown = null) {
  const result = { data, error };
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result), upsert: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve) };
}
beforeEach(() => { vi.clearAllMocks(); mock.business.mockResolvedValue({ id: "tenant" }); mock.scope.mockResolvedValue({ mode: "single", locationId: "primary" }); });
describe("operator catalog boundary", () => {
  it("reads all business services + relationships in one query, ignores active scope", async () => {
    const data = [{ id: "service", location_id: "primary", service_locations: [{ location_id: "secondary" }] }];
    const q = query(data); mock.from.mockReturnValue(q);
    expect(await getOperatorServiceCatalog()).toEqual(data);
    expect(q.select).toHaveBeenCalledWith("*, service_locations(location_id)");
    expect(q.eq.mock.calls).toEqual([["business_id", "tenant"]]);
    expect(mock.from).toHaveBeenCalledTimes(1); expect(mock.scope).not.toHaveBeenCalled();
  });
  it("does not hide membership errors as empty catalog", async () => {
    mock.from.mockReturnValue(query(null, { message: "relationship unavailable" }));
    await expect(getOperatorServiceCatalog()).rejects.toThrow("relationship unavailable");
  });
  it("preserves unrelated getServices location scoping", async () => {
    const q = query([]); mock.from.mockReturnValue(q); await getServices();
    expect(q.eq).toHaveBeenCalledWith("location_id", "primary");
    expect(q.select).toHaveBeenCalledWith("*");
  });
  it("preserves public filters and honors secondary service memberships", async () => {
    const q = query([
      { id: "online", location_id: "primary", booking_visibility: "online", service_locations: [{ location_id: "secondary" }] },
      { id: "internal", location_id: "primary", booking_visibility: "internal", service_locations: [{ location_id: "secondary" }] },
      { id: "elsewhere", location_id: "primary", booking_visibility: "online", service_locations: [] },
    ]);
    mock.from.mockReturnValue(q);
    expect(await getPublicServices("tenant", "secondary")).toEqual([
      { id: "online", location_id: "primary", booking_visibility: "online", service_locations: [{ location_id: "secondary" }] },
    ]);
    expect(q.eq.mock.calls).toEqual([["business_id", "tenant"], ["is_active", true], ["online_booking", true]]);
    expect(q.select).toHaveBeenCalledWith("*, service_locations(location_id)");
  });
});
describe("enable at location", () => {
  it("only adds relationship, validates both tenant IDs, preserves existing rows on retry", async () => {
    const s = query({ id: "service", location_id: "primary" });
    const l = query({ id: "secondary" }); const mapping = query(null);
    mock.from.mockImplementation((table: string) => ({ services: s, locations: l, service_locations: mapping })[table]);
    for (let i=0;i<2;i++) expect(await enableServiceAtLocation("service", "secondary")).toHaveProperty("success");
    expect(s.eq).toHaveBeenCalledWith("business_id", "tenant");
    expect(s.eq).toHaveBeenCalledWith("id", "service");
    expect(l.eq).toHaveBeenCalledWith("business_id", "tenant");
    expect(l.eq).toHaveBeenCalledWith("id", "secondary");
    expect(l.eq).toHaveBeenCalledWith("is_active", true);
    expect(mapping.upsert).toHaveBeenCalledWith({ service_id: "service", location_id: "secondary", is_primary: false }, { onConflict: "service_id,location_id", ignoreDuplicates: true });
    expect(s.upsert).not.toHaveBeenCalled(); expect(l.upsert).not.toHaveBeenCalled();
    expect(mock.revalidate).toHaveBeenCalledWith("/dashboard/calendar");
  });
  it.each(["services", "locations"])("rejects missing/foreign %s before any write", async (missing) => {
    mock.from.mockImplementation((table: string) => query(table === missing ? null : { id: "found" }));
    expect(await enableServiceAtLocation("foreign", "secondary")).toHaveProperty("error");
    expect(mock.from.mock.calls.map(([table]) => table)).not.toContain("service_locations");
    expect(mock.revalidate).not.toHaveBeenCalled();
  });
  it("propagates relationship write failure without success/revalidation", async () => {
    mock.from.mockImplementation((table: string) => query({ id: "found" }, table === "service_locations" ? { message: "denied" } : null));
    expect(await enableServiceAtLocation("service", "secondary")).toHaveProperty("error");
    expect(mock.revalidate).not.toHaveBeenCalled();
  });
});
