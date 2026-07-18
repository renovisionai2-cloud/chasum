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
  | "go-summer";

export type CommandDefinition = {
  id: CommandId;
  title: string;
  subtitle?: string;
  href: string;
  keywords: string[];
  group: "actions" | "navigate";
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
    subtitle: "CRM directory",
    href: "/dashboard/clients",
    keywords: ["customer", "client", "crm", "search"],
    group: "actions",
  },
  {
    id: "search-employee",
    title: "Search Employee",
    subtitle: "Staff directory",
    href: "/dashboard/employees",
    keywords: ["employee", "staff", "team"],
    group: "actions",
  },
  {
    id: "go-calendar",
    title: "Go to Calendar",
    subtitle: "Day View Control Center",
    href: "/dashboard/calendar?view=day",
    keywords: ["calendar", "day", "reception", "schedule"],
    group: "navigate",
  },
  {
    id: "go-crm",
    title: "Go to CRM",
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
    title: "Open Settings",
    href: "/dashboard/settings",
    keywords: ["settings", "preferences"],
    group: "navigate",
  },
  {
    id: "go-overview",
    title: "Go to Overview",
    href: "/dashboard",
    keywords: ["overview", "home", "dashboard"],
    group: "navigate",
  },
  {
    id: "go-business",
    title: "Go to Business",
    href: "/dashboard/business",
    keywords: ["business", "hours", "branding"],
    group: "navigate",
  },
  {
    id: "go-summer",
    title: "Open Summer",
    subtitle: "AI Receptionist",
    href: "/dashboard/ai-workforce/summer",
    keywords: ["ai", "summer", "receptionist", "ask summer", "book"],
    group: "navigate",
  },
  {
    id: "go-ai",
    title: "Go to AI Workforce",
    subtitle: "Team roster",
    href: "/dashboard/ai-workforce",
    keywords: ["ai", "chase", "workforce", "alex"],
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
