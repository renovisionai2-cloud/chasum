/**
 * Public Roadmap — living product-maturity narrative (not developer release notes).
 *
 * STATUS: CURRENT-GENERATION PRODUCT TRUTH · PENDING PO VISUAL REVIEW
 * Version: four-stage model approved 2026-08-27
 *
 * Promote items by changing `status` only:
 * future_direction → coming_next → in_development → private_alpha
 *
 * Pricing / Roadmap product-truth conflicts (do not silently match stale Pricing;
 * Pricing audit is separate):
 * - Inventory appears on Pricing Business+; product remains a placeholder → future_direction
 * - Pricing “Online Payments” is stronger than current manual-first commerce
 * - Invoicing appears on Pricing; represented here inside Payments & Financials (Early Access)
 * - Memberships/Packages exist in product and Industries; Pricing is silent
 */

export const ROADMAP_LAST_REVIEWED = "2026-08-27";

export const ROADMAP_HERO = {
  eyebrow: "Roadmap",
  headline: "Building the AI operating system for service businesses.",
  lede: "We're building Chasum alongside real service businesses, solving the operational problems they actually face. Customer feedback shapes what we strengthen next—not trends.",
} as const;

export type RoadmapStatus =
  | "private_alpha"
  | "in_development"
  | "coming_next"
  | "future_direction";

export const ROADMAP_STATUS_ORDER = [
  "private_alpha",
  "in_development",
  "coming_next",
  "future_direction",
] as const satisfies readonly RoadmapStatus[];

export type RoadmapIcon =
  | "booking"
  | "calendar"
  | "customers"
  | "team"
  | "locations"
  | "payments"
  | "gift"
  | "memberships"
  | "communications"
  | "reports"
  | "command"
  | "summer"
  | "reliability"
  | "commerce"
  | "mobile"
  | "access"
  | "automation"
  | "phone"
  | "inventory"
  | "payroll"
  | "campaigns"
  | "franchise"
  | "loyalty"
  | "marketplace"
  | "intelligence";

export type RoadmapItem = {
  id: string;
  status: RoadmapStatus;
  title: string;
  description: string;
  icon: RoadmapIcon;
  qualification?: string;
};

export type RoadmapStage = {
  id: string;
  title: string;
  navLabel: string;
  subtitle: string;
};

export const ROADMAP_STAGES: Record<RoadmapStatus, RoadmapStage> = {
  private_alpha: {
    id: "available-in-private-alpha",
    title: "Available in Private Alpha",
    navLabel: "Private Alpha",
    subtitle:
      "Usable with design partners today, while we continue improving and hardening the operating system.",
  },
  in_development: {
    id: "in-development",
    title: "In Development",
    navLabel: "In Development",
    subtitle:
      "Where we're actively strengthening and extending Chasum now.",
  },
  coming_next: {
    id: "coming-next",
    title: "Coming Next",
    navLabel: "Coming Next",
    subtitle:
      "Approved near-term capabilities after the current work to stabilize the operating system.",
  },
  future_direction: {
    id: "future-direction",
    title: "Future Direction",
    navLabel: "Future Direction",
    subtitle:
      "Longer-term expansion of the Chasum operating system. This is direction, not a delivery promise.",
  },
};

export const ROADMAP_ITEMS: readonly RoadmapItem[] = [
  {
    id: "online-booking",
    status: "private_alpha",
    title: "Online Booking",
    description:
      "Customers book when it works for them—without phone tag or missed inquiries.",
    icon: "booking",
    qualification: "Usable in Private Alpha. Reliability continues to improve.",
  },
  {
    id: "calendar-scheduling",
    status: "private_alpha",
    title: "Calendar & Scheduling",
    description:
      "See appointments, staff schedules, and recurring visits in one place so the day stays coordinated.",
    icon: "calendar",
  },
  {
    id: "customers",
    status: "private_alpha",
    title: "Customers",
    description:
      "Keep records, history, and context together so the team can serve people with more continuity.",
    icon: "customers",
  },
  {
    id: "team-employees",
    status: "private_alpha",
    title: "Team & Employees",
    description:
      "Configure employees, schedules, and staff context inside the same operating system.",
    icon: "team",
    qualification: "Deeper team login and permissions come next.",
  },
  {
    id: "locations",
    status: "private_alpha",
    title: "Locations",
    description:
      "Support one location or several, with plan-based location capacity.",
    icon: "locations",
    qualification:
      "Basic multi-location support—not advanced multi-location operations.",
  },
  {
    id: "payments-financials",
    status: "private_alpha",
    title: "Payments & Financials",
    description:
      "Record payments and deposits, and keep invoices and receipts connected to the same operating day.",
    icon: "payments",
    qualification:
      "Manual-first and Early Access today. Online card collection is still deepening.",
  },
  {
    id: "gift-certificates",
    status: "private_alpha",
    title: "Gift Certificates",
    description:
      "Create and redeem gift certificates as part of the business you already run.",
    icon: "gift",
    qualification:
      "Operator create and redeem—not a public gift-card storefront yet.",
  },
  {
    id: "memberships-packages",
    status: "private_alpha",
    title: "Memberships & Packages",
    description:
      "Configure memberships and service packages where the business already sells them.",
    icon: "memberships",
    qualification:
      "Operator configuration exists. Deeper customer lifecycle continues to evolve.",
  },
  {
    id: "customer-communications",
    status: "private_alpha",
    title: "Customer Communications",
    description:
      "Keep email notifications, configured SMS reminders, and communication activity together.",
    icon: "communications",
    qualification:
      "SMS depends on eligible plan and provider configuration. Not AI phone service.",
  },
  {
    id: "reports",
    status: "private_alpha",
    title: "Reports",
    description:
      "See reporting from the activity the business already records.",
    icon: "reports",
  },
  {
    id: "command-centre",
    status: "private_alpha",
    title: "Command Centre",
    description:
      "Start the day from one operating home—what needs attention, and what to do next.",
    icon: "command",
  },
  {
    id: "summer",
    status: "private_alpha",
    title: "Summer, AI Business Manager",
    description:
      "Summer observes, understands, and recommends using the same operating context—while you remain in control.",
    icon: "summer",
    qualification: "Assistive Early Access. Not autonomous operation.",
  },
  {
    id: "booking-calendar-reliability",
    status: "in_development",
    title: "Core Booking & Calendar Reliability",
    description:
      "Making booking, availability, and calendar workflows more reliable and more connected.",
    icon: "reliability",
  },
  {
    id: "payments-commerce-depth",
    status: "in_development",
    title: "Online Payments & Commerce Depth",
    description:
      "Deepening card collection and the connected commerce experience around payments, invoices, and receipts.",
    icon: "commerce",
    qualification: "Online card collection is not broadly available yet.",
  },
  {
    id: "native-mobile-apps",
    status: "coming_next",
    title: "Native Mobile Apps",
    description:
      "One Chasum app for iOS and Android, so the operating system travels with the business.",
    icon: "mobile",
    qualification:
      "A pre-launch build after core stability. One reusable app—not a separate app per business.",
  },
  {
    id: "team-access",
    status: "coming_next",
    title: "Team Access",
    description:
      "Staff login and deeper team permissions, so more of the team can work inside Chasum.",
    icon: "access",
  },
  {
    id: "ai-workflow-automation",
    status: "coming_next",
    title: "AI Workflow Automation",
    description:
      "Summer helping act with approval and automate repetitive workflows safely.",
    icon: "automation",
    qualification: "Not autonomous operation.",
  },
  {
    id: "ai-phone-calls",
    status: "future_direction",
    title: "AI Phone Calls",
    description:
      "Voice conversations that can answer, book, and help customers—including after hours.",
    icon: "phone",
  },
  {
    id: "inventory-management",
    status: "future_direction",
    title: "Inventory Management",
    description:
      "Know what's in stock before you run out—without a separate inventory tool.",
    icon: "inventory",
  },
  {
    id: "payroll",
    status: "future_direction",
    title: "Payroll",
    description:
      "Pay the team accurately with less spreadsheet work at the end of each pay period.",
    icon: "payroll",
  },
  {
    id: "marketing-campaigns",
    status: "future_direction",
    title: "Marketing Campaigns",
    description:
      "Bring customers back and fill slower days with campaigns that grow the business.",
    icon: "campaigns",
  },
  {
    id: "advanced-multi-location",
    status: "future_direction",
    title: "Advanced Multi-location Operations",
    description:
      "Run day-to-day operations across multiple owned locations with more consistent visibility and control.",
    icon: "locations",
  },
  {
    id: "franchise-management",
    status: "future_direction",
    title: "Franchise Management",
    description:
      "Brand and network-level standards, governance, and oversight as the business scales.",
    icon: "franchise",
  },
  {
    id: "customer-loyalty",
    status: "future_direction",
    title: "Customer Loyalty",
    description:
      "Reward return visits and turn one-time customers into regulars.",
    icon: "loyalty",
  },
  {
    id: "marketplace",
    status: "future_direction",
    title: "Marketplace",
    description:
      "Add trusted tools and services when you need them—without stitching together a messy stack.",
    icon: "marketplace",
  },
  {
    id: "proactive-intelligence",
    status: "future_direction",
    title: "Proactive Intelligence",
    description:
      "Deeper intelligence that can operate more proactively—still a destination, not how Chasum works today.",
    icon: "intelligence",
  },
] as const satisfies readonly RoadmapItem[];

export function roadmapItemsByStatus(
  status: RoadmapStatus,
): readonly RoadmapItem[] {
  return ROADMAP_ITEMS.filter((item) => item.status === status);
}

export const ROADMAP_CLOSING = {
  title: "Built With Our Customers",
  paragraphs: [
    "Every major improvement in Chasum begins with feedback from real business owners.",
    "We don't build capabilities because they're trendy. We build what saves time, reduces repetitive work, improves customer experiences, and helps businesses grow.",
    "This roadmap evolves alongside the businesses helping us build Chasum.",
  ],
} as const;
