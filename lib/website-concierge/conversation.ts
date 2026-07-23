import { buildConciergeContext } from "@/lib/website-concierge/context-engine";
import { buildConciergePrompt } from "@/lib/website-concierge/prompt-builder";
import {
  getConciergeProvider,
  type ConciergeProviderId,
} from "@/lib/website-concierge/providers";
import {
  applyMemoryPatch,
  inferInterestsFromText,
  recordQuestion,
} from "@/lib/website-concierge/session-memory";
import type {
  ConciergeCompletionResult,
  ConciergeMessage,
  SessionMemory,
} from "@/lib/website-concierge/types";

export type RunConciergeTurnInput = {
  pathname: string;
  userMessage: string;
  messages: ConciergeMessage[];
  memory: SessionMemory;
  providerId?: ConciergeProviderId;
};

export type RunConciergeTurnResult = {
  assistantMessage: ConciergeMessage;
  memory: SessionMemory;
  suggestions: string[];
  providerId: string;
};

/**
 * Single turn orchestration: context → prompt → provider → memory update.
 * UI components call this instead of embedding response logic.
 */
export async function runConciergeTurn(
  input: RunConciergeTurnInput,
): Promise<RunConciergeTurnResult> {
  const provider = getConciergeProvider(input.providerId ?? "placeholder");
  let memory = recordQuestion(input.memory, input.userMessage);
  memory = applyMemoryPatch(memory, {
    interests: inferInterestsFromText(input.userMessage),
  });

  const context = buildConciergeContext({
    pathname: input.pathname,
    memory,
    messages: input.messages,
  });

  const intentTags = inferInterestsFromText(input.userMessage);
  const prompt = buildConciergePrompt({
    context,
    userMessage: input.userMessage,
    intentTags,
  });

  const result: ConciergeCompletionResult = await provider.complete({
    prompt,
    context,
    userMessage: input.userMessage,
  });

  memory = applyMemoryPatch(memory, result.memoryPatch);

  return {
    assistantMessage: {
      id: createId(),
      role: "assistant",
      content: result.message,
      createdAt: new Date().toISOString(),
    },
    memory,
    suggestions: result.suggestions ?? [],
    providerId: provider.id,
  };
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
