import { GroundedReceptionistProvider } from "@/lib/ai-receptionist/providers/grounded";
import { tryCreateOpenAiProvider } from "@/lib/ai-receptionist/providers/openai";
import type { ReceptionistAiProvider } from "@/lib/ai-receptionist/providers/types";

let cached: ReceptionistAiProvider | null = null;

/**
 * Prefer OpenAI when configured; otherwise grounded Chasum-data provider.
 * Architecture supports swapping providers without changing callers.
 */
export function getReceptionistProvider(): ReceptionistAiProvider {
  if (cached) return cached;
  const openai = tryCreateOpenAiProvider();
  cached = openai?.ready ? openai : new GroundedReceptionistProvider();
  return cached;
}

/** Test helper — reset singleton between suites. */
export function resetReceptionistProvider() {
  cached = null;
}

export type { ReceptionistAiProvider } from "@/lib/ai-receptionist/providers/types";
