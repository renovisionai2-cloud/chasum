import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";

export const PRICING_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "pricing-plans",
    category: "pricing",
    title: "Plans",
    summary: "Clear plans for small and growing service businesses.",
    body:
      "Chasum pricing is built for small and growing service businesses. Free ($0) covers online booking, calendar, and email reminders for one location. Professional ($79/mo) adds unlimited appointments, waitlist, email & text reminders, Summer & Chase, and up to 3 locations. Business ($149/mo) adds up to 10 locations and connecting other tools. Enterprise is custom for larger operators who need hands-on onboarding and dedicated support. During Private Alpha, paid plans go through application—online self-serve billing isn’t open yet.",
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
      "All tiers include an online booking page and calendar. Professional adds text reminders, waitlist, and Summer & Chase. Business adds higher location limits and connecting other tools. Enterprise adds hands-on onboarding and dedicated support. Exact cells live on the /pricing page comparison table.",
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
      "Typical path: start Free while you try the workflow; move to Professional when you want text reminders, waitlist, and AI help; choose Business when you need more locations or to connect other tools; talk Enterprise for a custom setup. Upgrade when your day-to-day needs it—not for feature FOMO.",
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
      "Private Alpha is invite-based. Partners receive founding pricing and guided setup. Apply at /apply. Online self-serve billing isn’t open yet—we won’t pretend checkout is live before it is.",
    tags: ["alpha", "founding", "apply", "invite"],
    followUps: ["Who is a good fit?", "Would you like a product tour first?"],
    relatedIds: ["company-story", "tour-intro"],
  },
];
