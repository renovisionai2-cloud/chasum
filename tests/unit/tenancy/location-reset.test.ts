import { describe, expect, it } from "vitest";
import { ALL_LOCATIONS } from "@/lib/location/constants";
import {
  locationCookieAfterBusinessSwitch,
  resolveLocationScopeForBusiness,
} from "@/lib/tenancy/location-reset";

const locA = "loc-a";
const locB = "loc-b";
const locOtherTenant = "loc-gvm";

describe("locationCookieAfterBusinessSwitch", () => {
  it("clears a location id that belongs to the previous tenant", () => {
    expect(
      locationCookieAfterBusinessSwitch({
        previousCookie: locOtherTenant,
        locationIds: [locA],
        defaultLocationId: locA,
      }),
    ).toBe(locA);
  });

  it("keeps a location that still belongs to the new business", () => {
    expect(
      locationCookieAfterBusinessSwitch({
        previousCookie: locB,
        locationIds: [locA, locB],
        defaultLocationId: locA,
      }),
    ).toBe(locB);
  });

  it("keeps All locations only when the new business has more than one", () => {
    expect(
      locationCookieAfterBusinessSwitch({
        previousCookie: ALL_LOCATIONS,
        locationIds: [locA, locB],
        defaultLocationId: locA,
      }),
    ).toBe(ALL_LOCATIONS);
    expect(
      locationCookieAfterBusinessSwitch({
        previousCookie: ALL_LOCATIONS,
        locationIds: [locA],
        defaultLocationId: locA,
      }),
    ).toBe(locA);
  });
});

describe("resolveLocationScopeForBusiness", () => {
  it("does not keep another tenant's location id as the active scope", () => {
    expect(
      resolveLocationScopeForBusiness({
        cookieValue: locOtherTenant,
        locationIds: [locA],
        defaultLocationId: locA,
      }),
    ).toEqual({ mode: "single", locationId: locA });
  });

  it("accepts a valid location for the active business", () => {
    expect(
      resolveLocationScopeForBusiness({
        cookieValue: locB,
        locationIds: [locA, locB],
        defaultLocationId: locA,
      }),
    ).toEqual({ mode: "single", locationId: locB });
  });
});
