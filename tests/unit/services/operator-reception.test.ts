import { beforeEach, expect, it, vi } from "vitest";
import { getReceptionBrief, getNextAvailableSlot } from "@/lib/actions/reception";
const mock = vi.hoisted(() => ({ catalog: vi.fn(), from: vi.fn(), slots: vi.fn() }));
vi.mock("@/lib/actions/services", () => ({ getOperatorServiceCatalog: mock.catalog }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: async () => ({ id: "tenant" }) }));
vi.mock("@/lib/actions/location", () => ({ getActiveLocationId: async () => "secondary" }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mock.from }) }));
vi.mock("@/lib/actions/scheduling", () => ({ fetchAvailableSlots: mock.slots }));
const staffQuery = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [{ id: "staff", name: "Staff", is_active: true, location_id: "primary", staff_locations: [{ location_id: "secondary" }], staff_services: [{ service_id: "mapped" }] }] }).then(resolve) };
beforeEach(() => {
  vi.clearAllMocks();
  mock.catalog.mockResolvedValue([
    ...Array.from({ length: 4 }, (_, i) => ({ id: `unmapped-${i}`, location_id: "primary", is_active: true, service_locations: [] })),
    { id: "mapped", name: "Shared service", location_id: "primary", is_active: true, service_locations: [{ location_id: "secondary" }] },
  ]);
  mock.slots.mockResolvedValue([new Date(Date.now() + 60000).toISOString()]);
  mock.from.mockImplementation((table: string) => table === "staff" ? staffQuery : {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockResolvedValue({ data: [] }),
  });
});
it("finds a secondary service after unrelated catalog entries without broadening staff scope", async () => {
  expect(await getNextAvailableSlot()).toMatchObject({ serviceId: "mapped", staffId: "staff" });
  expect(mock.slots).toHaveBeenCalledWith("tenant", "mapped", "staff", expect.any(String), undefined, "secondary");
  expect(staffQuery.eq).not.toHaveBeenCalledWith("location_id", "secondary");
});
it("Reception brief applies offerings before its sample limit", async () => {
  expect(await getReceptionBrief()).toMatchObject({ openTimeSlots: 1 });
  expect(mock.slots).toHaveBeenCalledTimes(1);
  expect(mock.slots.mock.calls[0][1]).toBe("mapped");
});
it("does not calculate availability for a catalog with no offerings here", async () => {
  mock.catalog.mockResolvedValue([{ id: "unmapped", location_id: "primary", is_active: true }]);
  expect(await getNextAvailableSlot()).toBeNull();
  expect(mock.slots).not.toHaveBeenCalled();
});
