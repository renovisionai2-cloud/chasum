import { describe, expect, it } from "vitest";
import {
  buildThinkingCues,
  buildUnderstandingFields,
} from "@/lib/marketing/meet-summer-intelligence";
import { createEmptySessionMemory } from "@/lib/website-concierge/session-memory";
import { getPageGreeting } from "@/lib/website-concierge/page-awareness";

describe("Meet Summer intelligence presentation", () => {
  it("opens Meet Summer with a consultant introduction", () => {
    const greeting = getPageGreeting("meet-summer");
    expect(greeting).toMatch(/Welcome/i);
    expect(greeting).toMatch(/understand your business/i);
    expect(greeting).not.toMatch(/FAQ bot/i);
  });

  it("builds understanding fields from session memory", () => {
    const memory = {
      ...createEmptySessionMemory(),
      businessType: "ultrasound" as const,
      employeeCount: "2–5",
      currentSoftware: "Picktime",
      challenges: ["reporting"],
      recommendationsMade: ["ai-reception", "crm"],
    };
    const fields = buildUnderstandingFields(memory);
    const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
    expect(byId.business?.discovered).toBe(true);
    expect(byId.business?.value).toMatch(/Ultrasound/i);
    expect(byId.software?.value).toBe("Picktime");
    expect(byId.pain?.value).toBe("reporting");
    expect(byId.recommendations?.discovered).toBe(true);
  });

  it("derives thinking cues from discovery state (not random)", () => {
    const empty = buildThinkingCues(createEmptySessionMemory());
    expect(empty.some((c) => /Understanding your business/i.test(c.label))).toBe(
      true,
    );

    const rich = buildThinkingCues({
      ...createEmptySessionMemory(),
      businessType: "salon",
      currentSoftware: "Picktime",
      challenges: ["no-shows"],
      recommendationsMade: ["deposits"],
    });
    expect(rich.some((c) => /Picktime/i.test(c.label))).toBe(true);
    expect(rich.some((c) => /recommendations/i.test(c.label))).toBe(true);
    expect(rich.some((c) => /tour/i.test(c.label))).toBe(true);
  });
});
