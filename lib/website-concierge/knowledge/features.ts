import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";

export const FEATURE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "feature-booking",
    category: "features",
    title: "Online Booking",
    summary: "Branded public booking with real availability.",
    body:
      "Online Booking gives clients a branded /book page with live availability from the same scheduling engine the dashboard uses — reducing double-books and “call to confirm” friction.",
    tags: ["booking", "online booking", "public page", "availability", "schedule"],
    followUps: ["How does the calendar work?", "Do you support deposits?"],
    relatedIds: ["feature-calendar", "feature-deposits", "feature-portal"],
  },
  {
    id: "feature-crm",
    category: "features",
    title: "CRM",
    summary: "Know the customer before you speak.",
    body:
      "CRM keeps client profiles, history, and context close to the appointment — so Reception and owners answer “What should I know before speaking with this customer?” instead of hunting notes.",
    tags: ["crm", "clients", "customers", "profiles", "history"],
    followUps: ["What about marketing to inactive clients?", "Show me the product tour"],
    relatedIds: ["feature-reports", "tour-crm"],
  },
  {
    id: "feature-calendar",
    category: "features",
    title: "Calendar",
    summary: "Maximize today’s schedule from one reception view.",
    body:
      "Calendar / Reception is the day-of command surface: appointments, staff, and status in one place so teams can fill gaps, reduce no-shows, and keep the floor moving.",
    tags: ["calendar", "reception", "schedule", "day view"],
    followUps: ["How do employees and services fit in?", "What about multi-location?"],
    relatedIds: ["feature-employees", "feature-multi-location", "tour-dashboard"],
  },
  {
    id: "feature-payments",
    category: "features",
    title: "Payments",
    summary: "Commerce connected to appointments — not a bolt-on till.",
    body:
      "Payments and commerce tools connect money moments to appointments and clients — so revenue, invoices, and visit outcomes live in the same operating system as the schedule.",
    tags: ["payments", "billing", "commerce", "money", "checkout"],
    followUps: ["Do you support deposits?", "What about gift certificates?"],
    relatedIds: ["feature-deposits", "feature-gift-certificates", "tour-payments"],
  },
  {
    id: "feature-deposits",
    category: "features",
    title: "Deposits",
    summary: "Protect the book with deposit policies.",
    body:
      "Deposits help reduce no-shows and hold high-demand slots. Policies belong next to booking and payments so clients understand expectations before they confirm.",
    tags: ["deposits", "no-show", "policy", "prepay"],
    followUps: ["Tell me about packages", "How do reports show deposit impact?"],
    relatedIds: ["feature-packages", "feature-payments"],
  },
  {
    id: "feature-gift-certificates",
    category: "features",
    title: "Gift Certificates",
    summary: "Issue and redeem gift value inside the business graph.",
    body:
      "Gift certificates support seasonal and referral moments — issuance and redemption should connect to clients and revenue so marketing and front desk share the same truth.",
    tags: ["gift", "gift certificate", "gift card", "voucher"],
    followUps: ["What about packages?", "How does marketing use gift history?"],
    relatedIds: ["feature-packages", "feature-payments"],
  },
  {
    id: "feature-packages",
    category: "features",
    title: "Packages",
    summary: "Sell series and bundles that drive repeat visits.",
    body:
      "Packages help studios sell series, memberships-style bundles, and multi-visit offers — tied to booking and CRM so remaining sessions and renewals are visible.",
    tags: ["packages", "series", "bundle", "membership"],
    followUps: ["Which industries use packages most?", "How do reports track package sales?"],
    relatedIds: ["industry-spa", "industry-salon", "feature-reports"],
  },
  {
    id: "feature-reports",
    category: "features",
    title: "Reports",
    summary: "Answer “What changed?” with operational truth.",
    body:
      "Reports surface what moved — appointments, revenue signals, and operational trends — so owners aren’t stuck exporting CSVs to understand the week.",
    tags: ["reports", "analytics", "insights", "dashboards"],
    followUps: ["What is Chase?", "Would you like the AI vision tour step?"],
    relatedIds: ["feature-ai", "tour-reports"],
  },
  {
    id: "feature-employees",
    category: "features",
    title: "Employee Management",
    summary: "Staff, services, and coaching cues in one place.",
    body:
      "Employee management connects people to services, schedules, and performance signals — supporting the question “Who needs coaching?” instead of only listing staff names.",
    tags: ["employees", "staff", "team", "workforce", "coaching"],
    followUps: ["How does multi-location staffing work?", "Tell me about the calendar"],
    relatedIds: ["feature-calendar", "feature-multi-location"],
  },
  {
    id: "feature-multi-location",
    category: "features",
    title: "Multi-location",
    summary: "One business brain across sites.",
    body:
      "Multi-location support treats sites as first-class: shared business identity with location-scoped schedules, staff, and reporting — aiming for Business and Enterprise plan capacity as you grow.",
    tags: ["multi-location", "locations", "sites", "franchise"],
    followUps: ["Which plan fits multi-location?", "How does booking work per location?"],
    relatedIds: ["pricing-plans", "feature-booking"],
  },
  {
    id: "feature-portal",
    category: "features",
    title: "Customer Portal",
    summary: "Client self-serve without losing brand control.",
    body:
      "Customer portal experiences let clients manage visits through secure links while the business keeps ownership of branding and data — reducing phone tag for simple changes.",
    tags: ["portal", "customer portal", "self-serve", "client link"],
    followUps: ["Is my data mine?", "How does online booking relate?"],
    relatedIds: ["faq-data-ownership", "feature-booking"],
  },
  {
    id: "feature-ai",
    category: "features",
    title: "AI Features",
    summary: "Summer, Chase, and a shared Business Brain roadmap.",
    body:
      "Early Access AI includes Summer (reception-style and website concierge) and Chase (insights). Long-term AI roles share one Business Brain with different permissions — Reception, Manager, Owner, Marketing — without siloed “truth.”",
    tags: ["ai", "summer", "chase", "automation", "workforce"],
    followUps: ["Would you like a two-minute tour?", "How is this different from chatbot widgets?"],
    relatedIds: ["tour-ai-vision", "company-bos", "competitive-philosophy"],
  },
];
