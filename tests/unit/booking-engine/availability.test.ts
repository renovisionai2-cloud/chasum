import { describe, expect, it } from "vitest";
import { mapRpcErrorToConflict } from "@/lib/booking-engine/conflicts/codes";
import { scoreSlot } from "@/lib/booking-engine/availability/score";
import type { AvailabilityContext } from "@/lib/booking-engine/types";

const baseContext = {
  priorityScheduling: 0,
} as AvailabilityContext;

describe("availability / booking engine", () => {
  it("maps double-booking RPC errors", () => {
    const conflict = mapRpcErrorToConflict("overlaps an existing appointment");
    expect(conflict.code).toBe("DOUBLE_BOOKING");
    expect(conflict.recoverable).toBe(true);
  });

  it("maps vacation conflicts", () => {
    expect(mapRpcErrorToConflict("Staff on vacation").code).toBe("VACATION");
  });

  it("scores sooner slots higher", () => {
    const now = new Date("2026-07-18T12:00:00Z");
    const soon = scoreSlot({
      startIso: "2026-07-18T14:00:00Z",
      context: baseContext,
      index: 0,
      total: 10,
      now,
    });
    const later = scoreSlot({
      startIso: "2026-07-20T14:00:00Z",
      context: baseContext,
      index: 0,
      total: 10,
      now,
    });
    expect(soon.score).toBeGreaterThan(later.score);
  });
});
