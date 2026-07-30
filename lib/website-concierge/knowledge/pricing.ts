import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";

export const PRICING_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "pricing-plans",
    category: "pricing",
    title: "Plans",
    summary: "Free, Professional, Business, and Enterprise for every growth stage.",
    body:
      "Free ($0) covers online booking, calendar, email reminders, basic customers, 1 staff, and 1 location. Professional ($79/mo, or $63/mo billed yearly) adds Summer, SMS, business messaging, payments, gift cards, up to 3 staff and locations. Business ($149/mo, or $119/mo billed yearly) adds unlimited staff, up to 6 locations, analytics, API, priority support, and inventory where applicable. Enterprise is custom for franchises and large organizations. During Private Alpha, CTAs go through application—public self-serve billing is not open yet.",
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
      "Free does not include SMS, business messaging, or invoicing. Professional and above include Summer, SMS, messaging, payments, and gift cards. Business adds higher scale, analytics, and API. Enterprise adds white-glove onboarding and dedicated support. Exact cells live on the /pricing comparison table.",
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
      "The Free tier lets you try core booking without a paid commitment. Broader free-trial marketing will firm up with public self-serve billing. Today the honest path is Free exploration or Private Alpha partnership with founding customer pricing.",
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
      "Typical path: start Free; move to Professional for Summer, SMS, and more capacity; choose Business for multi-location scale and API; talk Enterprise for custom setup. Upgrade when day-to-day needs require it.",
    tags: ["upgrade", "future", "grow", "scale"],
    followUps: ["Which plan for a salon?", "Schedule a Demo"],
    relatedIds: ["pricing-plans", "industry-salon"],
  },
  {
    id: "pricing-alpha",
    category: "pricing",
    title: "Private Alpha Pricing",
    summary: "Invite-based founding pricing, not mass checkout yet.",
    body:
      "Private Alpha is invite-based. Partners receive founding pricing and guided setup. Apply at /apply. Online self-serve billing isn’t open yet.",
    tags: ["alpha", "founding", "apply", "invite"],
    followUps: ["Who is a good fit?", "Would you like a product tour first?"],
    relatedIds: ["company-story", "tour-intro"],
  },
];
