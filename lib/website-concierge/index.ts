/**
 * Marketing Website Concierge (Summer) — public site only.
 * Do not import from `lib/summer` (in-app receptionist).
 */

export type {
  BuiltPrompt,
  BusinessType,
  ConciergeCompletionRequest,
  ConciergeCompletionResult,
  ConciergeContext,
  ConciergeMessage,
  ConciergeProvider,
  MarketingPageId,
  PageContext,
  SessionMemory,
} from "@/lib/website-concierge/types";

export {
  createId,
  runConciergeTurn,
} from "@/lib/website-concierge/conversation";
export { buildConciergeContext } from "@/lib/website-concierge/context-engine";
export {
  detectMarketingPage,
  getPageGreeting,
} from "@/lib/website-concierge/page-awareness";
export { buildConciergePrompt } from "@/lib/website-concierge/prompt-builder";
export { getConciergeProvider } from "@/lib/website-concierge/providers";
export {
  applyMemoryPatch,
  createEmptySessionMemory,
  loadSessionMemory,
  recordPageVisit,
  saveSessionMemory,
} from "@/lib/website-concierge/session-memory";
export {
  searchKnowledge,
  WEBSITE_KNOWLEDGE,
} from "@/lib/website-concierge/knowledge-base";
export {
  retrieveKnowledge,
  runKnowledgeEngine,
} from "@/lib/website-concierge/knowledge-engine";
export {
  getKnowledgeById,
  KNOWLEDGE_CATALOG,
  listKnowledgeByCategory,
} from "@/lib/website-concierge/knowledge/catalog";
