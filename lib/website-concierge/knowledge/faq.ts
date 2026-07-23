import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";

export const FAQ_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "faq-security",
    category: "faq",
    title: "Security",
    summary: "Modern stack with disciplined access boundaries.",
    body:
      "Security is foundational: authenticated app surfaces, role-aware access, and careful handling of secrets and webhooks. Marketing Summer never reaches tenant business data — it only uses the public Knowledge Engine. For deeper controls, see /security.",
    tags: ["security", "secure", "hack", "auth"],
    followUps: ["Privacy?", "Data ownership?"],
    relatedIds: ["faq-privacy", "faq-data-ownership"],
  },
  {
    id: "faq-privacy",
    category: "faq",
    title: "Privacy",
    summary: "Respect client and operator data.",
    body:
      "Privacy means collecting what’s needed to run appointments and AI features with clear boundaries. Public site chat memory stays in the browser session. Product privacy details are outlined on /privacy.",
    tags: ["privacy", "gdpr", "pii"],
    followUps: ["Is my data mine?", "Security?"],
    relatedIds: ["faq-data-ownership", "faq-security"],
  },
  {
    id: "faq-data-ownership",
    category: "faq",
    title: "Data Ownership",
    summary: "Your business data should remain yours.",
    body:
      "Chasum’s posture is owner-owned business data: your clients, schedule, and brand identity are yours to operate and export as the platform matures — not locked behind a marketplace identity.",
    tags: ["data ownership", "export", "mine", "own data"],
    followUps: ["Imports?", "Customer portal?"],
    relatedIds: ["faq-imports", "feature-portal"],
  },
  {
    id: "faq-imports",
    category: "faq",
    title: "Imports",
    summary: "Migration is a first-class onboarding concern.",
    body:
      "Imports and migration matter for operators leaving Picktime or other tools. Design partners get founder-backed onboarding help; broader self-serve import tooling expands with the roadmap. Bring your service list and client expectations to the walkthrough.",
    tags: ["import", "migration", "picktime", "csv"],
    followUps: ["Book a walkthrough", "Private Alpha?"],
    relatedIds: ["pricing-alpha", "faq-support"],
  },
  {
    id: "faq-mobile",
    category: "faq",
    title: "Mobile",
    summary: "Mobile-first booking and responsive operations.",
    body:
      "Public booking and marketing experiences are built mobile-first. Dashboard operations are responsive; native apps may expand later. If mobile booking conversion matters to you, that’s a core design pressure for Chasum.",
    tags: ["mobile", "phone", "responsive", "ios", "android"],
    followUps: ["Online booking?", "Customer portal?"],
    relatedIds: ["feature-booking", "feature-portal"],
  },
  {
    id: "faq-payments",
    category: "faq",
    title: "Payments FAQ",
    summary: "Commerce connected to appointments.",
    body:
      "Payments, deposits, gift certificates, and invoices are part of the commerce graph connected to visits — not a disconnected register. Availability of processors and payout details firm up with go-live partners.",
    tags: ["payments faq", "stripe", "pay", "checkout"],
    followUps: ["Deposits?", "Gift certificates?"],
    relatedIds: ["feature-payments", "feature-deposits"],
  },
  {
    id: "faq-support",
    category: "faq",
    title: "Support",
    summary: "Founder-backed support in Private Alpha.",
    body:
      "Private Alpha design partners get direct founder access. For applications use /apply; for walkthroughs use /contact. As we scale, support tiers will match plan levels without losing the “real humans for real operators” bar.",
    tags: ["support", "help", "contact", "founder"],
    followUps: ["Apply for Private Alpha", "Would you like a tour?"],
    relatedIds: ["pricing-alpha", "tour-intro"],
  },
  {
    id: "faq-customization",
    category: "faq",
    title: "Customization",
    summary: "Configure industries — don’t fork the product.",
    body:
      "Chasum prefers configuration over forks: industries share a kernel (scheduling, CRM, money, AI) with configurable services, staff, and workflows. Deep white-label and Enterprise customization expand with plan and partnership.",
    tags: ["customization", "white label", "configure", "brand"],
    followUps: ["Multi-location?", "Enterprise?"],
    relatedIds: ["feature-multi-location", "pricing-plans"],
  },
  {
    id: "faq-ai",
    category: "faq",
    title: "AI FAQ",
    summary: "Grounded assistants — not generic chat widgets.",
    body:
      "Chasum AI is designed to share one Business Brain with role-specific permissions. Marketing Summer uses the Knowledge Engine today (no OpenAI wired yet). In-product Summer/Chase are Early Access for design partners and must stay grounded in business truth.",
    tags: ["ai faq", "chatgpt", "openai", "hallucination"],
    followUps: ["AI features overview", "Product tour — AI vision"],
    relatedIds: ["feature-ai", "tour-ai-vision"],
  },
];
