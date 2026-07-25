/**
 * Shared marketing pricing copy for landing, /pricing, signup, and upgrade prompts.
 * During Private Alpha, paid CTAs route to the design partner application — not mock checkout.
 */

import {
  APPLY_HREF,
  CONTACT_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  CTA_DISCUSS_SETUP_LABEL,
  DEMO_HREF,
  FOUNDER_PRICING_NOTE,
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

export const PRICING_EYEBROW = "Private Alpha pricing";

export const PRICING_HEADLINE =
  "Founding pricing, with the product status made clear.";

export const PRICING_SUBHEADING =
  "We are onboarding a limited number of design partners before public self-serve billing launches. Apply to discuss the right setup, current capabilities and founding pricing for your business.";

/** Concise pricing note — same source as FOUNDER_PRICING_NOTE. */
export const PRICING_NOTE = FOUNDER_PRICING_NOTE;

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
    cta: CTA_APPLY_LABEL,
    href: APPLY_HREF,
    price: "$0",
    highlighted: false,
    features: [
      "1 booking page · Available Today",
      "Core calendar & reception · Available Today",
      "Email reminders · when messaging is configured",
      "Single location · Available Today",
    ],
  },
  {
    id: "professional",
    planKey: "professional",
    title: "Professional",
    tagline: "Grow your business.",
    description:
      "Scheduling, Early Access AI assistance, and operations tools for professionals.",
    cta: CTA_APPLY_LABEL,
    href: APPLY_HREF,
    price: "$79",
    priceSuffix: "/month",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Unlimited appointments · Available Today",
      "Summer & Chase · Early Access",
      "SMS reminders · Early Access · when enabled",
      "Waitlist · Available Today",
      "Up to 3 locations · Available Today",
      "Priority design-partner support",
    ],
  },
  {
    id: "business",
    planKey: "business",
    title: "Business",
    tagline: "Scale with confidence.",
    description:
      "Multi-location management with roadmap items labelled honestly for Private Alpha.",
    cta: CTA_DISCUSS_SETUP_LABEL,
    href: CONTACT_HREF,
    price: "$149",
    priceSuffix: "/month",
    highlighted: false,
    features: [
      "Everything in Professional",
      "Up to 10 locations · Available Today",
      "Team invitations & staff login · Coming Next",
      "API & webhooks · Available when enabled",
      "Advanced automation · Coming Next",
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
    cta: CTA_DEMO_LABEL,
    href: DEMO_HREF,
    price: "Custom",
    highlighted: false,
    features: [
      "Location needs confirmed in writing",
      "Custom onboarding",
      "Security review",
      "Dedicated support options",
      "Tailored solutions",
      "SLA options · Coming Next · written agreement",
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
