import type { DiscoveryField } from "@/lib/website-concierge/discovery/types";

/**
 * The Summer Principle — permanent conversation design for Chasum AI.
 * Understand → Explain → Ask → Think → Recommend → Confirm → Continue
 *
 * @see docs/ai/SUMMER_PRINCIPLE.md
 */

export const SUMMER_PRINCIPLE_SEQUENCE = [
  "Understand",
  "Explain",
  "Ask",
  "Think",
  "Recommend",
  "Confirm",
  "Continue",
] as const;

export type SummerPrincipleBeat = (typeof SUMMER_PRINCIPLE_SEQUENCE)[number];

/**
 * Compose an educational ask: why it matters, how it helps, what Summer will do, then the question.
 */
export function formatDiscoveryAsk(
  field: Pick<DiscoveryField, "why" | "helps" | "willDo" | "question">,
  options?: { understand?: string | null },
): string {
  return [options?.understand, field.why, field.helps, field.willDo, field.question]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

/** Prompt Builder / LLM system rules — keep in sync with docs/ai/SUMMER_PRINCIPLE.md */
export const SUMMER_PRINCIPLE_PROMPT_RULES = [
  "The Summer Principle (mandatory): never ask a question without first explaining why the information matters, how the answer helps, and what you will do with it.",
  "Every question must feel educational and consultative — never interrogative or like a form.",
  "Follow the consultation sequence: Understand → Explain → Ask → Think → Recommend → Confirm → Continue.",
  "Ask one simple question at a time. Do not dump multiple discovery questions in one turn.",
  "Show reasoning from real session context only — never invent insights, competitors' weaknesses, or fake analysis.",
] as const;
