import { createPlaceholderProvider } from "@/lib/website-concierge/providers/placeholder";
import type { ConciergeProvider } from "@/lib/website-concierge/types";

/**
 * Future-ready provider ids. Phase 2 still serves Knowledge Engine via placeholder.
 * UI and conversation orchestration stay unchanged when real models are wired.
 */
export type ConciergeProviderId =
  | "placeholder"
  | "openai"
  | "anthropic"
  | "gemini"
  | "local";

export function getConciergeProvider(
  id: ConciergeProviderId = "placeholder",
): ConciergeProvider {
  switch (id) {
    case "openai":
    case "anthropic":
    case "gemini":
    case "local":
      // Not integrated yet — Knowledge Engine pack will be passed to these later.
      return createPlaceholderProvider();
    case "placeholder":
    default:
      return createPlaceholderProvider();
  }
}
