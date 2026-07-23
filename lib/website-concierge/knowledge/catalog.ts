import { COMPANY_KNOWLEDGE } from "@/lib/website-concierge/knowledge/company";
import { COMPETITIVE_KNOWLEDGE } from "@/lib/website-concierge/knowledge/competitive";
import { FAQ_KNOWLEDGE } from "@/lib/website-concierge/knowledge/faq";
import { FEATURE_KNOWLEDGE } from "@/lib/website-concierge/knowledge/features";
import { INDUSTRY_KNOWLEDGE } from "@/lib/website-concierge/knowledge/industries";
import { PRICING_KNOWLEDGE } from "@/lib/website-concierge/knowledge/pricing";
import { TOUR_KNOWLEDGE } from "@/lib/website-concierge/knowledge/tour";
import type {
  KnowledgeCategory,
  KnowledgeEntry,
} from "@/lib/website-concierge/knowledge/types";

/** Full Knowledge Engine catalog — source of truth for retrieval. */
export const KNOWLEDGE_CATALOG: KnowledgeEntry[] = [
  ...COMPANY_KNOWLEDGE,
  ...FEATURE_KNOWLEDGE,
  ...INDUSTRY_KNOWLEDGE,
  ...PRICING_KNOWLEDGE,
  ...COMPETITIVE_KNOWLEDGE,
  ...FAQ_KNOWLEDGE,
  ...TOUR_KNOWLEDGE,
];

const byId = new Map(KNOWLEDGE_CATALOG.map((e) => [e.id, e]));

export function getKnowledgeById(id: string): KnowledgeEntry | undefined {
  return byId.get(id);
}

export function listKnowledgeByCategory(
  category: KnowledgeCategory,
): KnowledgeEntry[] {
  return KNOWLEDGE_CATALOG.filter((e) => e.category === category);
}
