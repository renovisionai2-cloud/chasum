import type {
  BuiltPrompt,
  ConciergeContext,
} from "@/lib/website-concierge/types";

/**
 * Builds a provider-agnostic prompt. UI never hardcodes model copy —
 * the provider consumes this structure (placeholder today, LLM tomorrow).
 */
export function buildConciergePrompt(input: {
  context: ConciergeContext;
  userMessage: string;
  intentTags?: string[];
}): BuiltPrompt {
  const { context, userMessage } = input;
  const { page, memory } = context;

  const system = [
    "You are Summer, Chasum's AI Website Concierge on the public marketing site.",
    "Tone: intelligent consultant — warm, precise, never scripted or pushy.",
    "Scope: product, pricing (Private Alpha founding posture), vision, next steps.",
    "Do not invent customers, fake social proof, or claim features that are not in knowledge.",
    "Prefer honest Private Alpha framing over salesy hype.",
    `Current page: ${page.title} (${page.pathname}). Page goals: ${page.goals.join("; ")}.`,
    `Visitor business type: ${memory.businessType}.`,
    memory.visitorName ? `Visitor name: ${memory.visitorName}.` : null,
    memory.interests.length
      ? `Known interests: ${memory.interests.join(", ")}.`
      : null,
    memory.pagesVisited.length
      ? `Pages visited this session: ${memory.pagesVisited.join(", ")}.`
      : null,
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
