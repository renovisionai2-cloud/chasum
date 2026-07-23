/**
 * @deprecated Prefer `knowledge-engine` + `knowledge/catalog`.
 * Kept as a thin adapter so Phase 1 imports keep working.
 */

import { KNOWLEDGE_CATALOG } from "@/lib/website-concierge/knowledge/catalog";
import { retrieveKnowledge } from "@/lib/website-concierge/knowledge-engine";
import type { KnowledgeEntry as EngineEntry } from "@/lib/website-concierge/knowledge/types";
import type {
  BusinessType,
  MarketingPageId,
} from "@/lib/website-concierge/types";
import { createEmptySessionMemory } from "@/lib/website-concierge/session-memory";

export type KnowledgeArticle = {
  id: string;
  tags: string[];
  pages?: MarketingPageId[];
  businessTypes?: BusinessType[];
  title: string;
  body: string;
};

export const WEBSITE_KNOWLEDGE: KnowledgeArticle[] = KNOWLEDGE_CATALOG.map(
  toLegacyArticle,
);

export function searchKnowledge(input: {
  query: string;
  pageId: MarketingPageId;
  businessType: BusinessType;
  limit?: number;
}): KnowledgeArticle[] {
  const memory = {
    ...createEmptySessionMemory(),
    businessType: input.businessType,
  };
  const retrieval = retrieveKnowledge({
    query: input.query,
    intent: "unknown",
    memory,
    limit: input.limit ?? 3,
  });
  return retrieval.hits.map((h) => toLegacyArticle(h.entry));
}

function toLegacyArticle(entry: EngineEntry): KnowledgeArticle {
  return {
    id: entry.id,
    tags: entry.tags,
    title: entry.title,
    body: entry.body,
    businessTypes: entry.industries as BusinessType[] | undefined,
  };
}
