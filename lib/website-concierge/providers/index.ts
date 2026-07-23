import { createPlaceholderProvider } from "@/lib/website-concierge/providers/placeholder";
import type { ConciergeProvider } from "@/lib/website-concierge/types";

export type ConciergeProviderId = "placeholder" | "openai";

/**
 * Provider registry — UI and conversation layer depend only on ConciergeProvider.
 * OpenAI (and others) plug in here later without UI redesign.
 */
export function getConciergeProvider(
  id: ConciergeProviderId = "placeholder",
): ConciergeProvider {
  switch (id) {
    case "openai":
      // Phase 1: not wired. Fall back to placeholder until keys + policy exist.
      return createPlaceholderProvider();
    case "placeholder":
    default:
      return createPlaceholderProvider();
  }
}
