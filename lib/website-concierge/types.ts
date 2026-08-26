/**
 * Website Concierge (marketing Summer) — shared contracts.
 * Separate from in-app Summer (`lib/summer`). Designed for future shared AI OS roles.
 */

import type {
  DiscoveryFieldId,
  DiscoveryFollowUpId,
  DiscoveryPhase,
} from "@/lib/website-concierge/discovery/types";

export type {
  DiscoveryFieldId,
  DiscoveryFollowUpId,
  DiscoveryPhase,
} from "@/lib/website-concierge/discovery/types";

export type MarketingPageId =
  | "home"
  | "features"
  | "pricing"
  | "about"
  | "contact"
  | "apply"
  | "meet-summer"
  | "general";

export type ConciergeRole = "user" | "assistant" | "system";

export type ConciergeMessage = {
  id: string;
  role: Exclude<ConciergeRole, "system">;
  content: string;
  createdAt: string;
};

export type BusinessType =
  | "ultrasound"
  | "salon"
  | "spa"
  | "clinic"
  | "dental"
  | "fitness"
  | "consulting"
  | "massage"
  | "chiropractic"
  | "physiotherapy"
  | "veterinary"
  | "pet_grooming"
  | "barbershop"
  | "law_firm"
  | "automotive"
  | "other"
  | "unknown";

export type SessionMemory = {
  businessType: BusinessType;
  /**
   * Marketing multi-select business labels (e.g. "Medical Clinic", "Ultrasound").
   * Primary compatibility: first entry maps into businessType when inferred.
   */
  businessTypes: string[];
  visitorName: string | null;
  interests: string[];
  pagesVisited: MarketingPageId[];
  previousQuestions: string[];
  /** Knowledge entry ids already used this session (avoid repetition) */
  answeredArticleIds: string[];
  /** Most recent topic ids for diversity */
  lastTopicIds: string[];
  /** Guided tour cursor */
  tourStepId: string | null;
  /** Business Discovery Engine profile */
  employeeCount: string | null;
  locationCount: string | null;
  currentSoftware: string | null;
  monthlyVolume: string | null;
  challenges: string[];
  goals: string[];
  growthPlans: string | null;
  discoveryAskedIds: DiscoveryFieldId[];
  recommendationsMade: string[];
  discoveryPhase: DiscoveryPhase;
  pendingFollowUpId: DiscoveryFollowUpId | null;
  updatedAt: string;
};

export type PageContext = {
  pageId: MarketingPageId;
  pathname: string;
  title: string;
  goals: string[];
};

export type ConciergeContext = {
  page: PageContext;
  memory: SessionMemory;
  recentMessages: ConciergeMessage[];
};

export type BuiltPrompt = {
  system: string;
  user: string;
  /** Structured hints for placeholder / future model routing */
  hints: {
    pageId: MarketingPageId;
    businessType: BusinessType;
    interests: string[];
    intentTags: string[];
  };
};

export type ConciergeCompletionRequest = {
  prompt: BuiltPrompt;
  context: ConciergeContext;
  userMessage: string;
  /** Retrieved knowledge pack for any future model provider */
  retrieval?: import("@/lib/website-concierge/knowledge/types").KnowledgeRetrieval;
  /**
   * Phase 2 grounded draft from Knowledge Engine.
   * Placeholder uses this; LLM providers will ignore and generate from retrieval + prompt.
   */
  groundedDraft?: {
    message: string;
    suggestions: string[];
    memoryPatch?: ConciergeCompletionResult["memoryPatch"];
  };
};

export type ConciergeCompletionResult = {
  message: string;
  /** Suggested quick replies for the UI (optional) */
  suggestions?: string[];
  /** Memory patches inferred from this turn */
  memoryPatch?: Partial<
    Pick<
      SessionMemory,
      | "businessType"
      | "businessTypes"
      | "visitorName"
      | "interests"
      | "answeredArticleIds"
      | "lastTopicIds"
      | "tourStepId"
      | "employeeCount"
      | "locationCount"
      | "currentSoftware"
      | "monthlyVolume"
      | "challenges"
      | "goals"
      | "growthPlans"
      | "discoveryAskedIds"
      | "recommendationsMade"
      | "discoveryPhase"
      | "pendingFollowUpId"
    >
  >;
};

export type ConciergeProvider = {
  readonly id: string;
  complete(
    request: ConciergeCompletionRequest,
  ): Promise<ConciergeCompletionResult>;
};
