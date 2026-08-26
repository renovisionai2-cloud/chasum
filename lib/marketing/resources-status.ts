/**
 * System Status — Private Alpha manually reviewed status.
 * STATUS: APPROVED · VERSION: Resources v1 · STATE: Locked
 * See docs/marketing/RESOURCES_V1_LOCK.md
 */

export const STATUS_PAGE = {
  eyebrow: "Status",
  headline: "Chasum System Status",
  lede: "View the current status of Chasum services and scheduled maintenance. During Private Alpha, this page is manually reviewed and updated as needed.",
} as const;

export const STATUS_LAST_UPDATED = "2026-07-30";

export type StatusLevel =
  | "Operational"
  | "Configuration Required"
  | "Maintenance"
  | "Limited"
  | "Unavailable";

export const STATUS_SERVICES: readonly {
  name: string;
  status: StatusLevel;
  note?: string;
}[] = [
  { name: "Application and dashboard", status: "Operational" },
  { name: "Public booking", status: "Operational" },
  { name: "Database and authentication", status: "Operational" },
  {
    name: "Email delivery",
    status: "Configuration Required",
    note: "Depends on messaging setup for each business.",
  },
  {
    name: "SMS delivery",
    status: "Configuration Required",
    note: "Depends on messaging setup for each business.",
  },
  {
    name: "Payment integrations",
    status: "Configuration Required",
    note: "Depends on payment setup for each business.",
  },
] as const;

export const STATUS_LEGEND: readonly {
  status: StatusLevel;
  meaning: string;
}[] = [
  {
    status: "Operational",
    meaning: "Working as expected for design partners.",
  },
  {
    status: "Configuration Required",
    meaning: "Available when provider credentials are set up for your business.",
  },
  {
    status: "Maintenance",
    meaning: "Temporarily unavailable while we perform planned work.",
  },
  {
    status: "Limited",
    meaning: "Partially available; some capabilities may be reduced.",
  },
  {
    status: "Unavailable",
    meaning: "Not currently available.",
  },
] as const;

export const STATUS_MAINTENANCE = {
  title: "Planned Maintenance",
  body: "No planned maintenance is scheduled at this time. When maintenance is planned, it will be listed here.",
} as const;

export const STATUS_ISSUES = {
  title: "Known Issues",
  body: "No active platform-wide issues are listed at this time. If something affects your business, contact support.",
} as const;

export const STATUS_SUPPORT = {
  title: "Support",
  body: "For an issue affecting your business, contact support or email sales@chasumai.com.",
} as const;
