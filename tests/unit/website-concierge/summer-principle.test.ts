import { describe, expect, it } from "vitest";
import { DISCOVERY_FIELDS } from "@/lib/website-concierge/discovery/fields";
import {
  formatDiscoveryAsk,
  SUMMER_PRINCIPLE_PROMPT_RULES,
  SUMMER_PRINCIPLE_SEQUENCE,
} from "@/lib/website-concierge/discovery/summer-principle";
import { buildConciergePrompt } from "@/lib/website-concierge/prompt-builder";
import { createEmptySessionMemory } from "@/lib/website-concierge/session-memory";
import { detectMarketingPage } from "@/lib/website-concierge/page-awareness";
import { runDiscoveryEngine } from "@/lib/website-concierge/discovery";

describe("The Summer Principle", () => {
  it("defines the permanent consultation sequence", () => {
    expect(SUMMER_PRINCIPLE_SEQUENCE).toEqual([
      "Understand",
      "Explain",
      "Ask",
      "Think",
      "Recommend",
      "Confirm",
      "Continue",
    ]);
  });

  it("requires every discovery field to explain before asking", () => {
    for (const field of DISCOVERY_FIELDS) {
      expect(field.why.length).toBeGreaterThan(20);
      expect(field.helps.length).toBeGreaterThan(20);
      expect(field.willDo.length).toBeGreaterThan(20);
      expect(field.question).toMatch(/\?$/);
    }
  });

  it("composes educational asks with why, helps, willDo, then question", () => {
    const field = DISCOVERY_FIELDS.find((f) => f.id === "employee_count");
    expect(field).toBeTruthy();
    const message = formatDiscoveryAsk(field!, {
      understand: "Got it — salon.",
    });
    expect(message.startsWith("Got it — salon.")).toBe(true);
    expect(message).toContain(field!.why);
    expect(message).toContain(field!.helps);
    expect(message).toContain(field!.willDo);
    expect(message.endsWith(field!.question)).toBe(true);
  });

  it("encodes The Summer Principle in the Prompt Builder", () => {
    const page = detectMarketingPage("/meet-summer");
    const prompt = buildConciergePrompt({
      context: {
        page,
        memory: createEmptySessionMemory(),
        recentMessages: [],
      },
      userMessage: "Hello",
    });
    for (const rule of SUMMER_PRINCIPLE_PROMPT_RULES) {
      expect(prompt.system).toContain(rule);
    }
  });

  it("uses Summer Principle framing on discovery follow-ups", () => {
    const { result } = runDiscoveryEngine({
      userMessage: "I run a salon",
      memory: createEmptySessionMemory(),
    });
    expect(result?.message).toMatch(/\?/);
    expect(result?.message).toMatch(/I'll |I will /i);
    expect(result?.message?.length ?? 0).toBeGreaterThan(120);
  });
});
