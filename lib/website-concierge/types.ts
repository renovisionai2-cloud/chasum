/**
 * Website Concierge (marketing Summer) — shared contracts.
 * Separate from in-app Summer (`lib/summer`). Designed for future shared AI OS roles.
 */

export type MarketingPageId =
  | "home"
  | "features"
  | "pricing"
  | "about"
  | "contact"
  | "apply"
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
  | "other"
  | "unknown";

export type SessionMemory = {
  businessType: BusinessType;
  visitorName: string | null;
  interests: string[];
  pagesVisited: MarketingPageId[];
  previousQuestions: string[];
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
};

export type ConciergeCompletionResult = {
  message: string;
  /** Suggested quick replies for the UI (optional) */
  suggestions?: string[];
  /** Memory patches inferred from this turn */
  memoryPatch?: Partial<
    Pick<SessionMemory, "businessType" | "visitorName" | "interests">
  >;
};

export type ConciergeProvider = {
  readonly id: string;
  complete(
    request: ConciergeCompletionRequest,
  ): Promise<ConciergeCompletionResult>;
};
