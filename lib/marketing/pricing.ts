/**
 * Canonical Pricing configuration — cards, comparison, and billing toggle
 * share this single source of truth.
 *
 * Private Alpha: paid CTAs route to apply / demo — not public self-serve checkout.
 * Product Truth: market only capabilities verified in docs/marketing/PRODUCT_TRUTH_MATRIX.md
 * (or clearly framed as Private Alpha partnership services for Enterprise).
 */

import {
  marketingLocationLimitLabel,
  marketingStaffLimitLabel,
} from "@/lib/billing/plan-entitlements";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  DEMO_HREF,
  FOUNDER_PRICING_NOTE,
  PRIVATE_ALPHA_HREF,
} from "@/lib/marketing/alpha";

export type MarketingPlanId =
  | "free"
  | "professional"
  | "business"
  | "enterprise";

export type BillingPeriod = "monthly" | "yearly";

export type PricingFeatureId =
  | "online_booking"
  | "calendar"
  | "email_reminders"
  | "customer_management"
  | "chasum_branding"
  | "invoicing"
  | "sms_reminders"
  | "business_messaging"
  | "summer"
  | "payments"
  | "gift_cards"
  | "basic_reporting"
  | "remove_branding"
  | "advanced_analytics"
  | "api_integrations"
  | "priority_support"
  | "inventory"
  | "white_glove"
  | "success_manager"
  | "custom_integrations"
  | "enterprise_security"
  | "custom_permissions"
  | "volume_pricing"
  | "staff_limit"
  | "location_limit";

export type FeatureValue = boolean | string;

export type PricingFeatureDef = {
  id: PricingFeatureId;
  name: string;
  category:
    | "Scheduling"
    | "Communication"
    | "Customers"
    | "Payments"
    | "Team & Locations"
    | "Reporting & Operations"
    | "Support & Enterprise";
  /** Optional clarification shown in comparison / cards */
  note?: string;
};

export const PRICING_FEATURE_CATALOG: PricingFeatureDef[] = [
  { id: "online_booking", name: "Online Booking", category: "Scheduling" },
  { id: "calendar", name: "Calendar", category: "Scheduling" },
  {
    id: "email_reminders",
    name: "Email Confirmations & Reminders",
    category: "Communication",
  },
  {
    id: "sms_reminders",
    name: "SMS Reminders",
    category: "Communication",
  },
  {
    id: "business_messaging",
    name: "Business Calls & Texting",
    category: "Communication",
    note: "Communication Center for SMS and call activity on paid plans. Voice AI calling is not available yet.",
  },
  {
    id: "customer_management",
    name: "Basic Customer Management",
    category: "Customers",
  },
  {
    id: "summer",
    name: "Summer — AI Business Manager",
    category: "Communication",
  },
  { id: "payments", name: "Online Payments", category: "Payments" },
  { id: "gift_cards", name: "Gift Cards", category: "Payments" },
  { id: "invoicing", name: "Invoicing", category: "Payments" },
  {
    id: "staff_limit",
    name: "Staff Members",
    category: "Team & Locations",
  },
  {
    id: "location_limit",
    name: "Locations",
    category: "Team & Locations",
  },
  {
    id: "chasum_branding",
    name: "Chasum Branding",
    category: "Team & Locations",
  },
  {
    id: "remove_branding",
    name: "Remove Chasum Branding",
    category: "Team & Locations",
  },
  {
    id: "basic_reporting",
    name: "Basic Reporting",
    category: "Reporting & Operations",
  },
  {
    id: "advanced_analytics",
    name: "Advanced Analytics",
    category: "Reporting & Operations",
  },
  {
    id: "inventory",
    name: "Inventory Management",
    category: "Reporting & Operations",
    note: "Coming soon.",
  },
  {
    id: "api_integrations",
    name: "API & Integrations",
    category: "Reporting & Operations",
  },
  {
    id: "priority_support",
    name: "Priority Support",
    category: "Support & Enterprise",
  },
  {
    id: "white_glove",
    name: "White-Glove Onboarding",
    category: "Support & Enterprise",
  },
  {
    id: "success_manager",
    name: "Dedicated Success Manager",
    category: "Support & Enterprise",
  },
  {
    id: "custom_integrations",
    name: "Custom Integrations",
    category: "Support & Enterprise",
  },
  {
    id: "enterprise_security",
    name: "Enterprise Security",
    category: "Support & Enterprise",
  },
  {
    id: "custom_permissions",
    name: "Custom Permissions",
    category: "Support & Enterprise",
  },
  {
    id: "volume_pricing",
    name: "Volume Pricing",
    category: "Support & Enterprise",
  },
];

export type PricingPlanConfig = {
  id: MarketingPlanId;
  planKey: "starter" | "professional" | "business" | "enterprise";
  name: string;
  bestFor: string;
  /** Display price string for monthly billing */
  monthlyPrice: string;
  /** Monthly-equivalent when billed yearly (20% savings), or null for custom */
  yearlyPrice: string | null;
  priceSuffix?: string;
  billingLabel?: string;
  badge?: string;
  highlighted: boolean;
  ctaLabel: string;
  ctaHref: string;
  inheritedPlan?: MarketingPlanId;
  /** Ordered feature ids shown as included on the card */
  cardFeatures: PricingFeatureId[];
  /** Explicitly called out as not included (Free card) */
  unavailableFeatures?: PricingFeatureId[];
  /** Emphasize this feature id on the card (e.g. Summer) */
  spotlightFeatureId?: PricingFeatureId;
  /** Values for comparison table cells */
  features: Partial<Record<PricingFeatureId, FeatureValue>>;
  contactSales?: boolean;
};

/**
 * Yearly = 20% off monthly list (shown as monthly equivalent).
 * Professional $79 → $63 · Business $149 → $119
 */
export const PRICING_PLANS: PricingPlanConfig[] = [
  {
    id: "free",
    planKey: "starter",
    name: "Free",
    bestFor: "Solo businesses getting started.",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    ctaLabel: "Start Free",
    ctaHref: APPLY_HREF,
    highlighted: false,
    cardFeatures: [
      "online_booking",
      "calendar",
      "email_reminders",
      "customer_management",
      "staff_limit",
      "location_limit",
      "chasum_branding",
    ],
    unavailableFeatures: ["invoicing", "sms_reminders", "business_messaging"],
    features: {
      online_booking: true,
      calendar: true,
      email_reminders: true,
      customer_management: true,
      chasum_branding: true,
      invoicing: false,
      sms_reminders: false,
      business_messaging: false,
      summer: false,
      payments: false,
      gift_cards: false,
      basic_reporting: false,
      remove_branding: false,
      advanced_analytics: false,
      api_integrations: false,
      priority_support: false,
      inventory: false,
      white_glove: false,
      success_manager: false,
      custom_integrations: false,
      enterprise_security: false,
      custom_permissions: false,
      volume_pricing: false,
      staff_limit: marketingStaffLimitLabel("starter"),
      location_limit: marketingLocationLimitLabel("starter"),
    },
  },
  {
    id: "professional",
    planKey: "professional",
    name: "Professional",
    bestFor:
      "Growing businesses that want automation and better customer communication.",
    monthlyPrice: "$79",
    yearlyPrice: "$63",
    priceSuffix: "/month",
    badge: "Most Popular",
    highlighted: true,
    ctaLabel: "Start Professional",
    ctaHref: APPLY_HREF,
    inheritedPlan: "free",
    spotlightFeatureId: "summer",
    cardFeatures: [
      "summer",
      "sms_reminders",
      "business_messaging",
      "payments",
      "gift_cards",
      "staff_limit",
      "location_limit",
      "basic_reporting",
      "remove_branding",
    ],
    features: {
      online_booking: true,
      calendar: true,
      email_reminders: true,
      customer_management: true,
      chasum_branding: false,
      invoicing: true,
      sms_reminders: true,
      business_messaging: true,
      summer: true,
      payments: true,
      gift_cards: true,
      basic_reporting: true,
      remove_branding: true,
      advanced_analytics: false,
      api_integrations: false,
      priority_support: false,
      inventory: false,
      white_glove: false,
      success_manager: false,
      custom_integrations: false,
      enterprise_security: false,
      custom_permissions: false,
      volume_pricing: false,
      staff_limit: marketingStaffLimitLabel("professional"),
      location_limit: marketingLocationLimitLabel("professional"),
    },
  },
  {
    id: "business",
    planKey: "business",
    name: "Business",
    bestFor: "Multi-staff businesses managing multiple locations.",
    monthlyPrice: "$149",
    yearlyPrice: "$119",
    priceSuffix: "/month",
    highlighted: false,
    ctaLabel: "Choose Business",
    ctaHref: APPLY_HREF,
    inheritedPlan: "professional",
    cardFeatures: [
      "staff_limit",
      "location_limit",
      "advanced_analytics",
      "api_integrations",
      "priority_support",
      "inventory",
    ],
    features: {
      online_booking: true,
      calendar: true,
      email_reminders: true,
      customer_management: true,
      chasum_branding: false,
      invoicing: true,
      sms_reminders: true,
      business_messaging: true,
      summer: true,
      payments: true,
      gift_cards: true,
      basic_reporting: true,
      remove_branding: true,
      advanced_analytics: true,
      api_integrations: true,
      priority_support: true,
      inventory: "Coming soon",
      white_glove: false,
      success_manager: false,
      custom_integrations: false,
      enterprise_security: false,
      custom_permissions: false,
      volume_pricing: false,
      staff_limit: marketingStaffLimitLabel("business"),
      location_limit: marketingLocationLimitLabel("business"),
    },
  },
  {
    id: "enterprise",
    planKey: "enterprise",
    name: "Enterprise",
    bestFor:
      "Franchises, chains, and organizations with custom requirements.",
    monthlyPrice: "Custom",
    yearlyPrice: null,
    highlighted: false,
    ctaLabel: "Contact Sales",
    ctaHref: DEMO_HREF,
    inheritedPlan: "business",
    contactSales: true,
    cardFeatures: [
      "location_limit",
      "white_glove",
      "success_manager",
      "custom_integrations",
      "priority_support",
      "enterprise_security",
      "custom_permissions",
      "volume_pricing",
    ],
    features: {
      online_booking: true,
      calendar: true,
      email_reminders: true,
      customer_management: true,
      chasum_branding: false,
      invoicing: true,
      sms_reminders: true,
      business_messaging: true,
      summer: true,
      payments: true,
      gift_cards: true,
      basic_reporting: true,
      remove_branding: true,
      advanced_analytics: true,
      api_integrations: true,
      priority_support: true,
      inventory: "Coming soon",
      white_glove: true,
      success_manager: true,
      custom_integrations: true,
      enterprise_security: true,
      custom_permissions: true,
      volume_pricing: true,
      staff_limit: marketingStaffLimitLabel("enterprise"),
      location_limit: marketingLocationLimitLabel("enterprise"),
    },
  },
];

/** @deprecated Prefer PRICING_PLANS — kept for signup / owner / onboarding adapters */
export type MarketingCapabilityGroup = {
  label: string;
  items: string[];
};

export type MarketingPlan = {
  id: MarketingPlanId;
  planKey: PricingPlanConfig["planKey"];
  title: string;
  audience: string;
  tagline: string;
  description: string;
  cta: string;
  href: string;
  price: string;
  priceSuffix?: string;
  badge?: string;
  highlighted: boolean;
  groups: MarketingCapabilityGroup[];
};

function featureName(id: PricingFeatureId): string {
  const def = PRICING_FEATURE_CATALOG.find((f) => f.id === id);
  return def?.name ?? id;
}

function formatCardFeature(
  plan: PricingPlanConfig,
  id: PricingFeatureId,
): string {
  const value = plan.features[id];
  const name = featureName(id);
  if (id === "staff_limit" && typeof value === "string") {
    return value === "1" ? "1 Active Staff Member" : `${value} Active Staff Members`;
  }
  if (id === "location_limit" && typeof value === "string") {
    return value === "1" ? "1 Location" : `${value} Locations`;
  }
  if (id === "inventory") {
    return `${name} · Coming soon`;
  }
  if (id === "priority_support" && plan.id === "enterprise") {
    return "SLA & Priority Support";
  }
  return name;
}

/** Adapter used by signup, owner console, and legacy PlanCards consumers */
export const MARKETING_PLANS: MarketingPlan[] = PRICING_PLANS.map((plan) => {
  const inherited = plan.inheritedPlan
    ? PRICING_PLANS.find((p) => p.id === plan.inheritedPlan)
    : null;
  const groups: MarketingCapabilityGroup[] = [];
  if (inherited) {
    groups.push({
      label: "Includes",
      items: [`Everything in ${inherited.name}`],
    });
  }
  groups.push({
    label: inherited ? "Also included" : "Included",
    items: plan.cardFeatures.map((id) => formatCardFeature(plan, id)),
  });
  return {
    id: plan.id,
    planKey: plan.planKey,
    title: plan.name,
    audience: plan.bestFor,
    tagline: plan.bestFor,
    description: plan.bestFor,
    cta: plan.ctaLabel,
    href: plan.ctaHref,
    price: plan.monthlyPrice,
    priceSuffix: plan.priceSuffix,
    badge: plan.badge,
    highlighted: plan.highlighted,
    groups,
  };
});

export type ComparisonRow = {
  id: PricingFeatureId;
  name: string;
  note?: string;
  free: FeatureValue;
  professional: FeatureValue;
  business: FeatureValue;
  enterprise: FeatureValue;
};

export type ComparisonSection = {
  title: string;
  rows: ComparisonRow[];
};

export function buildPricingComparisonSections(): ComparisonSection[] {
  const categories = [
    "Scheduling",
    "Communication",
    "Customers",
    "Payments",
    "Team & Locations",
    "Reporting & Operations",
    "Support & Enterprise",
  ] as const;

  const byId = Object.fromEntries(
    PRICING_PLANS.map((p) => [p.id, p]),
  ) as Record<MarketingPlanId, PricingPlanConfig>;

  return categories
    .map((title) => {
      const rows = PRICING_FEATURE_CATALOG.filter((f) => f.category === title).map(
        (f) => ({
          id: f.id,
          name:
            f.id === "priority_support" ? "Priority Support / SLA" : f.name,
          note:
            f.id === "inventory"
              ? "Coming soon."
              : f.id === "business_messaging"
                ? "Paid plans · Communication Center"
                : undefined,
          free: byId.free.features[f.id] ?? false,
          professional: byId.professional.features[f.id] ?? false,
          business: byId.business.features[f.id] ?? false,
          enterprise: byId.enterprise.features[f.id] ?? false,
        }),
      );
      return { title, rows };
    })
    .filter((section) => section.rows.length > 0);
}

export const PRICING_COMPARISON_SECTIONS = buildPricingComparisonSections();

/* ——— Page copy ——— */

export const PRICING_EYEBROW = "Pricing";

export const PRICING_HEADLINE =
  "Simple pricing. Powerful tools for every stage of growth.";

export const PRICING_SUBHEADING =
  "Start free, upgrade when you need more, and give your business one connected platform for bookings, communication, payments, customers, and operations.";

export const PRICING_NOTE = FOUNDER_PRICING_NOTE;

export const PRICING_WORKFLOW_EYEBROW = "Built to work together";

export const PRICING_WORKFLOW_HEADLINE =
  "From first booking to repeat customer. Automatically.";

export const PRICING_WORKFLOW_BODY =
  "Every appointment can trigger the next action, helping your business stay organized without constant manual work.";

export const PRICING_WORKFLOW_FOOTNOTE =
  "Everything works together, so you can focus on running your business instead of managing software.";

export const PRICING_WORKFLOW_LINK_LABEL = "See everything included";

export const PRICING_COMPARE_HEADLINE = "Compare plans";

export const PRICING_COMPARE_LEDE =
  "See exactly what is included at every level.";

export const PRICING_ALPHA_EYEBROW = "Private Alpha";

export const PRICING_ALPHA_HEADLINE = "Built with real businesses.";

export const PRICING_ALPHA_BODY =
  "Chasum is launching with a small group of service businesses helping shape the platform before its wider release.";

export const PRICING_ALPHA_CTA = "Join the Private Alpha";

export const PRICING_ALPHA_HREF = PRIVATE_ALPHA_HREF;

export const PRICING_FINAL_HEADLINE =
  "Ready to run your business with less manual work?";

export const PRICING_FINAL_BODY =
  "Start free today or join the Private Alpha to explore Chasum with our team.";

export const PRICING_FINAL_PRIMARY_CTA = "Start Free";

export const PRICING_FINAL_SECONDARY_CTA = CTA_APPLY_LABEL;

export type PricingFaqItem = { q: string; a: string };

export const PRICING_FAQ_ITEMS: PricingFaqItem[] = [
  {
    q: "Can I use Chasum for free?",
    a: "Yes. The Free plan includes online booking, calendar, email confirmations and reminders, basic customer management, one active staff member, and one location—with Chasum branding.",
  },
  {
    q: "Does the Free plan include SMS reminders?",
    a: "No. SMS reminders are included starting with Professional when messaging is configured for your business.",
  },
  {
    q: "Which plans include Business Calls & Texting?",
    a: "Business Calls & Texting is included on Professional, Business, and Enterprise through Chasum’s Communication Center (SMS and call activity). Free does not include it. Voice AI calling is not available yet.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. During Private Alpha we confirm the right plan with you during onboarding. As you grow, you can move up when you need more staff, locations, or communication tools.",
  },
  {
    q: "Is Summer included in every plan?",
    a: "Summer — Chasum's AI Business Manager — starts with Professional and is included in Business and Enterprise. Free focuses on core scheduling and email communication. Answering calls and appointment requests is one of her capabilities—not her only role.",
  },
  {
    q: "Who is Summer?",
    a: "Summer is Chasum's AI Business Manager. She helps you discover Chasum, get your business running, answer customer questions, automate everyday work, support your team, and help your business grow.",
  },
  {
    q: "Does Summer only answer phone calls?",
    a: "No. Handling customer questions and appointment requests is only one of Summer's AI Receptionist capabilities (grounded chat and messaging where configured; voice calling is not available yet). She also assists with onboarding, scheduling, customer communication, product guidance, automation, staff training, and business growth.",
  },
  {
    q: "Can Summer teach me how to use Chasum?",
    a: "Yes. Summer guides new users through setup, explains features, answers “How do I…” questions, and helps teams learn the platform.",
  },
  {
    q: "What happens when I reach my staff or location limit?",
    a: "You’ll see a clear upgrade prompt. Professional supports up to 3 active staff and 3 locations; Business supports unlimited active staff and up to 6 locations; Enterprise can extend locations further. Inactive staff remain on file and do not occupy a seat.",
  },
  {
    q: "Is Chasum available now?",
    a: "Chasum is in Private Alpha. Access is limited, onboarding is guided, and public self-serve billing is not open yet. Apply to join or schedule a demo.",
  },
  {
    q: "Do you offer custom plans for franchises or large organizations?",
    a: "Yes. Enterprise covers custom onboarding, dedicated support, security review, custom integrations, and volume pricing. Contact sales to discuss your setup.",
  },
];

export const PRICING_WORKFLOW_STEPS = [
  {
    title: "Customer Books",
    detail: "Online booking, phone, or walk-in.",
  },
  {
    title: "Summer Answers",
    detail: "Your AI Business Manager handles questions and appointment requests.",
  },
  {
    title: "Calendar Updates",
    detail: "Keeps schedules organized.",
  },
  {
    title: "Payment Collected",
    detail: "Accept payments securely.",
  },
  {
    title: "Confirmation Sent",
    detail: "Email and SMS communication automatically.",
  },
  {
    title: "Customer Returns",
    detail: "Follow-ups make rebooking easier.",
  },
] as const;

/* ——— Helpers ——— */

export function getPlanPrice(
  plan: PricingPlanConfig,
  period: BillingPeriod,
): { price: string; suffix?: string; note?: string } {
  if (plan.contactSales || plan.monthlyPrice === "Custom") {
    return { price: "Custom" };
  }
  if (period === "yearly" && plan.yearlyPrice) {
    return {
      price: plan.yearlyPrice,
      suffix: plan.priceSuffix ?? "/month",
      note: "billed yearly",
    };
  }
  return {
    price: plan.monthlyPrice,
    suffix: plan.priceSuffix,
  };
}

export function getMarketingPlan(
  id: string | null | undefined,
): MarketingPlan {
  const match = MARKETING_PLANS.find((plan) => plan.id === id);
  return match ?? MARKETING_PLANS[0]!;
}

export function getPricingPlan(
  id: string | null | undefined,
): PricingPlanConfig {
  const match = PRICING_PLANS.find((plan) => plan.id === id);
  return match ?? PRICING_PLANS[0]!;
}

export function marketingPlanIdToDbKey(
  id: string | null | undefined,
): PricingPlanConfig["planKey"] {
  return getPricingPlan(id).planKey;
}

export function isMarketingPlanId(value: string): value is MarketingPlanId {
  return PRICING_PLANS.some((plan) => plan.id === value);
}

export function resolveInitialPlan(
  planParam: string | string[] | undefined,
): MarketingPlanId {
  const raw = Array.isArray(planParam) ? planParam[0] : planParam;
  if (raw && isMarketingPlanId(raw)) return raw;
  return "free";
}

/** @deprecated Legacy exports kept for import compatibility during transition */
export const PRICING_PLATFORM_EYEBROW = PRICING_WORKFLOW_EYEBROW;
export const PRICING_PLATFORM_HEADLINE_LINE_1 = "From first booking";
export const PRICING_PLATFORM_HEADLINE_LINE_2 = "to repeat customer.";
export const PRICING_PLATFORM_BODY = PRICING_WORKFLOW_BODY;
export const PRICING_PLATFORM_FOOTNOTE = PRICING_WORKFLOW_FOOTNOTE;
export const PRICING_FOUNDER_EYEBROW = PRICING_ALPHA_EYEBROW;
export const PRICING_FOUNDER_HEADLINE = PRICING_ALPHA_HEADLINE;
export const PRICING_FOUNDER_BODY = PRICING_ALPHA_BODY;
export const PRICING_CTA_EYEBROW = "Next step";
export const PRICING_CTA_HEADLINE = PRICING_FINAL_HEADLINE;
export const PRICING_CTA_BODY = PRICING_FINAL_BODY;

export const FREE_PLAN_LIMIT_MESSAGE =
  "Your current plan has reached its location limit. Apply for Professional to add more sites.";

/** Header / location-limit CTA. Does not imply self-serve checkout. */
export const FREE_PLAN_UPGRADE_CTA = "Apply for Professional";
