import { detectMarketingPage } from "@/lib/website-concierge/page-awareness";
import type {
  ConciergeContext,
  ConciergeMessage,
  SessionMemory,
} from "@/lib/website-concierge/types";

/**
 * Assembles page + memory + recent transcript into a single context object
 * for the prompt builder and AI provider.
 */
export function buildConciergeContext(input: {
  pathname: string;
  memory: SessionMemory;
  messages: ConciergeMessage[];
  recentLimit?: number;
}): ConciergeContext {
  const page = detectMarketingPage(input.pathname);
  const recentLimit = input.recentLimit ?? 8;
  return {
    page,
    memory: input.memory,
    recentMessages: input.messages.slice(-recentLimit),
  };
}
