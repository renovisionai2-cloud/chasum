import { describe, expect, it } from "vitest";
import { resolveBookingLocationId } from "@/lib/booking/default-location";

const locations = [
  { id: "main", is_default: true },
  { id: "branch", is_default: false },
  { id: "other", is_default: false },
];

describe("resolveBookingLocationId", () => {
  it("defaults a new booking to the active single-Location workspace", () => {
    expect(
      resolveBookingLocationId({
        locations,
        scope: { mode: "single", locationId: "branch" },
        preferenceLocationId: "main",
      }),
    ).toBe("branch");
  });

  it("keeps an explicit booking draft Location ahead of workspace scope", () => {
    expect(
      resolveBookingLocationId({
        locations,
        draftLocationId: "other",
        scope: { mode: "single", locationId: "branch" },
        preferenceLocationId: "main",
      }),
    ).toBe("other");
  });

  it("keeps an existing appointment Location authoritative", () => {
    expect(
      resolveBookingLocationId({
        locations,
        appointmentLocationId: "main",
        draftLocationId: "other",
        scope: { mode: "single", locationId: "branch" },
      }),
    ).toBe("main");
  });

  it("ignores saved preference under multi-location ALL", () => {
    expect(
      resolveBookingLocationId({
        locations,
        scope: { mode: "all" },
        preferenceLocationId: "other",
      }),
    ).toBe("");
  });

  it("does not fall back to the Business default under ALL", () => {
    expect(
      resolveBookingLocationId({
        locations,
        scope: { mode: "all" },
        preferenceLocationId: "also-missing",
      }),
    ).toBe("");
  });
});


describe("M1B active-location and saved truth precedence", () => {
  it.each([{ mode: "all" } as const, { mode: "single", locationId: "stale" } as const])("uses the sole active Location with scope %j", (scope) => {
    expect(resolveBookingLocationId({ locations: [{ id: "closed", is_active: false }, { id: "sole", is_active: true }], scope })).toBe("sole");
  });
  it("preserves a historical appointment under ALL", () => {
    expect(resolveBookingLocationId({ locations, scope: { mode: "all" }, appointmentLocationId: "historical" })).toBe("historical");
  });
  it("preserves an explicit draft under ALL", () => {
    expect(resolveBookingLocationId({ locations, scope: { mode: "all" }, draftLocationId: "branch" })).toBe("branch");
  });
  it("leaves ALL empty without active locations", () => {
    expect(resolveBookingLocationId({ locations: [], scope: { mode: "all" } })).toBe("");
  });
});
