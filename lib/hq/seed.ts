import type {
  HqApplication,
  HqBug,
  HqFeatureRequest,
  HqLaunchReadiness,
  HqPartnerHealth,
  HqProductHealth,
  HqReleaseNote,
  HqRoadmapItem,
} from "@/lib/hq/types";

/** Curated founder operating data until applications/bugs are persisted. */
export const HQ_APPLICATIONS: HqApplication[] = [
  {
    id: "app-gvm",
    businessName: "GVM Ultrasound",
    industry: "Medical imaging",
    contactName: "Design partner",
    email: "ops@gvm.example",
    stage: "onboarded",
    monthlyAppointments: "400+",
    appliedAt: "2026-06-12",
    notes: "Primary dogfood partner",
  },
  {
    id: "app-north",
    businessName: "Northline Wellness",
    industry: "Clinic",
    contactName: "Maya Chen",
    email: "maya@northline.example",
    stage: "interview",
    monthlyAppointments: "180",
    appliedAt: "2026-07-14",
  },
  {
    id: "app-atelier",
    businessName: "Atelier Studio",
    industry: "Salon",
    contactName: "Jordan Blake",
    email: "jordan@atelier.example",
    stage: "applied",
    monthlyAppointments: "220",
    appliedAt: "2026-07-16",
  },
  {
    id: "app-harbor",
    businessName: "Harbor Spa",
    industry: "Spa",
    contactName: "Sofia Reyes",
    email: "sofia@harbor.example",
    stage: "accepted",
    monthlyAppointments: "310",
    appliedAt: "2026-07-10",
  },
  {
    id: "app-peak",
    businessName: "Peak Fitness",
    industry: "Gym",
    contactName: "Derek Holt",
    email: "derek@peak.example",
    stage: "declined",
    monthlyAppointments: "900",
    appliedAt: "2026-07-02",
    notes: "Needs multi-staff login day one",
  },
];

export const HQ_PARTNERS: HqPartnerHealth[] = [
  {
    id: "p-gvm",
    businessName: "GVM Ultrasound",
    status: "active",
    weeklyActivity: 92,
    lastLogin: "2026-07-18",
    bookings7d: 64,
    messages7d: 18,
    supportOpen: 1,
    risk: "low",
  },
  {
    id: "p-harbor",
    businessName: "Harbor Spa",
    status: "onboarding",
    weeklyActivity: 41,
    lastLogin: "2026-07-17",
    bookings7d: 12,
    messages7d: 6,
    supportOpen: 2,
    risk: "medium",
  },
];

export const HQ_BUGS: HqBug[] = [
  {
    id: "bug-1",
    title: "Booking Sheet collect payment still stubs Stripe toast",
    severity: "high",
    status: "open",
    area: "Commerce",
    updatedAt: "2026-07-17",
  },
  {
    id: "bug-2",
    title: "Calendar realtime conflicts across devices",
    severity: "medium",
    status: "open",
    area: "Calendar",
    updatedAt: "2026-07-16",
  },
  {
    id: "bug-3",
    title: "Mock SaaS billing must not mint paid invoices in prod",
    severity: "critical",
    status: "in_progress",
    area: "Billing",
    updatedAt: "2026-07-18",
  },
  {
    id: "bug-4",
    title: "Dense CRM tables on mobile touch targets",
    severity: "low",
    status: "open",
    area: "CRM",
    updatedAt: "2026-07-12",
  },
];

export const HQ_FEATURE_REQUESTS: HqFeatureRequest[] = [
  {
    id: "fr-1",
    title: "Staff invitations + role permissions",
    votes: 8,
    status: "planned",
    source: "GVM + Harbor",
  },
  {
    id: "fr-2",
    title: "Stripe Elements deposits in Booking Sheet",
    votes: 6,
    status: "building",
    source: "Founder audit",
  },
  {
    id: "fr-3",
    title: "WhatsApp / SMS two-way inbox",
    votes: 4,
    status: "triage",
    source: "Apply form themes",
  },
  {
    id: "fr-4",
    title: "Public booking CAPTCHA",
    votes: 3,
    status: "planned",
    source: "Security hardening",
  },
];

export const HQ_ROADMAP: HqRoadmapItem[] = [
  { id: "r1", title: "Milestone 6.1 Production Hardening", lane: "completed" },
  { id: "r2", title: "Private Alpha marketing honesty", lane: "completed" },
  { id: "r3", title: "Chasum HQ Founder OS", lane: "current" },
  { id: "r4", title: "Persist design-partner applications", lane: "current" },
  { id: "r5", title: "Stripe Billing for real subscriptions", lane: "next" },
  { id: "r6", title: "Staff invites + RBAC", lane: "next" },
  { id: "r7", title: "Full AI Workforce beyond Summer/Chase", lane: "future" },
  { id: "r8", title: "Native mobile apps", lane: "future" },
];

export const HQ_RELEASE_NOTES: HqReleaseNote[] = [
  {
    id: "rn-61",
    version: "0.2.1",
    title: "Production Hardening",
    date: "2026-07-18",
    highlights: [
      "Vitest + Playwright quality gates",
      "Rate limits + Zod API validation",
      "Optional Sentry + structured logs",
    ],
  },
  {
    id: "rn-alpha",
    version: "0.2.2",
    title: "Private Alpha positioning",
    date: "2026-07-18",
    highlights: [
      "Apply / roadmap / legal trust pages",
      "Removed fictional social proof",
      "Summer & Chase labeled Early Access",
    ],
  },
];

export const HQ_PRODUCT_HEALTH: HqProductHealth = {
  productionReadinessPct: 85,
  testCoverageLabel: "Critical paths covered (unit + e2e smoke)",
  deploymentStatus: "Vercel · green",
  criticalBugs: 1,
  openBugs: 3,
  performanceLabel: "Healthy at GVM scale",
};

export const HQ_LAUNCH: HqLaunchReadiness = {
  privateAlphaPct: 88,
  closedBetaPct: 72,
  publicLaunchPct: 48,
  privateAlphaNotes: [
    "Ops core shippable for design partners",
    "Marketing claims aligned",
    "Legal v0.1 published",
  ],
  closedBetaNotes: [
    "Stripe Billing still required",
    "Support + help center lite pending",
    "Onboarding wizard pending",
  ],
  publicLaunchNotes: [
    "Self-serve monetization honesty",
    "Multi-staff RBAC",
    "Abuse controls at multi-instance scale",
  ],
};
