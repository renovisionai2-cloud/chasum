import { describe, expect, it } from "vitest";
import {
  buildThinkingCues,
  buildUnderstandingFields,
} from "@/lib/marketing/meet-summer-intelligence";
import { createEmptySessionMemory } from "@/lib/website-concierge/session-memory";
import { getPageGreeting } from "@/lib/website-concierge/page-awareness";

describe("Meet Summer intelligence presentation", () => {
  it("opens Meet Summer with Summer appearing naturally", () => {
    const greeting = getPageGreeting("meet-summer");
    expect(greeting).toMatch(/Welcome/i);
    expect(greeting).toMatch(/I'm Summer/i);
    expect(greeting).toMatch(/understand your business/i);
  });

  it("builds Business Memory fields from session memory", () => {
    const memory = {
      ...createEmptySessionMemory(),
      businessType: "ultrasound" as const,
      businessTypes: ["Ultrasound Studio"],
      employeeCount: "2–5",
      currentSoftware: "Picktime",
      challenges: ["reporting"],
      recommendationsMade: ["ai-reception", "crm"],
    };
    const fields = buildUnderstandingFields(memory);
    const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
    expect(byId.industry?.discovered).toBe(true);
    expect(byId.industry?.value).toMatch(/Ultrasound/i);
    expect(byId.businessType?.value).toMatch(/Ultrasound/i);
    expect(byId.challenge?.label).toMatch(/Primary Challenge/i);
    expect(byId.challenge?.value).toBe("reporting");
    expect(byId.employees?.discovered).toBe(true);
    expect(byId.goals?.discovered).toBe(false);
    expect(byId.recommendations?.discovered).toBe(true);
  });

  it("seeds live Business Memory scaffold with Learning… rows", () => {
    const fields = buildUnderstandingFields(createEmptySessionMemory(), {
      businessOverride: "Medical Clinic",
      showPending: true,
    });
    const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
    expect(byId.industry?.value).toBe("Medical Clinic");
    expect(byId.employees?.discovered).toBe(false);
    expect(byId.employees?.pendingLabel).toMatch(/Learning/i);
    expect(byId.recommendations?.pendingLabel).toMatch(/Preparing Recommendations/i);
    expect(fields.length).toBeGreaterThanOrEqual(6);
  });

  it("derives visible intelligence cues from discovery state", () => {
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
    expect(rich.some((c) => /industry knowledge/i.test(c.label))).toBe(true);
    expect(rich.some((c) => /industry benchmarks/i.test(c.label))).toBe(true);
    expect(rich.some((c) => /opportunities/i.test(c.label))).toBe(true);
    expect(rich.some((c) => /recommendations/i.test(c.label))).toBe(true);
  });
});
