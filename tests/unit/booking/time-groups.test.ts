import { describe, expect, it } from "vitest";
import { groupSlotsByTimeOfDay, timeOfDayGroupId } from "@/lib/booking/time-groups";

describe("time groups", () => {
  it("classifies morning afternoon and evening", () => {
    expect(timeOfDayGroupId("2026-08-02T09:05:00")).toBe("morning");
    expect(timeOfDayGroupId("2026-08-02T13:05:00")).toBe("afternoon");
    expect(timeOfDayGroupId("2026-08-02T20:05:00")).toBe("evening");
  });

  it("groups slots without dropping any", () => {
    const starts = [
      "2026-08-02T09:00:00",
      "2026-08-02T09:05:00",
      "2026-08-02T12:00:00",
      "2026-08-02T20:05:00",
    ];
    const groups = groupSlotsByTimeOfDay(
      starts.map((start) => ({ start })),
      (s) => s.start,
    );
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(4);
    expect(groups.map((g) => g.id)).toEqual([
      "morning",
      "afternoon",
      "evening",
    ]);
  });
});
