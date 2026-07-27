import { describe, expect, it } from "vitest";
import {
  consultationPauseMs,
  consultationThinkMs,
  FS_ACKNOWLEDGEMENTS,
  FS_UNDERSTANDING_COMPLETE,
  nextAcknowledgement,
} from "@/lib/marketing/summer-intelligence-pacing";

describe("Summer intelligence pacing", () => {
  it("keeps pauses in the calm 400–700ms band", () => {
    expect(consultationPauseMs(0)).toBe(400);
    expect(consultationPauseMs(1)).toBe(700);
    expect(consultationThinkMs(0)).toBeGreaterThanOrEqual(480);
    expect(consultationThinkMs(1)).toBeLessThanOrEqual(700);
  });

  it("never repeats the same acknowledgement twice in a row", () => {
    for (const previous of FS_ACKNOWLEDGEMENTS) {
      for (let i = 0; i < 20; i += 1) {
        const next = nextAcknowledgement(previous, i / 20);
        expect(next).not.toBe(previous);
        expect(FS_ACKNOWLEDGEMENTS).toContain(next);
      }
    }
  });

  it("ships Business Profile Created copy", () => {
    expect(FS_UNDERSTANDING_COMPLETE.kicker).toBe("Business Profile Created");
    expect(FS_UNDERSTANDING_COMPLETE.message).toMatch(/good understanding/i);
    expect(FS_UNDERSTANDING_COMPLETE.message).toMatch(/greatest impact/i);
  });
});
