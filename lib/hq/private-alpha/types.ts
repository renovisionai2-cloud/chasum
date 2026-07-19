/**
 * Private Alpha Management Platform — internal founder ops contracts.
 * Not customer-facing.
 */

export type PartnerStatus =
  | "invited"
  | "onboarding"
  | "active"
  | "at_risk"
  | "paused";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type OnboardingStepKey =
  | "business_profile"
  | "locations"
  | "services"
  | "employees"
  | "business_hours"
  | "branding"
  | "communications"
  | "commerce"
  | "summer_setup"
  | "chase_setup"
  | "training_complete"
  | "go_live";

export type OnboardingStep = {
  key: OnboardingStepKey;
  label: string;
  done: boolean;
  completedAt?: string;
};

export type FeedbackStatus =
  | "new"
  | "under_review"
  | "planned"
  | "in_progress"
  | "completed"
  | "rejected";

export type SupportSeverity = "critical" | "high" | "medium" | "low";

export type SupportStatus = "reported" | "assigned" | "resolved";

export type AlphaPartner = {
  code: string;
  companyName: string;
  industry: string;
  primaryContact: string;
  email: string;
  phone: string;
  status: PartnerStatus;
  onboarding: OnboardingStep[];
  firstLogin: string | null;
  lastActivity: string | null;
  weeklyActiveUsers: number;
  bookingsCreated: number;
  revenueProcessedLabel: string;
  supportTicketsOpen: number;
  featureRequestsOpen: number;
  openBugs: number;
  customerSatisfaction: number;
  healthScore: number;
  risk: RiskLevel;
  nextMeeting: string | null;
  meetingNotes: string;
};

export type AlphaFeedback = {
  id: string;
  partnerCode: string;
  partnerName: string;
  title: string;
  status: FeedbackStatus;
  roadmapItemId: string | null;
  roadmapLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AlphaSupportIssue = {
  id: string;
  partnerCode: string;
  partnerName: string;
  title: string;
  severity: SupportSeverity;
  status: SupportStatus;
  assignedTo: string | null;
  reportedAt: string;
  resolvedAt: string | null;
};

export type AlphaWeeklyCompanyReview = {
  partnerCode: string;
  companyName: string;
  wins: string[];
  problems: string[];
  requestedFeatures: string[];
  health: number;
  usage: string;
};

export type AlphaWeeklyReport = {
  weekOf: string;
  summary: string;
  companies: AlphaWeeklyCompanyReview[];
};

export type AlphaFounderNote = {
  id: string;
  partnerCode: string | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type PrivateAlphaSnapshot = {
  generatedAt: string;
  partners: AlphaPartner[];
  feedback: AlphaFeedback[];
  support: AlphaSupportIssue[];
  weeklyReport: AlphaWeeklyReport;
  founderNotes: AlphaFounderNote[];
  totals: {
    partners: number;
    active: number;
    onboarding: number;
    atRisk: number;
    openSupport: number;
    openFeedback: number;
    avgHealth: number;
  };
};
