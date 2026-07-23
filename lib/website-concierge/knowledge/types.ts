/**
 * Knowledge Engine contracts — shared by marketing Summer and future AI roles.
 */

export type KnowledgeCategory =
  | "company"
  | "features"
  | "industries"
  | "pricing"
  | "competitive"
  | "faq"
  | "tour";

export type KnowledgeIntent =
  | "company"
  | "feature"
  | "industry"
  | "pricing"
  | "competitive"
  | "faq"
  | "tour"
  | "unknown";

export type KnowledgeEntry = {
  id: string;
  category: KnowledgeCategory;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  /** Optional industry keys this entry specializes in */
  industries?: string[];
  /** Suggested follow-up prompts for the visitor */
  followUps?: string[];
  /** Related entry ids for “recommend another topic” */
  relatedIds?: string[];
};

export type RankedKnowledgeEntry = {
  entry: KnowledgeEntry;
  score: number;
};

export type KnowledgeRetrieval = {
  intent: KnowledgeIntent;
  query: string;
  hits: RankedKnowledgeEntry[];
  confidence: "high" | "medium" | "low";
  /** True when retrieval is weak — Summer should admit limits */
  unknown: boolean;
};

export type TourStepId =
  | "intro"
  | "dashboard"
  | "booking"
  | "crm"
  | "payments"
  | "reports"
  | "ai-vision"
  | "complete";

export type TourStep = {
  id: TourStepId;
  title: string;
  knowledgeId: string;
  nextPrompt: string;
};
