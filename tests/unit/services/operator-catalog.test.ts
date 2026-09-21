import { describe, expect, it } from "vitest";
import { filterServicesOfferedAtLocation, isServiceOfferedAtLocation } from "@/lib/services/operator-catalog";

const service = { location_id: "primary", service_locations: [{ location_id: "secondary" }] };
describe("operator offered-at truth", () => {
  it.each([["primary", true], ["secondary", true], ["unrelated", false], ["", false]])(
    "%s = %s", (location, expected) => expect(isServiceOfferedAtLocation(service, location)).toBe(expected),
  );
  it("keeps primary compatibility with missing mappings, never guesses secondary", () => {
    expect(isServiceOfferedAtLocation({ location_id: "primary" }, "primary")).toBe(true);
    expect(isServiceOfferedAtLocation({ location_id: "primary" }, "secondary")).toBe(false);
    expect(isServiceOfferedAtLocation({ ...service, service_locations: null }, "secondary")).toBe(false);
  });
  it("filters without duplicating or changing catalog identity and commercial fields", () => {
    const item = { ...service, id: "same-service", price: 25, duration_minutes: 30 };
    const catalog = [item, { ...item, id: "other", location_id: "other", service_locations: [] }];
    expect(filterServicesOfferedAtLocation(catalog, "secondary")).toEqual([item]);
    expect(filterServicesOfferedAtLocation(catalog, "primary")[0]).toBe(item);
    expect(catalog).toHaveLength(2);
  });
});
