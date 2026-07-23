import {
  inferBusinessTypeFromText,
  inferInterestsFromText,
  inferNameFromText,
} from "@/lib/website-concierge/session-memory";
import type {
  ConciergeCompletionRequest,
  ConciergeCompletionResult,
  ConciergeProvider,
} from "@/lib/website-concierge/types";

/**
 * Phase 2 provider: prefers Knowledge Engine groundedDraft.
 * Future OpenAI/Anthropic/Gemini/local providers ignore draft and use prompt + retrieval.
 */
export function createPlaceholderProvider(): ConciergeProvider {
  return {
    id: "knowledge-engine-v2",
    async complete(
      request: ConciergeCompletionRequest,
    ): Promise<ConciergeCompletionResult> {
      const { context, userMessage, groundedDraft } = request;

      const inferredType = inferBusinessTypeFromText(userMessage);
      const inferredName = inferNameFromText(userMessage);
      const inferredInterests = inferInterestsFromText(userMessage);

      const baseMessage =
        groundedDraft?.message ??
        "I can help with Chasum’s product knowledge — features, industries, pricing, or a two-minute tour.";

      const memoryPatch: ConciergeCompletionResult["memoryPatch"] = {
        ...(groundedDraft?.memoryPatch ?? {}),
      };
      if (inferredType) memoryPatch.businessType = inferredType;
      if (inferredName) memoryPatch.visitorName = inferredName;
      if (inferredInterests.length) {
        memoryPatch.interests = [
          ...(memoryPatch.interests ?? []),
          ...inferredInterests,
        ];
      }

      const personalize = personalizePrefix({
        name: inferredName ?? context.memory.visitorName,
        businessType: inferredType ?? context.memory.businessType,
      });

      return {
        message: [personalize, baseMessage].filter(Boolean).join(" "),
        suggestions: groundedDraft?.suggestions ?? [
          "What is Chasum?",
          "Start the tour",
          "Show pricing",
        ],
        memoryPatch,
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
    bits.push(`for a ${input.businessType.replace(/_/g, " ")} business,`);
  }
  return bits.join(" ");
}
