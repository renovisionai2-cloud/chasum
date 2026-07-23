import { describe, expect, it } from "vitest";
import { searchKnowledge } from "@/lib/website-concierge/knowledge-base";
import { detectMarketingPage } from "@/lib/website-concierge/page-awareness";
import { buildConciergePrompt } from "@/lib/website-concierge/prompt-builder";
import { createPlaceholderProvider } from "@/lib/website-concierge/providers/placeholder";
import { createEmptySessionMemory } from "@/lib/website-concierge/session-memory";
import { buildConciergeContext } from "@/lib/website-concierge/context-engine";

describe("website concierge page awareness", () => {
  it("maps marketing routes to page ids", () => {
    expect(detectMarketingPage("/").pageId).toBe("home");
    expect(detectMarketingPage("/pricing").pageId).toBe("pricing");
    expect(detectMarketingPage("/contact").pageId).toBe("contact");
    expect(detectMarketingPage("/apply").pageId).toBe("apply");
    expect(detectMarketingPage("/private-alpha").pageId).toBe("about");
    expect(detectMarketingPage("/roadmap/").pageId).toBe("about");
  });
});

describe("website concierge knowledge + placeholder provider", () => {
  it("finds pricing knowledge", () => {
    const hits = searchKnowledge({
      query: "how much does it cost",
      pageId: "pricing",
      businessType: "salon",
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.tags.some((t) => /price|plan|cost/.test(t))).toBe(true);
  });

  it("returns a grounded placeholder completion", async () => {
    const memory = createEmptySessionMemory();
    const context = buildConciergeContext({
      pathname: "/pricing",
      memory,
      messages: [],
    });
    const prompt = buildConciergePrompt({
      context,
      userMessage: "Which plan fits a multi-location spa?",
    });
    const provider = createPlaceholderProvider();
    const result = await provider.complete({
      prompt,
      context,
      userMessage: "Which plan fits a multi-location spa?",
    });
    expect(result.message.length).toBeGreaterThan(40);
    expect(result.memoryPatch?.businessType).toBe("spa");
  });
});
