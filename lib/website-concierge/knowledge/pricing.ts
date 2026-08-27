import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";

export const PRICING_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "pricing-plans",
    category: "pricing",
    title: "Plans",
    summary: "Free, Professional, Business, and Enterprise for every growth stage.",
    body:
      "Free ($0) covers online booking, calendar, email reminders, basic customers, 1 staff, and 1 location. Professional is $79/month, or $790/year (pay for 10 months, receive 12). It adds Summer — Chasum's AI Business Manager — plus SMS, customer communications, payments & financials (manual-first / Early Access), gift certificates, invoicing (Early Access), up to 3 staff and locations. Business is $149/month, or $1,490/year on the same 10-for-12 rule, with unlimited staff, up to 6 locations, reporting & insights, API & integrations when enabled, and priority support. Inventory is future direction, not a current Business inclusion. Enterprise is custom. During Private Alpha, plan CTAs go to Apply—public self-serve billing is not open yet. Annual billing is Save 2 months: pay for 10, receive 12.",
    tags: ["pricing", "plans", "cost", "subscription", "professional", "business", "enterprise", "free", "annual"],
    followUps: ["Which plan fits me?", "What is included in Professional?"],
    relatedIds: ["pricing-compare", "pricing-alpha"],
  },
  {
    id: "pricing-compare",
    category: "pricing",
    title: "Feature Comparison",
    summary: "How tiers differ at a glance.",
    body:
      "Free does not include SMS, customer communications, invoicing, payments & financials, gift certificates, or Summer. Professional and above include Summer (assistive: observe, understand, recommend), configured SMS, customer communications, payments & financials, gift certificates, and Early Access invoicing. Business adds higher staff/location scale, reporting & insights, and API when enabled. Enterprise adds white-glove onboarding and dedicated support as commercial services. Custom permissions and Franchise Management software are not current included products. Exact cells live on the /pricing comparison table.",
    tags: ["comparison", "features by plan", "tier", "what’s included"],
    followUps: ["Multi-location limits?", "Tell me about Private Alpha pricing"],
    relatedIds: ["feature-multi-location", "pricing-plans"],
  },
  {
    id: "pricing-trial",
    category: "pricing",
    title: "Free Trial & Exploration",
    summary: "Free plan exists; access is through Private Alpha.",
    body:
      "Chasum has a Free plan, but access is currently through Private Alpha. Public self-serve signup and billing are not open yet. Apply at /apply.",
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
      "Typical path: start on Free through Private Alpha; move to Professional for Summer, SMS, and more capacity; choose Business for multi-location scale and API; talk Enterprise for custom commercial setup. Plan changes during Private Alpha are arranged with Chasum.",
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
      "Private Alpha is invite-based. Partners receive founding pricing and guided setup. Apply at /apply. Online self-serve billing isn’t open yet. Selecting a plan on /pricing is acquisition intent only—it does not create an account or subscription.",
    tags: ["alpha", "founding", "apply", "invite"],
    followUps: ["Who is a good fit?", "Would you like a product tour first?"],
    relatedIds: ["company-story", "tour-intro"],
  },
];
