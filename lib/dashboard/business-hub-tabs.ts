/**
 * Business setup hub tabs — label and URL contract for `/dashboard/business`.
 * Keys stay stable so deep links and entitlements do not change.
 */

export const BUSINESS_HUB_TAB_KEYS = [
  "profile",
  "hours",
  "booking",
  "branding",
  "notifications",
  "ai",
  "documents",
  "locations",
  "categories",
  "rooms",
  "memberships",
  "packages",
  "giftcards",
  "taxes",
  "discounts",
  "forms",
  "automation",
] as const;

export type BusinessHubTabKey = (typeof BUSINESS_HUB_TAB_KEYS)[number];

/** Retired duplicate of Catalog → Services. Old URLs redirect to the catalog. */
export const RETIRED_BUSINESS_HUB_SERVICES_TAB = "services";

export function isBusinessHubTab(
  value: string | null | undefined,
): value is BusinessHubTabKey {
  return (
    typeof value === "string" &&
    (BUSINESS_HUB_TAB_KEYS as readonly string[]).includes(value)
  );
}

export function parseBusinessHubTab(
  value: string | null | undefined,
): BusinessHubTabKey | null {
  return isBusinessHubTab(value) ? value : null;
}

export function businessHubHref(tab: BusinessHubTabKey = "profile"): string {
  if (tab === "profile") return "/dashboard/business";
  return `/dashboard/business?tab=${tab}`;
}
