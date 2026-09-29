import { beforeEach, expect, it, vi } from "vitest";
import { clearAvailabilityCache } from "@/lib/booking-engine/availability/cache";

const { writes, rpc, revalidate, emit, reads } = vi.hoisted(() => ({
  writes: vi.fn(), rpc: vi.fn(), revalidate: vi.fn(), emit: vi.fn(),
  reads: [] as Array<{ table: string; filters: Record<string, unknown> }>,
}));

vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: async () => ({ id: "business-a" }) }));
vi.mock("@/lib/actions/location", () => ({
  getLocationScope: async () => ({ mode: "all" }),
  getLocations: async () => [{ id: "location-a" }, { id: "location-a2" }],
  getActiveLocationId: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
vi.mock("@/lib/booking-engine/events", () => ({
  createBookingEvent: vi.fn(), emitBookingEvent: emit, onBookingEvent: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc,
    from(table: string) {
      const filters: Record<string, unknown> = {};
      reads.push({ table, filters });
      const rows: Record<string, Array<Record<string, unknown>>> = {
        businesses: [{ id: "business-a", timezone: "UTC" }],
        services: [{ id: "service-a", business_id: "business-a", location_id: "location-a", is_active: true, duration_minutes: 30 }],
        staff: [{ id: "staff-a", business_id: "business-a", location_id: "location-a", is_active: true }],
        staff_services: [{ staff_id: "staff-a", service_id: "service-a" }],
        locations: [{ id: "location-b", business_id: "business-b", timezone: "UTC" }],
        service_locations: [{ service_id: "service-a", location_id: "location-a" }],
        staff_locations: [{ staff_id: "staff-a", location_id: "location-a" }],
      };
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => { filters[key] = value; return query; },
        maybeSingle: async () => ({
          data: rows[table]?.find((row) => Object.entries(filters).every(([key, value]) => row[key] === value)) ?? null,
          error: null,
        }),
        insert: writes,
        update: writes,
      };
      return query;
    },
  }),
}));

import { createAppointment } from "@/lib/actions/appointments";

beforeEach(() => { vi.clearAllMocks(); reads.length = 0; clearAvailabilityCache(); });

it("C11 rejects a foreign-Business location_id through the real action and booking validation before persistence", async () => {
  const form = new FormData();
  Object.entries({ customer_id: "customer-a", service_id: "service-a", staff_id: "staff-a", location_id: "location-b", start_time: "2026-10-01T12:00:00Z" })
    .forEach(([key, value]) => form.set(key, value));
  const result = await createAppointment({}, form);
  expect(result.success).toBeUndefined();
  expect(result.error).toMatch(/not offered at the selected location|does not work at the selected location/i);
  expect(reads).toContainEqual({ table: "locations", filters: { id: "location-b", business_id: "business-a" } });
  expect(writes).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
  expect(emit).not.toHaveBeenCalled();
  expect(revalidate).not.toHaveBeenCalled();
});
