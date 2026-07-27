import { describe, expect, it } from "vitest";
import { presentConsultationReply } from "@/lib/marketing/flagship-consultation-voice";

describe("presentConsultationReply", () => {
  it("rewrites robotic Got it acknowledgements", () => {
    const out = presentConsultationReply(
      "Got it — a dental clinic. Knowing your team size helps me recommend the right cadence.",
    );
    expect(out.startsWith("Got it")).toBe(false);
    expect(out).toContain("dental clinic");
    expect(out).toContain("Knowing your team size");
  });

  it("leaves already-warm copy unchanged", () => {
    const copy =
      "I've learned you're a salon. Tell me how many people are on your team.";
    expect(presentConsultationReply(copy)).toBe(copy);
  });

  it("can strip the leading understand beat when a UI ack already played", () => {
    const out = presentConsultationReply(
      "Got it — a dental clinic. Knowing your team size helps me recommend the right cadence.",
      { stripLeadingUnderstand: true },
    );
    expect(out.startsWith("Got it")).toBe(false);
    expect(out.startsWith("I've taken")).toBe(false);
    expect(out).toContain("Knowing your team size");
  });
});
