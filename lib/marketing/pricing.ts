/**
 * Shared marketing pricing copy for landing, /pricing, signup, and upgrade prompts.
 * During Private Alpha, paid CTAs route to the design partner application — not mock checkout.
 */

import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_EARLY_ACCESS_LABEL,
  DEMO_HREF,
} from "@/lib/marketing/alpha";

export type MarketingPlanId = "free" | "professional" | "business" | "enterprise";

export type MarketingPlan = {
  id: MarketingPlanId;
  /** Database `subscription_plans.plan_key` */
  planKey: "starter" | "professional" | "business" | "enterprise";
  title: string;
  tagline: string;
  description: string;
  cta: string;
  href: string;
  price: string;
  priceSuffix?: string;
  badge?: string;
  highlighted: boolean;
  features: string[];
};

export const PRICING_HEADLINE = "Founding pricing for design partners.";

export const PRICING_SUBHEADING =
  "Private Alpha is invite-based. Public self-serve checkout launches after we earn it — apply to lock founding customer pricing.";

/** Shown when a Free / starter plan limit is reached. */
export const FREE_PLAN_LIMIT_MESSAGE =
  "Your current plan has reached its location limit. Upgrade to Professional to add more sites.";

export const FREE_PLAN_UPGRADE_CTA = "Upgrade to Professional";

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "free",
    planKey: "starter",
    title: "Free",
    tagline: "Explore the core.",
    description: "Core scheduling for design partners evaluating Chasum.",
    cta: CTA_EARLY_ACCESS_LABEL,
    href: APPLY_HREF,
    price: "$0",
    highlighted: false,
    features: [
      "1 booking page",
      "Core calendar & reception",
      "Email reminders",
      "Single location",
    ],
  },
  {
    id: "professional",
    planKey: "professional",
    title: "Professional",
    tagline: "Grow your business.",
    description:
      "Powerful scheduling, Early Access AI assistance, and automation for professionals.",
    cta: CTA_APPLY_LABEL,
    href: APPLY_HREF,
    price: "$79",
    priceSuffix: "/month",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Unlimited appointments",
      "Summer & Chase (Early Access)",
      "SMS reminders (when enabled)",
      "Automation & waitlist",
      "Up to 3 locations",
      "Priority design-partner support",
    ],
  },
  {
    id: "business",
    planKey: "business",
    title: "Business",
    tagline: "Scale with confidence.",
    description:
      "Multi-location management and collaboration — staff invites coming next on the roadmap.",
    cta: CTA_APPLY_LABEL,
    href: APPLY_HREF,
    price: "$149",
    priceSuffix: "/month",
    highlighted: false,
    features: [
      "Everything in Professional",
      "Up to 10 locations",
      "Team collaboration (roadmap)",
      "API & webhooks",
      "Advanced automation",
      "Founder-backed support in alpha",
    ],
  },
  {
    id: "enterprise",
    planKey: "enterprise",
    title: "Enterprise",
    tagline: "Built for large organizations.",
    description:
      "Custom onboarding and security conversations for larger operators.",
    cta: "Contact Sales",
    href: DEMO_HREF,
    price: "Custom",
    highlighted: false,
    features: [
      "Unlimited locations",
      "Custom onboarding",
      "Security review",
      "Dedicated support options",
      "Tailored solutions",
      "SLA options (post-alpha)",
    ],
  },
];

export function getMarketingPlan(id: string | null | undefined): MarketingPlan {
  const match = MARKETING_PLANS.find((plan) => plan.id === id);
  return match ?? MARKETING_PLANS[0]!;
}

export function marketingPlanIdToDbKey(
  id: string | null | undefined,
): MarketingPlan["planKey"] {
  return getMarketingPlan(id).planKey;
}

export function isMarketingPlanId(value: string): value is MarketingPlanId {
  return MARKETING_PLANS.some((plan) => plan.id === value);
}

/** Resolve signup `?plan=` for server or client — pure, shared utility. */
export function resolveInitialPlan(
  planParam: string | string[] | undefined,
): MarketingPlanId {
  const raw = Array.isArray(planParam) ? planParam[0] : planParam;
  if (raw && isMarketingPlanId(raw)) return raw;
  return "free";
}
