import { describe, expect, it } from "vitest";
import {
  filterEligibleBookingStaff,
  isStaffEligibleForLocation,
} from "@/lib/booking/eligible-staff";

describe("filterEligibleBookingStaff", () => {
  const secondaryMapped = {
    id: "b",
    name: "Bobita Singh",
    is_active: true,
    location_id: "loc-other",
    staff_services: [{ service_id: "svc-1" }],
    staff_locations: [{ location_id: "loc-main" }],
  };
  const missingSecondaryMapping = {
    ...secondaryMapped,
    id: "gap",
    name: "Missing mapping",
    staff_locations: [] as Array<{ location_id: string }>,
  };
  const primary = {
    id: "d",
    name: "Darshan Dindial",
    is_active: true,
    location_id: "loc-main",
    staff_services: [{ service_id: "svc-1" }],
    staff_locations: [] as Array<{ location_id: string }>,
  };
  const inactive = {
    id: "x",
    name: "Inactive",
    is_active: false,
    location_id: "loc-main",
    staff_services: [{ service_id: "svc-1" }],
    staff_locations: [] as Array<{ location_id: string }>,
  };
  const otherService = {
    id: "o",
    name: "Other",
    is_active: true,
    location_id: "loc-main",
    staff_services: [{ service_id: "svc-2" }],
    staff_locations: [] as Array<{ location_id: string }>,
  };

  it("keeps primary compatibility and legitimate secondary mappings", () => {
    const rows = filterEligibleBookingStaff(
      [secondaryMapped, missingSecondaryMapping, primary, inactive, otherService],
      { serviceId: "svc-1", locationId: "loc-main" },
    );
    expect(rows.map((r) => r.name).sort()).toEqual([
      "Bobita Singh",
      "Darshan Dindial",
    ]);
  });

  it("fails closed when secondary staff-location relationship data is absent", () => {
    expect(isStaffEligibleForLocation(missingSecondaryMapping, "loc-main")).toBe(false);
  });

  it("accepts an explicit secondary staff-location relationship", () => {
    expect(isStaffEligibleForLocation(secondaryMapped, "loc-main")).toBe(true);
  });

  it("does not require a redundant mapping for the primary location", () => {
    expect(isStaffEligibleForLocation(primary, "loc-main")).toBe(true);
  });

  it("still requires staff_services", () => {
    expect(
      filterEligibleBookingStaff([otherService], {
        serviceId: "svc-1",
        locationId: "loc-main",
      }),
    ).toEqual([]);
  });
});
