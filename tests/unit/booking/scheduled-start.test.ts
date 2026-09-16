import { describe, expect, it } from "vitest";
import { scheduledStartChanged } from "@/lib/booking-engine/scheduled-start";

describe("scheduledStartChanged", () => {
  it("treats equivalent ISO instants as unchanged", () => {
    expect(
      scheduledStartChanged(
        "2026-09-17T13:00:00+00:00",
        "2026-09-17T13:00:00.000Z",
      ),
    ).toBe(false);
    expect(
      scheduledStartChanged(
        "2026-09-16T18:00:00+00:00",
        "2026-09-16T18:00:00+00:00",
      ),
    ).toBe(false);
  });

  it("detects a real start-time move", () => {
    expect(
      scheduledStartChanged(
        "2026-09-16T18:00:00+00:00",
        "2026-09-17T13:00:00+00:00",
      ),
    ).toBe(true);
  });
});
