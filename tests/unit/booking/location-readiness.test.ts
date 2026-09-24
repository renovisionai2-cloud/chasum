import { describe, expect, it } from "vitest";
import { getLocationBookingReadiness } from "@/lib/booking/location-readiness";

const services = [
  {
    id: "svc-1",
    is_active: true,
    location_id: "loc-burlington",
    service_locations: [
      { location_id: "loc-burlington" },
      { location_id: "loc-brampton" },
    ],
  },
  {
    id: "svc-2",
    is_active: true,
    location_id: "loc-burlington",
    service_locations: [{ location_id: "loc-burlington" }],
  },
] as never;

const staff = [
  {
    id: "staff-1",
    is_active: true,
    accept_online_bookings: true,
    location_id: "loc-burlington",
    staff_locations: [
      { location_id: "loc-burlington" },
      { location_id: "loc-brampton" },
    ],
    staff_services: [{ service_id: "svc-1" }],
  },
] as never;

describe("location booking readiness", () => {
  it("uses service_locations for secondary Location offered-at truth", () => {
    expect(
      getLocationBookingReadiness(services, [], "loc-brampton"),
    ).toMatchObject({
      state: "no-staff",
      offeredServiceCount: 1,
    });
  });

  it("uses staff_locations for secondary Location works-at truth", () => {
    expect(
      getLocationBookingReadiness(services, staff, "loc-brampton"),
    ).toMatchObject({
      state: "ready",
      offeredServiceCount: 1,
      bookableStaffCount: 1,
      matchedStaffCount: 1,
    });
  });

  it("fails closed when Staff work there but provide no offered Service", () => {
    const mismatchedStaff = [
      {
        ...staff[0],
        staff_services: [{ service_id: "svc-2" }],
      },
    ] as never;

    expect(
      getLocationBookingReadiness(services, mismatchedStaff, "loc-brampton"),
    ).toMatchObject({
      state: "no-service-staff-overlap",
      offeredServiceCount: 1,
      bookableStaffCount: 1,
      matchedStaffCount: 0,
    });
  });

  it("does not treat inactive or non-bookable Staff as setup-ready", () => {
    const unavailable = [
      {
        ...staff[0],
        accept_online_bookings: false,
      },
    ] as never;

    expect(
      getLocationBookingReadiness(services, unavailable, "loc-brampton"),
    ).toMatchObject({
      state: "no-staff",
      bookableStaffCount: 0,
    });
  });

  it("keeps primary compatibility for the default Location", () => {
    expect(
      getLocationBookingReadiness(
        services,
        [
          {
            id: "staff-primary",
            is_active: true,
            accept_online_bookings: true,
            location_id: "loc-burlington",
            staff_locations: [],
            staff_services: [{ service_id: "svc-1" }],
          },
        ] as never,
        "loc-burlington",
      ),
    ).toMatchObject({ state: "ready" });
  });
});
