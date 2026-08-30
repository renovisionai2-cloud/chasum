/**
 * System Status — Private Alpha manually reviewed status.
 *
 * Manual-review policy (internal; not a public promise):
 * - Review when a listed service changes, or a known Production defect appears or clears.
 * - Review after Production deploys affecting listed services.
 * - Target at least weekly review while active Private Alpha pilots are live.
 * - Never bump the displayed review date without reviewing the rows and known issues.
 * - Remain manual during Private Alpha unless a future approved architecture replaces it.
 */

export const STATUS_PAGE = {
  eyebrow: "Status",
  headline: "Chasum System Status",
  lede: "View the current status of Chasum services and scheduled maintenance. During Private Alpha, this page is manually reviewed and updated as needed.",
} as const;

export const STATUS_LAST_UPDATED = "2026-08-30";

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
  { name: "Public booking", status: "Limited" },
  { name: "Database and authentication", status: "Operational" },
  {
    name: "Customer email delivery",
    status: "Configuration Required",
    note: "Customer email delivery depends on platform email configuration and each business’s messaging settings.",
  },
  {
    name: "SMS delivery",
    status: "Configuration Required",
    note: "SMS delivery depends on business messaging configuration and plan eligibility.",
  },
  {
    name: "Customer payment integrations",
    status: "Configuration Required",
    note: "Customer payment collection depends on the business’s payment setup.",
  },
] as const;

export const STATUS_LEGEND: readonly {
  status: StatusLevel;
  meaning: string;
}[] = [
  {
    status: "Operational",
    meaning: "No known service interruption as of the last manual review.",
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
  body: "Public bookings that require selecting a specific staff member may fail during confirmation, and no appointment is created in that case. A fix is in progress.",
} as const;

export const STATUS_SUPPORT = {
  title: "Support",
  body: "For an issue affecting your business, contact support or email sales@chasumai.com.",
} as const;
