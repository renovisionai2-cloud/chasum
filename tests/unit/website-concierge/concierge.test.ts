import { describe, expect, it } from "vitest";
import { KNOWLEDGE_CATALOG } from "@/lib/website-concierge/knowledge/catalog";
import {
  retrieveKnowledge,
  runKnowledgeEngine,
} from "@/lib/website-concierge/knowledge-engine";
import { detectMarketingPage } from "@/lib/website-concierge/page-awareness";
import { buildConciergePrompt } from "@/lib/website-concierge/prompt-builder";
import { createPlaceholderProvider } from "@/lib/website-concierge/providers/placeholder";
import { createEmptySessionMemory } from "@/lib/website-concierge/session-memory";
import { buildConciergeContext } from "@/lib/website-concierge/context-engine";
import { searchKnowledge } from "@/lib/website-concierge/knowledge-base";

describe("website concierge page awareness", () => {
  it("maps marketing routes to page ids", () => {
    expect(detectMarketingPage("/").pageId).toBe("home");
    expect(detectMarketingPage("/pricing").pageId).toBe("pricing");
    expect(detectMarketingPage("/contact").pageId).toBe("contact");
    expect(detectMarketingPage("/apply").pageId).toBe("apply");
    expect(detectMarketingPage("/meet-summer").pageId).toBe("meet-summer");
    expect(detectMarketingPage("/private-alpha").pageId).toBe("about");
    expect(detectMarketingPage("/roadmap/").pageId).toBe("about");
  });
});

describe("knowledge engine catalog", () => {
  it("includes all required categories", () => {
    const cats = new Set(KNOWLEDGE_CATALOG.map((e) => e.category));
    for (const c of [
      "company",
      "features",
      "industries",
      "pricing",
      "competitive",
      "faq",
      "tour",
    ] as const) {
      expect(cats.has(c)).toBe(true);
    }
    expect(KNOWLEDGE_CATALOG.length).toBeGreaterThan(40);
  });

  it("retrieves pricing and competitive knowledge", () => {
    const pricing = retrieveKnowledge({
      query: "how much does professional plan cost",
      intent: "pricing",
      memory: createEmptySessionMemory(),
    });
    expect(pricing.hits[0]?.entry.category).toBe("pricing");

    const vs = retrieveKnowledge({
      query: "how are you different from Fresha",
      intent: "competitive",
      memory: createEmptySessionMemory(),
    });
    expect(vs.hits[0]?.entry.category).toBe("competitive");
    expect(vs.hits[0]?.entry.body.toLowerCase()).not.toMatch(
      /worse|terrible|scam/,
    );
  });

  it("runs a guided tour and avoids pure repetition", () => {
    const memory = createEmptySessionMemory();
    const start = runKnowledgeEngine({
      query: "Can you give me a two-minute tour?",
      memory,
      recentMessages: [],
    });
    expect(start.message).toMatch(/Tour/i);
    expect(start.memoryPatch.tourStepId).toBeTruthy();

    const nextMemory = {
      ...memory,
      ...start.memoryPatch,
      answeredArticleIds: start.memoryPatch.answeredArticleIds ?? [],
      lastTopicIds: start.memoryPatch.lastTopicIds ?? [],
      tourStepId: start.memoryPatch.tourStepId ?? "intro",
    };
    const next = runKnowledgeEngine({
      query: "next",
      memory: nextMemory,
      recentMessages: [],
    });
    expect(next.message).toMatch(/Tour/i);
    expect(next.message).not.toEqual(start.message);
  });

  it("admits unknown when confidence is low", () => {
    const result = runKnowledgeEngine({
      query: "xyzzy quantum flibbertigibbet warranty statute",
      memory: createEmptySessionMemory(),
      recentMessages: [],
    });
    expect(result.retrieval.unknown || result.message.toLowerCase()).toBeTruthy();
    expect(result.message.toLowerCase()).toMatch(
      /not confident|don.?t have|knowledge engine|try asking/,
    );
  });
});

describe("website concierge knowledge + placeholder provider", () => {
  it("finds pricing knowledge via legacy search adapter", () => {
    const hits = searchKnowledge({
      query: "how much does it cost",
      pageId: "pricing",
      businessType: "salon",
    });
    expect(hits.length).toBeGreaterThan(0);
  });

  it("returns a grounded placeholder completion", async () => {
    const memory = createEmptySessionMemory();
    const context = buildConciergeContext({
      pathname: "/pricing",
      memory,
      messages: [],
    });
    const engine = runKnowledgeEngine({
      query: "Which plan fits a multi-location spa?",
      memory,
      recentMessages: [],
    });
    const prompt = buildConciergePrompt({
      context,
      userMessage: "Which plan fits a multi-location spa?",
      retrieval: engine.retrieval,
    });
    const provider = createPlaceholderProvider();
    const result = await provider.complete({
      prompt,
      context,
      userMessage: "Which plan fits a multi-location spa?",
      retrieval: engine.retrieval,
      groundedDraft: {
        message: engine.message,
        suggestions: engine.suggestions,
        memoryPatch: engine.memoryPatch,
      },
    });
    expect(result.message.length).toBeGreaterThan(40);
    expect(result.memoryPatch?.businessType).toBe("spa");
    expect(prompt.system).toMatch(/Retrieved knowledge/);
  });
});
