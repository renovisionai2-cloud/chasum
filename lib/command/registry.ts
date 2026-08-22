/**
 * Command palette registry — architecture for ⌘K / Ctrl+K.
 * Static navigation + actions; live search still merges DB results.
 */

export type CommandId =
  | "book-customer"
  | "search-customer"
  | "search-employee"
  | "go-calendar"
  | "go-crm"
  | "go-reports"
  | "go-services"
  | "go-employees"
  | "go-settings"
  | "go-overview"
  | "go-business"
  | "go-ai"
  | "go-summer"
  | "go-chase"
  | "go-payments"
  | "go-communications"
  | "go-hq"
  | "go-private-alpha"
  | "go-packages"
  | "go-memberships"
  | "go-gift-cards"
  | "go-discounts"
  | "go-locations"
  | "go-hours"
  | "go-booking"
  | "go-taxes"
  | "go-booking-notifications"
  | "go-business-rules"
  | "go-integrations";

export type CommandDefinition = {
  id: CommandId;
  title: string;
  subtitle?: string;
  href: string;
  keywords: string[];
  group: "actions" | "navigate";
  /** Platform owner only — filtered in searchCommandPalette. */
  ownerOnly?: boolean;
};

export const COMMAND_REGISTRY: CommandDefinition[] = [
  {
    id: "book-customer",
    title: "Book Customer",
    subtitle: "Open Reception booking",
    href: "/dashboard/calendar?view=day&book=1",
    keywords: ["book", "appointment", "new", "schedule"],
    group: "actions",
  },
  {
    id: "search-customer",
    title: "Search Customer",
    subtitle: "Customer directory",
    href: "/dashboard/clients",
    keywords: ["customer", "client", "crm", "search"],
    group: "actions",
  },
  {
    id: "search-employee",
    title: "Search Employee",
    subtitle: "Employee directory",
    href: "/dashboard/employees",
    keywords: ["employee", "staff", "team"],
    group: "actions",
  },
  {
    id: "go-calendar",
    title: "Go to Reception",
    subtitle: "Day view calendar",
    href: "/dashboard/calendar?view=day",
    keywords: ["calendar", "day", "reception", "schedule"],
    group: "navigate",
  },
  {
    id: "go-crm",
    title: "Go to Customers",
    subtitle: "Customer directory",
    href: "/dashboard/clients",
    keywords: ["crm", "clients", "customers"],
    group: "navigate",
  },
  {
    id: "go-reports",
    title: "Go to Reports",
    href: "/dashboard/reports",
    keywords: ["reports", "analytics", "metrics"],
    group: "navigate",
  },
  {
    id: "go-services",
    title: "Go to Services",
    href: "/dashboard/services",
    keywords: ["services", "catalog"],
    group: "navigate",
  },
  {
    id: "go-employees",
    title: "Go to Employees",
    href: "/dashboard/employees",
    keywords: ["employees", "staff"],
    group: "navigate",
  },
  {
    id: "go-settings",
    title: "Go to Account & billing",
    subtitle: "Plan, profile, and location hours",
    href: "/dashboard/settings",
    keywords: ["settings", "preferences", "account", "billing", "plan"],
    group: "navigate",
  },
  {
    id: "go-overview",
    title: "Go to Command Centre",
    subtitle: "Today’s operating view",
    href: "/dashboard",
    keywords: ["overview", "home", "dashboard", "command centre", "command center"],
    group: "navigate",
  },
  {
    id: "go-business",
    title: "Go to Business setup",
    subtitle: "Company configuration workspace",
    href: "/dashboard/business",
    keywords: ["business", "hours", "branding", "settings", "setup", "hub"],
    group: "navigate",
  },
  {
    id: "go-summer",
    title: "Open Summer",
    subtitle: "AI Business Manager · Early Access",
    href: "/dashboard/ai-workforce/summer",
    keywords: ["ai", "summer", "business manager", "ask summer", "book", "early access"],
    group: "navigate",
  },
  {
    id: "go-chase",
    title: "Open Chase",
    subtitle: "AI Operations Manager · Early Access",
    href: "/dashboard/workforce/chase",
    keywords: ["ai", "chase", "operations", "analytics", "insights", "noah"],
    group: "navigate",
  },
  {
    id: "go-payments",
    title: "Open Payments",
    subtitle: "Sales and payments",
    href: "/dashboard/payments",
    keywords: ["payments", "billing", "invoice", "receipt", "refund", "deposit", "sales"],
    group: "navigate",
  },
  {
    id: "go-communications",
    title: "Open Communications",
    subtitle: "Messages and notifications",
    href: "/dashboard/notifications",
    keywords: ["communications", "notifications", "messages", "inbox", "email", "sms"],
    group: "navigate",
  },
  {
    id: "go-ai",
    title: "Go to AI Workforce",
    subtitle: "Team roster · Early Access",
    href: "/dashboard/ai-workforce",
    keywords: ["ai", "workforce", "alex"],
    group: "navigate",
  },
  {
    id: "go-hq",
    title: "Open Platform Admin",
    subtitle: "SaaS control plane — internal only",
    href: "/dashboard/hq",
    keywords: ["hq", "platform", "admin", "control", "founder", "ceo", "pipeline", "launch", "owner"],
    group: "navigate",
    ownerOnly: true,
  },
  {
    id: "go-private-alpha",
    title: "Open Private Alpha",
    subtitle: "Founding Design Partner ops",
    href: "/dashboard/hq/private-alpha",
    keywords: [
      "private alpha",
      "design partner",
      "gvm",
      "carstar",
      "shoppers",
      "onboarding",
      "founder",
    ],
    group: "navigate",
    ownerOnly: true,
  },
  {
    id: "go-packages",
    title: "Go to Packages",
    subtitle: "Catalog bundles",
    href: "/dashboard/business?tab=packages",
    keywords: ["packages", "bundle", "catalog"],
    group: "navigate",
  },
  {
    id: "go-memberships",
    title: "Go to Memberships",
    subtitle: "Preview / Coming Soon",
    href: "/dashboard/business?tab=memberships",
    keywords: ["memberships", "members", "recurring", "catalog"],
    group: "navigate",
  },
  {
    id: "go-gift-cards",
    title: "Go to Gift Cards",
    subtitle: "Stored value",
    href: "/dashboard/business?tab=giftcards",
    keywords: ["gift cards", "gift card", "certificate", "stored value"],
    group: "navigate",
  },
  {
    id: "go-discounts",
    title: "Go to Discounts",
    subtitle: "Promo codes",
    href: "/dashboard/business?tab=discounts",
    keywords: ["discounts", "promo", "coupon", "codes"],
    group: "navigate",
  },
  {
    id: "go-locations",
    title: "Go to Locations",
    subtitle: "Sites and rooms",
    href: "/dashboard/business?tab=locations",
    keywords: ["locations", "sites", "branches", "studios"],
    group: "navigate",
  },
  {
    id: "go-hours",
    title: "Go to Business hours",
    subtitle: "Business setup → Hours",
    href: "/dashboard/business?tab=hours",
    keywords: ["hours", "opening", "schedule", "closures"],
    group: "navigate",
  },
  {
    id: "go-booking",
    title: "Go to Booking rules",
    subtitle: "Business setup → Booking",
    href: "/dashboard/business?tab=booking",
    keywords: ["booking", "rules", "policies", "interval", "cancellation"],
    group: "navigate",
  },
  {
    id: "go-taxes",
    title: "Go to Taxes",
    subtitle: "Business setup → Taxes",
    href: "/dashboard/business?tab=taxes",
    keywords: ["taxes", "tax", "gst", "hst", "vat"],
    group: "navigate",
  },
  {
    id: "go-booking-notifications",
    title: "Go to Booking notifications",
    subtitle: "Business setup event templates",
    href: "/dashboard/business?tab=notifications",
    keywords: ["booking notifications", "templates", "reminders"],
    group: "navigate",
  },
  {
    id: "go-business-rules",
    title: "Go to Business rules",
    subtitle: "Business setup automation rules",
    href: "/dashboard/business?tab=automation",
    keywords: ["business rules", "automation rules", "hub automation"],
    group: "navigate",
  },
  {
    id: "go-integrations",
    title: "Go to Integrations",
    subtitle: "Connected tools",
    href: "/dashboard/integrations",
    keywords: ["integrations", "connect", "calendar", "stripe"],
    group: "navigate",
  },
];

export function matchCommandRegistry(query: string): CommandDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMAND_REGISTRY;
  return COMMAND_REGISTRY.filter((cmd) => {
    const hay = [cmd.title, cmd.subtitle ?? "", ...cmd.keywords]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
