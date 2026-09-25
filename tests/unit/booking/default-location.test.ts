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
        activeLocationId: "branch",
        preferenceLocationId: "main",
      }),
    ).toBe("branch");
  });

  it("keeps an explicit booking draft Location ahead of workspace scope", () => {
    expect(
      resolveBookingLocationId({
        locations,
        draftLocationId: "other",
        activeLocationId: "branch",
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
        activeLocationId: "branch",
      }),
    ).toBe("main");
  });

  it("uses saved preference when there is no active single-Location scope", () => {
    expect(
      resolveBookingLocationId({
        locations,
        activeLocationId: null,
        preferenceLocationId: "other",
      }),
    ).toBe("other");
  });

  it("falls back to the Business default when scope and preference are absent or stale", () => {
    expect(
      resolveBookingLocationId({
        locations,
        activeLocationId: "missing",
        preferenceLocationId: "also-missing",
      }),
    ).toBe("main");
  });
});
