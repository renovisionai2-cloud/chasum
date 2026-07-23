import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";
import type { TourStep } from "@/lib/website-concierge/knowledge/types";

export const TOUR_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "tour-intro",
    category: "tour",
    title: "Guided Product Tour",
    summary: "A two-minute walk through Chasum’s core.",
    body:
      "I can give you a short guided tour: Dashboard focus, Online Booking, CRM, Payments, Reports, and the AI vision. Say “start the tour” or “next” anytime — about two minutes if we keep a steady pace.",
    tags: ["tour", "guide", "walkthrough", "demo", "two minute", "show me"],
    followUps: ["Start the tour", "Skip to AI vision"],
    relatedIds: ["tour-dashboard"],
  },
  {
    id: "tour-dashboard",
    category: "tour",
    title: "Tour — Dashboard",
    summary: "What should I focus on today?",
    body:
      "Dashboard: the home base that should answer “What should I focus on today?” — not a wall of widgets. It’s where priorities, schedule health, and next actions meet.",
    tags: ["tour dashboard", "home screen"],
    followUps: ["Next: Booking", "Ask about CRM instead"],
    relatedIds: ["tour-booking", "feature-calendar"],
  },
  {
    id: "tour-booking",
    category: "tour",
    title: "Tour — Booking",
    summary: "Public booking powered by the same engine.",
    body:
      "Booking: clients book on your branded page with live availability from the same engine staff use — so the website and reception never invent different truths.",
    tags: ["tour booking"],
    followUps: ["Next: CRM", "Tell me more about deposits"],
    relatedIds: ["tour-crm", "feature-booking"],
  },
  {
    id: "tour-crm",
    category: "tour",
    title: "Tour — CRM",
    summary: "Context before the conversation.",
    body:
      "CRM: before you speak with a client, see history and notes in one place. It’s the difference between a calendar slot and a relationship.",
    tags: ["tour crm"],
    followUps: ["Next: Payments", "Industry fit for my business"],
    relatedIds: ["tour-payments", "feature-crm"],
  },
  {
    id: "tour-payments",
    category: "tour",
    title: "Tour — Payments",
    summary: "Money connected to the visit.",
    body:
      "Payments: deposits, gift certificates, and invoices connect to appointments and clients — so revenue isn’t trapped in a separate mental model from the schedule.",
    tags: ["tour payments"],
    followUps: ["Next: Reports", "Gift certificates?"],
    relatedIds: ["tour-reports", "feature-payments"],
  },
  {
    id: "tour-reports",
    category: "tour",
    title: "Tour — Reports",
    summary: "What changed?",
    body:
      "Reports: answer “What changed?” — bookings, revenue signals, and operational movement — so you can coach the business, not only relive the calendar.",
    tags: ["tour reports"],
    followUps: ["Next: AI vision", "Pricing?"],
    relatedIds: ["tour-ai-vision", "feature-reports"],
  },
  {
    id: "tour-ai-vision",
    category: "tour",
    title: "Tour — AI Vision",
    summary: "Business Brain and role-specific AI.",
    body:
      "AI vision: Summer, Chase, and future roles share one Business Brain with different permissions — Reception, Manager, Owner, Marketing — aimed at understanding the business year over year.",
    tags: ["tour ai", "ai vision"],
    followUps: ["Apply for Private Alpha", "How do you differ from Fresha?"],
    relatedIds: ["feature-ai", "company-bos", "pricing-alpha"],
  },
];

export const TOUR_STEPS: TourStep[] = [
  {
    id: "intro",
    title: "Introduction",
    knowledgeId: "tour-intro",
    nextPrompt: "Start with the Dashboard",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    knowledgeId: "tour-dashboard",
    nextPrompt: "Next: Booking",
  },
  {
    id: "booking",
    title: "Booking",
    knowledgeId: "tour-booking",
    nextPrompt: "Next: CRM",
  },
  {
    id: "crm",
    title: "CRM",
    knowledgeId: "tour-crm",
    nextPrompt: "Next: Payments",
  },
  {
    id: "payments",
    title: "Payments",
    knowledgeId: "tour-payments",
    nextPrompt: "Next: Reports",
  },
  {
    id: "reports",
    title: "Reports",
    knowledgeId: "tour-reports",
    nextPrompt: "Next: AI vision",
  },
  {
    id: "ai-vision",
    title: "AI Vision",
    knowledgeId: "tour-ai-vision",
    nextPrompt: "Apply for Private Alpha",
  },
  {
    id: "complete",
    title: "Complete",
    knowledgeId: "tour-ai-vision",
    nextPrompt: "Ask me anything else",
  },
];
