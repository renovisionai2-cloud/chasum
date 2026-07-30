/**
 * Shared marketing pricing copy for landing, /pricing, signup, and upgrade prompts.
 * During Private Alpha, paid CTAs route to the design partner application — not mock checkout.
 *
 * Small-business first: approachable, transparent, easy to understand.
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
  "Plans that fit where you are—and grow when you do.";

export const PRICING_SUBHEADING =
  "One connected platform for growing service businesses. Start with what you need today—then grow into more capacity without changing systems.";

/** Concise Private Alpha context — hero only. */
export const PRICING_NOTE = FOUNDER_PRICING_NOTE;

/** Premium OS storytelling — between plan cards and comparison table. */
export const PRICING_PLATFORM_EYEBROW = "One connected platform";

export const PRICING_PLATFORM_HEADLINE_LINE_1 = "One platform.";

export const PRICING_PLATFORM_HEADLINE_LINE_2 = "Every part of your business.";

export const PRICING_PLATFORM_BODY =
  "Every Chasum plan runs on the same connected platform. Start with the tools your business needs today, then unlock more capacity, communication, and AI help as you grow.";

export const PRICING_PLATFORM_FOOTNOTE =
  "Everything works together, so your business doesn’t have to rely on disconnected software.";

export const PRICING_FOUNDER_EYEBROW = "Founder's promise";

export const PRICING_FOUNDER_HEADLINE = "Built with real service businesses.";

export const PRICING_FOUNDER_BODY =
  "We're starting with a limited number of partners—not rushing to open the doors to everyone. You'll get guided setup, direct help from our team, and a say in what we build next.";

export const PRICING_CTA_EYEBROW = "Next step";

export const PRICING_CTA_HEADLINE = "Ready when you are.";

export const PRICING_CTA_BODY =
  "Apply for Private Alpha to find the right plan, or schedule a demo to see how Chasum fits your day.";

export const PRICING_COMPARE_HEADLINE = "Compare plans at a glance.";

export const PRICING_COMPARE_LEDE =
  "A simple side-by-side view of what each plan includes.";

/** Shown when a Free / starter plan limit is reached. */
export const FREE_PLAN_LIMIT_MESSAGE =
  "Your current plan has reached its location limit. Upgrade to Professional to add more sites.";

export const FREE_PLAN_UPGRADE_CTA = "Upgrade to Professional";

/**
 * Launch-ready plan inclusions only (Product Truth Matrix).
 * Removed from Pricing (see Roadmap): team invitations & staff login,
 * advanced automation, SLA options — not launch-ready for plan inclusion.
 */
export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "free",
    planKey: "starter",
    title: "Free",
    audience: "For trying Chasum with a real booking workflow.",
    tagline: "Start simple.",
    description: "Online booking and a calendar—so you can see if Chasum fits.",
    cta: CTA_APPLY_LABEL,
    href: APPLY_HREF,
    price: "$0",
    highlighted: false,
    groups: [
      {
        label: "Included",
        items: [
          "Online booking page",
          "Calendar",
          "Email reminders",
          "1 location",
        ],
      },
    ],
  },
  {
    id: "professional",
    planKey: "professional",
    title: "Professional",
    audience: "For busy shops that want fewer missed appointments.",
    tagline: "Grow with confidence.",
    description:
      "More capacity, text reminders, and AI help—priced for growing teams.",
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
        items: ["Email & text reminders"],
      },
      {
        label: "AI help",
        items: ["Summer & Chase"],
      },
      {
        label: "Growth",
        items: ["Up to 3 locations", "Priority support"],
      },
    ],
  },
  {
    id: "business",
    planKey: "business",
    title: "Business",
    audience: "For businesses running more than one location.",
    tagline: "Room to expand.",
    description:
      "Everything in Professional, with more locations and connections to the tools you already use.",
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
        items: ["Up to 10 locations", "Connect other tools"],
      },
    ],
  },
  {
    id: "enterprise",
    planKey: "enterprise",
    title: "Enterprise",
    audience: "For larger operators who need a custom setup.",
    tagline: "Grow with us.",
    description:
      "Onboarding and support shaped around how your organization works.",
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
          "Hands-on onboarding",
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
        name: "Online booking page",
        free: true,
        professional: true,
        business: true,
        enterprise: true,
      },
      {
        name: "Calendar",
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
        name: "Email reminders",
        free: true,
        professional: true,
        business: true,
        enterprise: true,
      },
      {
        name: "Text reminders",
        free: false,
        professional: true,
        business: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "AI help",
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
        name: "Connect other tools",
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
        name: "Hands-on onboarding",
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
