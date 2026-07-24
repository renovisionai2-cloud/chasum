/**
 * Business Discovery Engine — dynamic conversational discovery for marketing Summer.
 * Reusable later for Sales AI, Onboarding AI, and Business Brain intake.
 */

export type DiscoveryFieldId =
  | "business_type"
  | "employee_count"
  | "location_count"
  | "current_software"
  | "monthly_volume"
  | "challenges"
  | "goals"
  | "growth_plans";

export type DiscoveryPhase =
  | "opening"
  | "discovering"
  | "recommending"
  | "touring"
  | "open";

export type DiscoveryFollowUpId = "software_improvement";

export type DiscoveryField = {
  id: DiscoveryFieldId;
  /**
   * The Summer Principle — Explain before Ask:
   * why it matters, how the answer helps, what Summer will do, then the question.
   * @see docs/ai/SUMMER_PRINCIPLE.md
   */
  why: string;
  helps: string;
  willDo: string;
  /** Natural consultant-style question */
  question: string;
  /** Quick-reply chips */
  suggestions?: string[];
  /** Skip if another field already implies this */
  skipWhen?: (profile: DiscoveryProfileView) => boolean;
  /** Prefer asking this earlier when true */
  priority: number;
};

/** Read-only view used for branching (avoids circular imports with SessionMemory). */
export type DiscoveryProfileView = {
  businessType: string;
  visitorName: string | null;
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
};

export type DiscoveryExtraction = {
  businessType?: string;
  visitorName?: string | null;
  employeeCount?: string | null;
  locationCount?: string | null;
  currentSoftware?: string | null;
  monthlyVolume?: string | null;
  challenges?: string[];
  goals?: string[];
  growthPlans?: string | null;
  interests?: string[];
};

export type DiscoveryTurnResult = {
  /** Primary consultant reply (may include knowledge recommendation text) */
  message: string;
  suggestions: string[];
  /** Field that was just asked (mark as asked) */
  askedFieldId?: DiscoveryFieldId;
  pendingFollowUpId?: DiscoveryFollowUpId | null;
  discoveryPhase?: DiscoveryPhase;
  recommendationsMade?: string[];
  /** Offer personalized tour */
  offerTour?: boolean;
  /** Query to feed Knowledge Engine for personalized content */
  knowledgeQuery?: string;
};
