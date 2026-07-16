/**
 * Shared marketing pricing copy for landing, /pricing, signup, and upgrade prompts.
 * Plan keys align with `subscription_plans.plan_key` (Free maps to `starter`).
 */

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

export const PRICING_HEADLINE = "Simple pricing that grows with your business.";

export const PRICING_SUBHEADING =
  "Start free. Upgrade only when you're ready. No hidden fees. No appointment commissions.";

/** Shown when a Free / starter plan limit is reached. */
export const FREE_PLAN_LIMIT_MESSAGE =
  "Congratulations! Your business has grown to the point where Professional will save you even more time.";

export const FREE_PLAN_UPGRADE_CTA = "Upgrade to Professional";

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "free",
    planKey: "starter",
    title: "Free",
    tagline: "Start your journey.",
    description: "Everything you need to experience Chasum.",
    cta: "Start Free",
    href: "/signup?plan=free",
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
      "Powerful scheduling, AI assistance, and automation for professionals.",
    cta: "Start Professional",
    href: "/signup?plan=professional",
    price: "$79",
    priceSuffix: "/month",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Unlimited appointments",
      "AI scheduling assistance",
      "SMS reminders",
      "Automation & waitlist",
      "Up to 3 locations",
      "Priority support",
    ],
  },
  {
    id: "business",
    planKey: "business",
    title: "Business",
    tagline: "Scale with confidence.",
    description:
      "Multi-location management, advanced automation, and collaboration for growing teams.",
    cta: "Start Business",
    href: "/signup?plan=business",
    price: "$149",
    priceSuffix: "/month",
    highlighted: false,
    features: [
      "Everything in Professional",
      "Up to 10 locations",
      "Team collaboration",
      "API & webhooks",
      "Advanced automation",
      "Dedicated support",
    ],
  },
  {
    id: "enterprise",
    planKey: "enterprise",
    title: "Enterprise",
    tagline: "Built for large organizations.",
    description:
      "Custom onboarding, advanced security, dedicated support, and tailored solutions.",
    cta: "Contact Sales",
    href: "mailto:sales@chasum.app?subject=Chasum%20Enterprise",
    price: "Custom",
    highlighted: false,
    features: [
      "Unlimited locations",
      "Custom onboarding",
      "Advanced security",
      "Dedicated support",
      "Tailored solutions",
      "SLA options",
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
