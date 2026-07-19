/**
 * Chasum HQ — Founder Operating System contracts.
 * Internal only. Never exposed to tenant customers.
 */

export type PipelineStage =
  | "applied"
  | "interview"
  | "accepted"
  | "declined"
  | "onboarded";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type HqApplication = {
  id: string;
  businessName: string;
  industry: string;
  contactName: string;
  email: string;
  stage: PipelineStage;
  monthlyAppointments: string;
  appliedAt: string;
  notes?: string;
};

export type HqPartnerHealth = {
  id: string;
  businessName: string;
  status: "active" | "onboarding" | "at_risk" | "churned";
  weeklyActivity: number;
  lastLogin: string;
  bookings7d: number;
  messages7d: number;
  supportOpen: number;
  risk: RiskLevel;
};

export type HqBug = {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  area: string;
  updatedAt: string;
};

export type HqFeatureRequest = {
  id: string;
  title: string;
  votes: number;
  status: "triage" | "planned" | "building" | "shipped";
  source: string;
};

export type HqRoadmapItem = {
  id: string;
  title: string;
  lane: "completed" | "current" | "next" | "future";
};

export type HqReleaseNote = {
  id: string;
  version: string;
  title: string;
  date: string;
  highlights: string[];
};

export type HqExecutiveCards = {
  applications: number;
  accepted: number;
  activeBusinesses: number;
  weeklyActive: number;
  mrrLabel: string;
  bookings7d: number;
  summerConversations: number;
  chaseReports: number;
  supportTickets: number;
  productionHealth: "healthy" | "degraded" | "down";
  productionHealthLabel: string;
};

export type HqLaunchReadiness = {
  privateAlphaPct: number;
  closedBetaPct: number;
  publicLaunchPct: number;
  privateAlphaNotes: string[];
  closedBetaNotes: string[];
  publicLaunchNotes: string[];
};

export type HqProductHealth = {
  productionReadinessPct: number;
  testCoverageLabel: string;
  deploymentStatus: string;
  criticalBugs: number;
  openBugs: number;
  performanceLabel: string;
};

export type HqSnapshot = {
  generatedAt: string;
  executive: HqExecutiveCards;
  applications: HqApplication[];
  pipelineCounts: Record<PipelineStage, number>;
  partners: HqPartnerHealth[];
  productHealth: HqProductHealth;
  criticalBugs: HqBug[];
  openBugs: HqBug[];
  featureRequests: HqFeatureRequest[];
  roadmap: HqRoadmapItem[];
  releaseNotes: HqReleaseNote[];
  launch: HqLaunchReadiness;
  dataSources: {
    platformMetrics: "live" | "seed";
    pipeline: "seed";
    note: string;
  };
};
