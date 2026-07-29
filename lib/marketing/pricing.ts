/**
 * Shared marketing pricing copy for landing, /pricing, signup, and upgrade prompts.
 * During Private Alpha, paid CTAs route to the design partner application — not mock checkout.
 *
 * Pricing lists only capabilities customers receive in-plan.
 * Roadmap owns upcoming / future capabilities — keep those off this page.
 */

import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  DEMO_HREF,
  FOUNDER_PRICING_NOTE,
} from "@/lib/marketing/alpha";

export type MarketingPlanId = "free" | "professional" | "business" | "enterprise";

export type MarketingCapabilityGroup = {
  label: string;
  items: string[];
};

export type MarketingPlan = {
  id: MarketingPlanId;
  /** Database `subscription_plans.plan_key` */
  planKey: "starter" | "professional" | "business" | "enterprise";
  title: string;
  /** Who this plan is designed for — one clear sentence. */
  audience: string;
  tagline: string;
  description: string;
  cta: string;
  href: string;
  price: string;
  priceSuffix?: string;
  badge?: string;
  highlighted: boolean;
  /** Grouped capabilities for scanability. */
  groups: MarketingCapabilityGroup[];
};

export const PRICING_EYEBROW = "Private Alpha";

export const PRICING_HEADLINE =
  "Choose the right stage of growth for your business.";

export const PRICING_SUBHEADING =
  "Every Chasum plan includes the AI Business Operating System. As your business grows, your plan unlocks more scale, collaboration, automation and intelligence—without changing platforms.";

/** Concise Private Alpha context — hero only. */
export const PRICING_NOTE = FOUNDER_PRICING_NOTE;

export const PRICING_FOUNDER_EYEBROW = "Founder's promise";

export const PRICING_FOUNDER_HEADLINE = "Built for long-term partnerships.";

export const PRICING_FOUNDER_BODY =
  "We're intentionally growing with a limited number of service businesses before opening public self-serve access. During Private Alpha you'll receive guided onboarding, direct access to our team and the opportunity to influence how Chasum evolves.";

export const PRICING_CTA_EYEBROW = "Next step";

export const PRICING_CTA_HEADLINE = "Ready when you are.";

export const PRICING_CTA_BODY =
  "Apply for Private Alpha to discuss the right plan for your business, or schedule a demo to see how Chasum fits your day.";

export const PRICING_COMPARE_HEADLINE = "Compare plans at a glance.";

export const PRICING_COMPARE_LEDE =
  "See what each plan includes—so choosing the right stage of growth stays simple.";

/** Shown when a Free / starter plan limit is reached. */
export const FREE_PLAN_LIMIT_MESSAGE =
  "Your current plan has reached its location limit. Upgrade to Professional to add more sites.";

export const FREE_PLAN_UPGRADE_CTA = "Upgrade to Professional";

/**
 * Launch-ready plan inclusions only (Product Truth Matrix).
 * Removed from Pricing (Roadmap / Coming Next): team invitations & staff login,
 * advanced automation, SLA options.
 */
export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "free",
    planKey: "starter",
    title: "Free",
    audience: "For businesses exploring Chasum.",
    tagline: "Start with the core.",
    description:
      "Core scheduling and reception so you can evaluate Chasum with a real workflow.",
    cta: CTA_APPLY_LABEL,
    href: APPLY_HREF,
    price: "$0",
    highlighted: false,
    groups: [
      {
        label: "Scheduling",
        items: ["Booking Page", "Core Calendar & Reception"],
      },
      {
        label: "Communication",
        items: ["Email Reminders"],
      },
      {
        label: "Growth",
        items: ["1 location"],
      },
    ],
  },
  {
    id: "professional",
    planKey: "professional",
    title: "Professional",
    audience:
      "For growing businesses ready to save time and improve customer communication.",
    tagline: "Grow with confidence.",
    description:
      "More capacity, stronger communication and AI assistance—on one connected operating system.",
    cta: CTA_APPLY_LABEL,
    href: APPLY_HREF,
    price: "$79",
    priceSuffix: "/month",
    badge: "Most Popular",
    highlighted: true,
    groups: [
      {
        label: "Scheduling",
        items: ["Unlimited appointments", "Waitlist"],
      },
      {
        label: "Communication",
        items: ["Email Reminders", "SMS Reminders"],
      },
      {
        label: "AI",
        items: ["Summer & Chase"],
      },
      {
        label: "Growth",
        items: ["Up to 3 locations", "Priority Support"],
      },
    ],
  },
  {
    id: "business",
    planKey: "business",
    title: "Business",
    audience:
      "For established businesses managing multiple staff and locations.",
    tagline: "Operate at scale.",
    description:
      "Multi-location operations with developer access when your team is ready to connect systems.",
    cta: CTA_DEMO_LABEL,
    href: DEMO_HREF,
    price: "$149",
    priceSuffix: "/month",
    highlighted: false,
    groups: [
      {
        label: "Includes",
        items: ["Everything in Professional"],
      },
      {
        label: "Growth",
        items: ["Up to 10 locations", "API & Webhooks"],
      },
      {
        label: "Support",
        items: ["Priority Support"],
      },
    ],
  },
  {
    id: "enterprise",
    planKey: "enterprise",
    title: "Enterprise",
    audience:
      "For organizations requiring custom onboarding, advanced support and tailored operational requirements.",
    tagline: "Partner with us.",
    description:
      "Guided partnership for larger operators—with onboarding and support shaped around how you work.",
    cta: CTA_DEMO_LABEL,
    href: DEMO_HREF,
    price: "Custom",
    highlighted: false,
    groups: [
      {
        label: "Includes",
        items: ["Everything in Business"],
      },
      {
        label: "Enterprise",
        items: [
          "Custom locations",
          "Custom onboarding",
          "Security review",
          "Dedicated support",
        ],
      },
    ],
  },
];

/** Comparison table — included vs not included; no status labels in cells. */
export const PRICING_COMPARISON_SECTIONS = [
  {
    title: "Scheduling",
    rows: [
      {
        name: "Booking Page",
        free: true,
        professional: true,
        business: true,
        enterprise: true,
      },
      {
        name: "Core Calendar & Reception",
        free: true,
        professional: true,
        business: true,
        enterprise: true,
      },
      {
        name: "Unlimited appointments",
        free: false,
        professional: true,
        business: true,
        enterprise: true,
      },
      {
        name: "Waitlist",
        free: false,
        professional: true,
        business: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Communication",
    rows: [
      {
        name: "Email Reminders",
        free: true,
        professional: true,
        business: true,
        enterprise: true,
      },
      {
        name: "SMS Reminders",
        free: false,
        professional: true,
        business: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "AI",
    rows: [
      {
        name: "Summer & Chase",
        free: false,
        professional: true,
        business: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Growth",
    rows: [
      {
        name: "Locations",
        free: "1",
        professional: "Up to 3",
        business: "Up to 10",
        enterprise: "Custom",
      },
      {
        name: "API & Webhooks",
        free: false,
        professional: false,
        business: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Enterprise",
    rows: [
      {
        name: "Custom onboarding",
        free: false,
        professional: false,
        business: false,
        enterprise: true,
      },
      {
        name: "Dedicated support",
        free: false,
        professional: false,
        business: false,
        enterprise: true,
      },
    ],
  },
] as const;

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
