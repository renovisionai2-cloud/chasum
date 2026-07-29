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

/** Concise pricing note — same source as FOUNDER_PRICING_NOTE. */
export const PRICING_NOTE = FOUNDER_PRICING_NOTE;

export const PRICING_FOUNDER_EYEBROW = "Founder's promise";

export const PRICING_FOUNDER_HEADLINE = "Built for long-term partnerships.";

export const PRICING_FOUNDER_BODY =
  "We're intentionally growing with a limited number of service businesses before opening public self-serve access. During Private Alpha you'll receive guided onboarding, direct access to our team and the opportunity to influence how Chasum evolves.";

export const PRICING_CTA_EYEBROW = "Next step";

export const PRICING_CTA_HEADLINE = "Ready when you are.";

export const PRICING_CTA_BODY =
  "Apply for Private Alpha to discuss the right plan for your business, or schedule a demo to see how Chasum fits your day.";

/** Shown when a Free / starter plan limit is reached. */
export const FREE_PLAN_LIMIT_MESSAGE =
  "Your current plan has reached its location limit. Upgrade to Professional to add more sites.";

export const FREE_PLAN_UPGRADE_CTA = "Upgrade to Professional";

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "free",
    planKey: "starter",
    title: "Free",
    audience: "For businesses exploring Chasum.",
    tagline: "Start with the core.",
    description:
      "The AI Business Operating System foundations—scheduling and reception—so you can evaluate Chasum with a real workflow.",
    cta: CTA_APPLY_LABEL,
    href: APPLY_HREF,
    price: "$0",
    highlighted: false,
    groups: [
      {
        label: "Scheduling",
        items: [
          "Booking Page · Available Today",
          "Core Calendar & Reception · Available Today",
        ],
      },
      {
        label: "Communication",
        items: ["Email Reminders · Available Today"],
      },
      {
        label: "Growth",
        items: ["Single location · Available Today"],
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
      "More scale, Early Access AI assistance and stronger communication—still on one connected operating system.",
    cta: CTA_APPLY_LABEL,
    href: APPLY_HREF,
    price: "$79",
    priceSuffix: "/month",
    badge: "Most Popular",
    highlighted: true,
    groups: [
      {
        label: "Scheduling",
        items: [
          "Unlimited appointments · Available Today",
          "Waitlist · Available Today",
        ],
      },
      {
        label: "Communication",
        items: [
          "Email Reminders · Available Today",
          "SMS Reminders · Early Access",
        ],
      },
      {
        label: "AI",
        items: ["Summer & Chase · Early Access"],
      },
      {
        label: "Growth",
        items: [
          "Up to 3 locations · Available Today",
          "Priority design-partner support · Discuss During Onboarding",
        ],
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
      "Multi-location operations with room to grow—collaboration and automation expand as Chasum does.",
    cta: CTA_DISCUSS_SETUP_LABEL,
    href: CONTACT_HREF,
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
        items: [
          "Up to 10 locations · Available Today",
          "API & Webhooks · Available Today",
        ],
      },
      {
        label: "Operations",
        items: [
          "Team invitations & staff login · Coming Next",
          "Advanced automation · Coming Next",
        ],
      },
      {
        label: "Support",
        items: ["Founder-backed support · Discuss During Onboarding"],
      },
    ],
  },
  {
    id: "enterprise",
    planKey: "enterprise",
    title: "Enterprise",
    audience:
      "For organizations requiring advanced AI, custom workflows and enterprise support.",
    tagline: "Partner with us.",
    description:
      "Custom onboarding, security conversations and dedicated support for larger operators.",
    cta: CTA_DEMO_LABEL,
    href: DEMO_HREF,
    price: "Custom",
    highlighted: false,
    groups: [
      {
        label: "Enterprise",
        items: [
          "Location needs · Discuss During Onboarding",
          "Custom onboarding · Discuss During Onboarding",
          "Security review · Discuss During Onboarding",
          "Dedicated support options · Discuss During Onboarding",
          "SLA options · Coming Next",
        ],
      },
    ],
  },
];

/** Comparison table sections — improve hierarchy without removing honesty labels. */
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
        name: "SMS Reminders · Early Access",
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
        name: "Summer & Chase · Early Access",
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
        enterprise: "Discuss",
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
    title: "Operations",
    rows: [
      {
        name: "Team invitations / staff login",
        free: "Coming Next",
        professional: "Coming Next",
        business: "Coming Next",
        enterprise: "Coming Next",
      },
    ],
  },
  {
    title: "Enterprise",
    rows: [
      {
        name: "Custom onboarding / SLA",
        free: false,
        professional: false,
        business: false,
        enterprise: "Discuss",
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
