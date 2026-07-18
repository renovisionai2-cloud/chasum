import { describe, expect, it } from "vitest";
import {
  deferPastQuietHours,
  isWithinQuietHours,
} from "@/lib/communications/preferences";
import { computeBackoffMs } from "@/lib/communications/queue";

describe("communications preferences", () => {
  it("detects quiet hours including overnight", () => {
    const evening = new Date("2026-07-18T22:30:00");
    expect(isWithinQuietHours(evening, "21:00", "08:00")).toBe(true);
    const noon = new Date("2026-07-18T12:00:00");
    expect(isWithinQuietHours(noon, "21:00", "08:00")).toBe(false);
  });

  it("defers past quiet hours end", () => {
    const evening = new Date("2026-07-18T22:00:00");
    const next = deferPastQuietHours(evening, "21:00", "08:00");
    expect(next.getHours()).toBe(8);
    expect(next.getDate()).toBe(19);
  });

  it("computes capped exponential backoff", () => {
    expect(computeBackoffMs(1)).toBe(60_000);
    expect(computeBackoffMs(2)).toBe(300_000);
    expect(computeBackoffMs(10)).toBe(25 * 60_000);
  });
});
