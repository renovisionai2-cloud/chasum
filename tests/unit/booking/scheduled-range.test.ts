import { describe, expect, it } from "vitest";
import {
  scheduledInstantChanged,
  scheduledRangeChanged,
} from "@/lib/booking-engine/scheduled-range";

describe("scheduledInstantChanged", () => {
  it("treats equivalent ISO instants as unchanged", () => {
    expect(
      scheduledInstantChanged(
        "2026-09-17T13:00:00+00:00",
        "2026-09-17T13:00:00.000Z",
      ),
    ).toBe(false);
    expect(
      scheduledInstantChanged(
        "2026-09-16T18:00:00+00:00",
        "2026-09-16T18:00:00+00:00",
      ),
    ).toBe(false);
  });

  it("detects a real start-time move", () => {
    expect(
      scheduledInstantChanged(
        "2026-09-16T18:00:00+00:00",
        "2026-09-17T13:00:00+00:00",
      ),
    ).toBe(true);
  });
});

describe("scheduledRangeChanged", () => {
  it("is false when start and end are the same instants in different ISO shapes", () => {
    expect(
      scheduledRangeChanged({
        existingStart: "2026-09-17T13:00:00+00:00",
        requestedStart: "2026-09-17T13:00:00.000Z",
        existingEnd: "2026-09-17T13:45:00+00:00",
        requestedEnd: "2026-09-17T13:45:00.000Z",
      }),
    ).toBe(false);
  });

  it("is true when only the resolved end moves", () => {
    expect(
      scheduledRangeChanged({
        existingStart: "2026-09-17T13:00:00+00:00",
        requestedStart: "2026-09-17T13:00:00.000Z",
        existingEnd: "2026-09-17T13:45:00+00:00",
        requestedEnd: "2026-09-17T14:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("is true when only the start moves", () => {
    expect(
      scheduledRangeChanged({
        existingStart: "2026-09-16T18:00:00+00:00",
        requestedStart: "2026-09-17T13:00:00+00:00",
        existingEnd: "2026-09-16T18:45:00+00:00",
        requestedEnd: "2026-09-16T18:45:00+00:00",
      }),
    ).toBe(true);
  });
});
