import type { KnowledgeRetrieval } from "@/lib/website-concierge/knowledge/types";
import type {
  BuiltPrompt,
  ConciergeContext,
} from "@/lib/website-concierge/types";

/**
 * Builds a provider-agnostic prompt. UI never hardcodes model copy —
 * the provider consumes this structure (Knowledge Engine draft today, LLM tomorrow).
 */
export function buildConciergePrompt(input: {
  context: ConciergeContext;
  userMessage: string;
  intentTags?: string[];
  retrieval?: KnowledgeRetrieval;
}): BuiltPrompt {
  const { context, userMessage, retrieval } = input;
  const { page, memory } = context;

  const knowledgeBlock = retrieval?.hits.length
    ? [
        "Retrieved knowledge (ground truth — do not invent beyond this):",
        ...retrieval.hits.map(
          (h, i) =>
            `[${i + 1}] (${h.entry.category}) ${h.entry.title}: ${h.entry.body}`,
        ),
        retrieval.unknown
          ? "Confidence is low — admit limits and recommend another topic."
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "No strong knowledge hits — admit uncertainty and suggest a topic.";

  const system = [
    "You are Summer — Chasum's AI Business Assistant on the public marketing site.",
    "You are an experienced business consultant: professional, friendly, curious, helpful, honest.",
    "Never pushy. Never overly sales-focused. Understand the business before pitching features.",
    "Roles you represent: website concierge, receptionist assist, product guide, and future business/executive assistant.",
    "Answer from retrieved knowledge only. Avoid repeating prior answers when possible.",
    "Ask intelligent follow-ups. Never invent competitors' weaknesses — explain Chasum philosophy.",
    "Prefer honest Private Alpha framing over salesy hype.",
    "Never ask a discovery question the visitor already answered (see session memory).",
    `Current page: ${page.title} (${page.pathname}). Page goals: ${page.goals.join("; ")}.`,
    `Visitor business type: ${memory.businessType}.`,
    memory.visitorName ? `Visitor name: ${memory.visitorName}.` : null,
    memory.employeeCount ? `Team size: ${memory.employeeCount}.` : null,
    memory.locationCount ? `Locations: ${memory.locationCount}.` : null,
    memory.currentSoftware
      ? `Current software: ${memory.currentSoftware}.`
      : null,
    memory.monthlyVolume
      ? `Monthly appointment volume: ${memory.monthlyVolume}.`
      : null,
    memory.challenges.length
      ? `Challenges / pain points: ${memory.challenges.join(", ")}.`
      : null,
    memory.goals.length ? `Goals: ${memory.goals.join(", ")}.` : null,
    memory.growthPlans ? `Growth plans: ${memory.growthPlans}.` : null,
    memory.recommendationsMade.length
      ? `Recommendations already made: ${memory.recommendationsMade.join(", ")}.`
      : null,
    `Discovery phase: ${memory.discoveryPhase}.`,
    memory.interests.length
      ? `Known interests: ${memory.interests.join(", ")}.`
      : null,
    memory.pagesVisited.length
      ? `Pages visited this session: ${memory.pagesVisited.join(", ")}.`
      : null,
    memory.answeredArticleIds?.length
      ? `Already covered article ids: ${memory.answeredArticleIds.join(", ")}.`
      : null,
    knowledgeBlock,
  ]
    .filter(Boolean)
    .join("\n");

  const history = context.recentMessages
    .map((m) => `${m.role === "user" ? "Visitor" : "Summer"}: ${m.content}`)
    .join("\n");

  const user = [
    history ? `Recent conversation:\n${history}` : null,
    `Visitor message: ${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    system,
    user,
    hints: {
      pageId: page.pageId,
      businessType: memory.businessType,
      interests: [...memory.interests],
      intentTags: input.intentTags ?? [],
    },
  };
}
