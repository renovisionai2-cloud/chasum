import { runDiscoveryEngine } from "@/lib/website-concierge/discovery/engine";
import { runKnowledgeEngine } from "@/lib/website-concierge/knowledge-engine";
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
 * Single turn: Discovery Engine → (optional) Knowledge Engine → prompt → provider → memory.
 * Marketing website only. UI never embeds product answers.
 */
export async function runConciergeTurn(
  input: RunConciergeTurnInput,
): Promise<RunConciergeTurnResult> {
  const provider = getConciergeProvider(input.providerId ?? "placeholder");
  let memory = recordQuestion(input.memory, input.userMessage);
  memory = applyMemoryPatch(memory, {
    interests: inferInterestsFromText(input.userMessage),
  });

  const discovery = runDiscoveryEngine({
    userMessage: input.userMessage,
    memory,
  });
  memory = discovery.memory;

  if (discovery.result) {
    return {
      assistantMessage: {
        id: createId(),
        role: "assistant",
        content: discovery.result.message,
        createdAt: new Date().toISOString(),
      },
      memory,
      suggestions: discovery.result.suggestions,
      providerId: "business-discovery-v1",
    };
  }

  const context = buildConciergeContext({
    pathname: input.pathname,
    memory,
    messages: input.messages,
  });

  const engine = runKnowledgeEngine({
    query: input.userMessage,
    memory,
    recentMessages: context.recentMessages,
  });

  const intentTags = [
    ...inferInterestsFromText(input.userMessage),
    engine.retrieval.intent,
    "discovery-aware",
  ];
  const prompt = buildConciergePrompt({
    context,
    userMessage: input.userMessage,
    intentTags,
    retrieval: engine.retrieval,
  });

  const result: ConciergeCompletionResult = await provider.complete({
    prompt,
    context,
    userMessage: input.userMessage,
    retrieval: engine.retrieval,
    groundedDraft: {
      message: engine.message,
      suggestions: engine.suggestions,
      memoryPatch: engine.memoryPatch,
    },
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
