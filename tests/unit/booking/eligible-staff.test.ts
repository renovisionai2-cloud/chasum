import { describe, expect, it } from "vitest";
import {
  filterEligibleBookingStaff,
  isStaffEligibleForLocation,
} from "@/lib/booking/eligible-staff";

describe("filterEligibleBookingStaff", () => {
  const bobita = {
    id: "b",
    name: "Bobita Singh",
    is_active: true,
    location_id: "loc-other",
    staff_services: [{ service_id: "svc-1" }],
    staff_locations: [] as Array<{ location_id: string }>,
  };
  const darshan = {
    id: "d",
    name: "Darshan Dindial",
    is_active: true,
    location_id: "loc-main",
    staff_services: [{ service_id: "svc-1" }],
    staff_locations: [{ location_id: "loc-main" }],
  };
  const summer = {
    id: "s",
    name: "Summer Dindial",
    is_active: true,
    location_id: "loc-main",
    staff_services: [{ service_id: "svc-1" }],
    staff_locations: [{ location_id: "loc-main" }],
  };
  const inactive = {
    id: "x",
    name: "Inactive",
    is_active: false,
    location_id: "loc-main",
    staff_services: [{ service_id: "svc-1" }],
    staff_locations: [],
  };
  const otherService = {
    id: "o",
    name: "Other",
    is_active: true,
    location_id: "loc-main",
    staff_services: [{ service_id: "svc-2" }],
    staff_locations: [],
  };

  it("lists every active employee assigned to the service", () => {
    const rows = filterEligibleBookingStaff(
      [bobita, darshan, summer, inactive, otherService],
      { serviceId: "svc-1", locationId: "loc-main" },
    );
    expect(rows.map((r) => r.name).sort()).toEqual([
      "Bobita Singh",
      "Darshan Dindial",
      "Summer Dindial",
    ]);
  });

  it("does not require availability to appear", () => {
    expect(isStaffEligibleForLocation(bobita, "loc-main")).toBe(true);
  });

  it("respects explicit multi-location assignments", () => {
    const remoteOnly = {
      ...bobita,
      location_id: "loc-remote",
      staff_locations: [{ location_id: "loc-remote" }],
    };
    expect(isStaffEligibleForLocation(remoteOnly, "loc-main")).toBe(false);
  });
});
