import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";

export const PRICING_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "pricing-plans",
    category: "pricing",
    title: "Plans",
    summary: "Free, Professional, Business, and Enterprise founding posture.",
    body:
      "Published founding tiers: Free ($0) for core scheduling exploration; Professional ($79/mo) with Early Access AI (Summer & Chase), automation, and up to 3 locations; Business ($149/mo) for more locations and API/webhooks; Enterprise for custom onboarding and SLA. During Private Alpha, paid CTAs route to design-partner application — public self-serve checkout launches after alpha.",
    tags: ["pricing", "plans", "cost", "subscription", "professional", "business", "enterprise", "free"],
    followUps: ["Which plan fits me?", "What is included in Professional?"],
    relatedIds: ["pricing-compare", "pricing-alpha"],
  },
  {
    id: "pricing-compare",
    category: "pricing",
    title: "Feature Comparison",
    summary: "How tiers differ at a glance.",
    body:
      "All tiers include a booking page and core calendar/reception. Professional adds Early Access AI, SMS when enabled, automation & waitlist. Business adds higher location limits, API & webhooks, and advanced automation. Enterprise adds custom onboarding/SLA. Exact cells live on the /pricing page comparison table.",
    tags: ["comparison", "features by plan", "tier", "what’s included"],
    followUps: ["Multi-location limits?", "Tell me about Private Alpha pricing"],
    relatedIds: ["feature-multi-location", "pricing-plans"],
  },
  {
    id: "pricing-trial",
    category: "pricing",
    title: "Free Trial & Exploration",
    summary: "Free tier to explore; alpha partners get founding pricing.",
    body:
      "The Free tier lets design partners explore core scheduling without a paid commitment. Broader “free trial” marketing will firm up with public self-serve billing. Today the honest path is Free exploration or Private Alpha partnership with founding customer pricing.",
    tags: ["trial", "free trial", "explore", "starter"],
    followUps: ["How do I apply?", "What’s on the roadmap after alpha?"],
    relatedIds: ["pricing-alpha", "pricing-upgrades"],
  },
  {
    id: "pricing-upgrades",
    category: "pricing",
    title: "Future Upgrades",
    summary: "Grow from Free → Professional → Business as needs expand.",
    body:
      "Typical upgrade path: start Free or Professional while validating fit; move to Professional when you want Early Access AI and automation; choose Business when locations, API, or team scale demand it; talk Enterprise for custom needs. Upgrades should follow real operational pressure — not feature FOMO.",
    tags: ["upgrade", "future", "grow", "scale"],
    followUps: ["Which plan for a salon?", "Book a walkthrough"],
    relatedIds: ["pricing-plans", "industry-salon"],
  },
  {
    id: "pricing-alpha",
    category: "pricing",
    title: "Private Alpha Pricing",
    summary: "Invite-based founding pricing, not mass checkout yet.",
    body:
      "Private Alpha is invite-based. Design partners receive founding customer pricing and founder support. Apply at /apply. Public self-serve billing launches after we earn it — we won’t pretend checkout is live before it is.",
    tags: ["alpha", "founding", "apply", "invite"],
    followUps: ["Who is a good fit?", "Would you like a product tour first?"],
    relatedIds: ["company-story", "tour-intro"],
  },
];
