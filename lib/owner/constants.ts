import { MARKETING_PLANS } from "@/lib/marketing/pricing";

/** Fallback monthly list prices when subscription_plans.monthly_price_cents is unset. */
export const PLAN_LIST_PRICE_CENTS: Record<string, number | null> = {
  starter: 0,
  free: 0,
  professional: 7900,
  business: 14900,
  enterprise: null,
};

export function planListPriceCents(
  planKey: string | null | undefined,
  dbCents?: number | null,
): number | null {
  if (dbCents !== undefined && dbCents !== null) return dbCents;
  if (!planKey) return 0;
  if (planKey in PLAN_LIST_PRICE_CENTS) {
    return PLAN_LIST_PRICE_CENTS[planKey]!;
  }
  const marketing = MARKETING_PLANS.find(
    (p) => p.planKey === planKey || p.id === planKey,
  );
  if (!marketing) return 0;
  if (marketing.price === "Custom" || marketing.price === "$0") {
    return marketing.price === "$0" ? 0 : null;
  }
  const match = marketing.price.replace(/[^0-9.]/g, "");
  const dollars = Number(match);
  return Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export const OWNER_NAV = [
  { href: "/owner", label: "Overview", icon: "layout-dashboard" },
  { href: "/owner/businesses", label: "Businesses", icon: "building" },
  { href: "/owner/subscriptions", label: "Subscriptions", icon: "credit-card" },
  { href: "/owner/revenue", label: "Revenue", icon: "dollar" },
  { href: "/owner/trials", label: "Free Trials", icon: "clock" },
  { href: "/owner/support", label: "Support", icon: "life-buoy" },
  { href: "/owner/health", label: "Platform Health", icon: "activity" },
  { href: "/owner/security", label: "Security", icon: "shield" },
  { href: "/owner/settings", label: "Settings", icon: "settings" },
] as const;

export type OwnerNavIcon = (typeof OWNER_NAV)[number]["icon"];
