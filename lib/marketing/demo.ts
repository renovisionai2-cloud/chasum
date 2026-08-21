/**
 * Marketing-only demo chrome for DashboardPreview.
 * Keep Summer branding here — never surface legacy Emma paths on the public site.
 */

import {
  SUMMER_IDENTITY,
  SUMMER_IDENTITY_SHORT,
} from "@/lib/marketing/summer-positioning";

export const MARKETING_SUMMER_IDENTITY = SUMMER_IDENTITY;

export const MARKETING_SUMMER_DEMO_LABEL = SUMMER_IDENTITY_SHORT;

/** Fake address-bar paths shown inside the marketing dashboard mock. */
export const MARKETING_DEMO_PATHS = {
  overview: "app.chasum.com/dashboard",
  reception: "app.chasum.com/dashboard/calendar",
  crm: "app.chasum.com/dashboard/clients",
  reports: "app.chasum.com/dashboard/reports",
  summer: "app.chasum.com/dashboard/ai-workforce/summer",
  employees: "app.chasum.com/dashboard/employees",
  business: "app.chasum.com/dashboard/business",
  communication: "app.chasum.com/dashboard/notifications",
  billing: "app.chasum.com/dashboard/settings/billing",
} as const;

export type MarketingDemoVariant = keyof typeof MARKETING_DEMO_PATHS;

export function marketingDemoPath(variant: MarketingDemoVariant): string {
  return MARKETING_DEMO_PATHS[variant];
}
