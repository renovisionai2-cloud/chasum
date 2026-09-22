import { describe, expect, it } from "vitest";
import { mapRpcErrorToConflict } from "@/lib/booking-engine/conflicts/codes";

describe("Stage 1B relationship conflict mapping", () => {
  it.each([
    ["This service is not offered at the selected location", "NOT_AUTHORIZED"],
    ["Staff does not work at the selected location", "NOT_AUTHORIZED"],
    ["Staff member does not offer this service", "NOT_AUTHORIZED"],
    ["Employee is not assigned to this service.", "NOT_AUTHORIZED"],
  ])("preserves precise relationship failure: %s", (message, code) => {
    const conflict = mapRpcErrorToConflict(message);
    expect(conflict.code).toBe(code);
    expect(conflict.message).toBe(message);
    expect(conflict.recoverable).toBe(true);
  });
});
