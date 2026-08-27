/**
 * Canonical Pricing configuration — cards, comparison, and billing toggle
 * share this single source of truth.
 *
 * Private Alpha: plan CTAs route to /apply?plan=… as acquisition intent —
 * not public self-serve checkout, and never as subscription_plan_key.
 *
 * Deferred commercial debt (do not fix in this Pricing pass):
 * - Business location runtime/catalog/DB still 10 vs canonical marketing 6
 * - Memberships & Packages exist in product; no Pricing plan boundary yet
 * - Invoicing has no runtime plan gate
 * - SaaS subscription currency not locked (keep bare $)
 * - Self-serve billing remains closed
 */

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
    name: "Customer Communications",
    category: "Communication",
    note: "Email, SMS reminders, and communication activity. SMS requires eligible plan and provider configuration. Not hosted calling or AI phone service.",
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
    note: "Assistive Early Access. Observe, understand, and recommend. Human remains in control.",
  },
  {
    id: "payments",
    name: "Payments & Financials",
    category: "Payments",
    note: "Manual-first and Early Access. Broader online card collection is still in development.",
  },
  {
    id: "gift_cards",
    name: "Gift Certificates",
    category: "Payments",
    note: "Operator create and redeem. Not a public storefront yet.",
  },
  {
    id: "invoicing",
    name: "Invoicing",
    category: "Payments",
    note: "Early Access. Operator invoices connected to the operating day.",
  },
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
    name: "Reporting & Insights",
    category: "Reporting & Operations",
    note: "Reporting from recorded activity. Not a separate analytics product.",
  },
  {
    id: "api_integrations",
    name: "API & Integrations",
    category: "Reporting & Operations",
    note: "Developer API and webhooks when enabled.",
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
    note: "Not included today. Deeper team login and permissions are Coming Next.",
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
  /**
   * Annual total (monthly × 10; 10 months paid for 12 months of service).
   * Null for custom Enterprise pricing.
   */
  yearlyTotal: string | null;
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
 * Annual billing: pay for 10 months, receive 12 months of service.
 * Professional $79 × 10 = $790/year · Business $149 × 10 = $1,490/year
 * Do not display 20% off or monthly-equivalent yearly headlines.
 */
export const PRICING_ANNUAL_NOTE = "12 months of service · pay for 10";
export const PRICING_ANNUAL_BADGE = "Save 2 months";

export const PRICING_PLANS: PricingPlanConfig[] = [
  {
    id: "free",
    planKey: "starter",
    name: "Free",
    bestFor: "Solo businesses getting started.",
    monthlyPrice: "$0",
    yearlyTotal: "$0",
    ctaLabel: "Apply for Free",
    ctaHref: `${APPLY_HREF}?plan=free`,
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
      white_glove: false,
      success_manager: false,
      custom_integrations: false,
      enterprise_security: false,
      custom_permissions: false,
      volume_pricing: false,
      staff_limit: "1",
      location_limit: "1",
    },
  },
  {
    id: "professional",
    planKey: "professional",
    name: "Professional",
    bestFor:
      "Growing businesses that want Summer and stronger customer communication.",
    monthlyPrice: "$79",
    yearlyTotal: "$790",
    priceSuffix: "/month",
    badge: "Most Popular",
    highlighted: true,
    ctaLabel: "Apply for Professional",
    ctaHref: `${APPLY_HREF}?plan=professional`,
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
      white_glove: false,
      success_manager: false,
      custom_integrations: false,
      enterprise_security: false,
      custom_permissions: false,
      volume_pricing: false,
      staff_limit: "Up to 3",
      location_limit: "Up to 3",
    },
  },
  {
    id: "business",
    planKey: "business",
    name: "Business",
    bestFor: "Multi-staff businesses managing multiple locations.",
    monthlyPrice: "$149",
    yearlyTotal: "$1,490",
    priceSuffix: "/month",
    highlighted: false,
    ctaLabel: "Apply for Business",
    ctaHref: `${APPLY_HREF}?plan=business`,
    inheritedPlan: "professional",
    cardFeatures: [
      "staff_limit",
      "location_limit",
      "advanced_analytics",
      "api_integrations",
      "priority_support",
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
      white_glove: false,
      success_manager: false,
      custom_integrations: false,
      enterprise_security: false,
      custom_permissions: false,
      volume_pricing: false,
      staff_limit: "Unlimited",
      location_limit: "Up to 6",
    },
  },
  {
    id: "enterprise",
    planKey: "enterprise",
    name: "Enterprise",
    bestFor:
      "Franchises, chains, and organizations with custom commercial requirements.",
    monthlyPrice: "Custom",
    yearlyTotal: null,
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
      white_glove: true,
      success_manager: true,
      custom_integrations: true,
      enterprise_security: true,
      custom_permissions: false,
      volume_pricing: true,
      staff_limit: "Unlimited",
      location_limit: "Unlimited",
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
    return value === "1" ? "1 Staff Member" : `${value} Staff Members`;
  }
  if (id === "location_limit" && typeof value === "string") {
    return value === "1" ? "1 Location" : `${value} Locations`;
  }
  if (id === "priority_support" && plan.id === "enterprise") {
    return "SLA & Priority Support";
  }
  if (id === "payments") {
    return `${name} · Manual-first / Early Access`;
  }
  if (id === "gift_cards") {
    return `${name} · Operator create & redeem`;
  }
  if (id === "business_messaging") {
    return `${name} · Email, SMS, activity`;
  }
  if (id === "invoicing") {
    return `${name} · Early Access`;
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
          note: f.note,
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
  "A Free plan is available through Private Alpha. Upgrade when you need more, and run scheduling, customers, communications, payments, and operations in one connected operating system.";

export const PRICING_NOTE = FOUNDER_PRICING_NOTE;

export const PRICING_WORKFLOW_EYEBROW = "Built to work together";

export const PRICING_WORKFLOW_HEADLINE =
  "From first booking to repeat customer—connected.";

export const PRICING_WORKFLOW_BODY =
  "Each step stays connected in one operating system, so the day is easier to see and run without switching between disconnected tools.";

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
  "Ready to explore Chasum in Private Alpha?";

export const PRICING_FINAL_BODY =
  "Apply for Private Alpha to review how Chasum could fit the way your business already works.";

export const PRICING_FINAL_PRIMARY_CTA = CTA_APPLY_LABEL;

export const PRICING_FINAL_SECONDARY_CTA = CTA_APPLY_LABEL;

export type PricingFaqItem = { q: string; a: string };

export const PRICING_FAQ_ITEMS: PricingFaqItem[] = [
  {
    q: "Can I use Chasum for free?",
    a: "Chasum has a Free plan—online booking, calendar, email confirmations and reminders, basic customer management, one staff member, and one location, with Chasum branding. Access is currently through Private Alpha; public self-serve signup and billing are not open yet.",
  },
  {
    q: "Does the Free plan include SMS reminders?",
    a: "No. SMS reminders are included starting with Professional when messaging is configured for your business.",
  },
  {
    q: "Which plans include Customer Communications?",
    a: "Customer Communications is included on Professional, Business, and Enterprise: configured email, SMS reminders, and communication history/activity. Free does not include SMS. Logged call activity, when present, is history—not hosted phone service through Chasum. AI phone and voice calling are not available yet.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. During Private Alpha we confirm the right plan with you during onboarding. As you grow, you can move up when you need more staff, locations, or communication tools. Self-serve paid billing is not open yet.",
  },
  {
    q: "Is Summer included in every plan?",
    a: "Summer — Chasum's AI Business Manager — starts with Professional and is included in Business and Enterprise. Free focuses on core scheduling and email communication. Helping with customer questions and appointment requests is one of her capabilities—not her only role.",
  },
  {
    q: "Who is Summer?",
    a: "Summer is Chasum's AI Business Manager. She helps you understand what is happening across the business, what needs attention, and what to do next. She can also offer product guidance and help with customer questions using your business context. She is assistive today—observe, understand, recommend—while you remain in control.",
  },
  {
    q: "Does Summer only answer phone calls?",
    a: "No. Helping with customer questions and appointment requests is only one capability (grounded chat and messaging where configured). Voice calling is not available yet. Summer is Chasum's AI Business Manager, not a phone-answering product.",
  },
  {
    q: "Can Summer teach me how to use Chasum?",
    a: "Yes. Summer can guide new users through setup, explain features, and answer “How do I…” questions using your business context. That is product guidance—not a separate staff-training product.",
  },
  {
    q: "What happens when I reach my staff or location limit?",
    a: "You’ll see a clear upgrade prompt. Professional supports up to 3 staff and 3 locations; Business supports unlimited staff and up to 6 locations; Enterprise can extend locations further. Plan changes during Private Alpha are arranged with Chasum.",
  },
  {
    q: "Is Chasum available now?",
    a: "Chasum is in Private Alpha. Access is limited, onboarding is guided, and public self-serve billing is not open yet. Apply to join or schedule a demo.",
  },
  {
    q: "Do you offer custom plans for franchises or large organizations?",
    a: "Yes. Enterprise is for organizations with custom commercial requirements—including franchises and chains—covering custom onboarding, dedicated support, security review, custom integrations, and volume pricing. Franchise Management software is a future direction, not a current product. Contact sales to discuss your setup.",
  },
];

export const PRICING_WORKFLOW_STEPS = [
  {
    title: "Customer Books",
    detail: "Online booking, phone, or walk-in.",
  },
  {
    title: "Summer Answers",
    detail:
      "Your AI Business Manager can help with questions and appointment requests.",
  },
  {
    title: "Calendar Updates",
    detail: "Keeps schedules organized.",
  },
  {
    title: "Payment Recorded",
    detail: "Keep payments, deposits, invoices and receipts connected.",
  },
  {
    title: "Confirmation Sent",
    detail:
      "Keep customers informed with configured email and SMS communication.",
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
  if (period === "yearly" && plan.yearlyTotal) {
    return {
      price: plan.yearlyTotal,
      suffix: " / year",
      note:
        plan.yearlyTotal === "$0" ? undefined : PRICING_ANNUAL_NOTE,
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

export const APPLY_PLAN_INTENT_IDS = [
  "free",
  "professional",
  "business",
] as const;

export type ApplyPlanIntentId = (typeof APPLY_PLAN_INTENT_IDS)[number];

export function isApplyPlanIntentId(
  value: string | null | undefined,
): value is ApplyPlanIntentId {
  return (
    value === "free" || value === "professional" || value === "business"
  );
}

/** Acquisition-intent URL only. Never writes subscription or billing state. */
export function applyHrefForPlan(id: MarketingPlanId): string {
  if (id === "enterprise") return DEMO_HREF;
  return `${APPLY_HREF}?plan=${id}`;
}

export function resolveApplyPlanIntent(
  planParam: string | string[] | undefined,
): ApplyPlanIntentId | null {
  const raw = Array.isArray(planParam) ? planParam[0] : planParam;
  if (raw && isApplyPlanIntentId(raw)) return raw;
  return null;
}

/** Optional future Industries context. Does not create tenants. */
export function resolveApplyIndustryIntent(
  industryParam: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(industryParam) ? industryParam[0] : industryParam;
  const value = raw?.trim() ?? "";
  return value.length > 0 ? value : null;
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
  "Your current plan has reached its location limit. Request Professional through Private Alpha to add more sites.";

export const FREE_PLAN_UPGRADE_CTA = "Request Professional";
