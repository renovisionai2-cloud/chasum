import { searchKnowledge } from "@/lib/website-concierge/knowledge-base";
import {
  inferBusinessTypeFromText,
  inferInterestsFromText,
  inferNameFromText,
} from "@/lib/website-concierge/session-memory";
import type {
  ConciergeCompletionRequest,
  ConciergeCompletionResult,
  ConciergeProvider,
  MarketingPageId,
} from "@/lib/website-concierge/types";

/**
 * Phase 1 AI provider: intelligent placeholder grounded in the Knowledge Base.
 * Swap for OpenAI (or another) by registering a new provider with the same interface.
 */
export function createPlaceholderProvider(): ConciergeProvider {
  return {
    id: "placeholder-knowledge-v1",
    async complete(
      request: ConciergeCompletionRequest,
    ): Promise<ConciergeCompletionResult> {
      const { context, userMessage, prompt } = request;
      const pageId = prompt.hints.pageId;
      const articles = searchKnowledge({
        query: userMessage,
        pageId,
        businessType: prompt.hints.businessType,
        limit: 2,
      });

      const inferredType = inferBusinessTypeFromText(userMessage);
      const inferredName = inferNameFromText(userMessage);
      const inferredInterests = inferInterestsFromText(userMessage);

      const memoryPatch: ConciergeCompletionResult["memoryPatch"] = {};
      if (inferredType) memoryPatch.businessType = inferredType;
      if (inferredName) memoryPatch.visitorName = inferredName;
      if (inferredInterests.length) memoryPatch.interests = inferredInterests;

      const personalize = personalizePrefix({
        name: inferredName ?? context.memory.visitorName,
        businessType: inferredType ?? context.memory.businessType,
      });

      const body =
        articles.map((a) => a.body).join(" ") ||
        "I can help with Chasum's product, pricing, Private Alpha, or a walkthrough. What would you like to explore?";

      const pageNudge = pageSpecificNudge(pageId, userMessage);
      const message = [personalize, body, pageNudge].filter(Boolean).join(" ");

      return {
        message,
        suggestions: suggestionsFor(pageId),
        memoryPatch:
          Object.keys(memoryPatch).length > 0 ? memoryPatch : undefined,
      };
    },
  };
}

function personalizePrefix(input: {
  name: string | null;
  businessType: string;
}): string {
  const bits: string[] = [];
  if (input.name) bits.push(`${input.name},`);
  if (input.businessType && input.businessType !== "unknown") {
    bits.push(
      `for a ${input.businessType.replace(/_/g, " ")} business, here's the short version:`,
    );
  }
  return bits.join(" ");
}

function pageSpecificNudge(pageId: MarketingPageId, userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (pageId === "pricing" && !/\b(apply|walkthrough|demo)\b/.test(lower)) {
    return "If you want founding pricing locked in, apply for Private Alpha rather than waiting on public checkout.";
  }
  if (pageId === "contact") {
    return "I can keep answering here, or you can apply at /apply or request a walkthrough from the Contact page.";
  }
  if (pageId === "home" && /\b(tour|demo|show)\b/.test(lower)) {
    return "I can outline the journey on this page — or send you to /apply and /contact when you're ready.";
  }
  if (pageId === "about") {
    return "The deeper blueprint is the Business Brain + decision-driven screens — happy to go deeper on either.";
  }
  return "";
}

function suggestionsFor(pageId: MarketingPageId): string[] {
  switch (pageId) {
    case "home":
      return [
        "I run an ultrasound studio",
        "What is Chasum?",
        "Show me pricing",
      ];
    case "pricing":
      return [
        "Which plan fits a salon?",
        "What is Private Alpha?",
        "Book a walkthrough",
      ];
    case "contact":
      return ["Apply for Private Alpha", "What should I know first?", "Book a walkthrough"];
    case "about":
      return [
        "Explain the AI Business OS",
        "What is Private Alpha?",
        "How is this different?",
      ];
    case "features":
      return ["Scheduling & booking", "CRM", "Summer & Chase AI"];
    case "apply":
      return ["Who is a good fit?", "What happens after I apply?", "Founding pricing"];
    default:
      return ["What is Chasum?", "Pricing", "Private Alpha"];
  }
}
