export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview", icon: "layout-dashboard" },
  { href: "/dashboard/calendar", label: "Reception", icon: "calendar" },
  { href: "/dashboard/clients", label: "CRM", icon: "users" },
  { href: "/dashboard/payments", label: "Payments", icon: "banknote" },
  { href: "/dashboard/services", label: "Services", icon: "briefcase" },
  { href: "/dashboard/business", label: "Business", icon: "building-2" },
  { href: "/dashboard/employees", label: "Employees", icon: "user-cog" },
  { href: "/dashboard/reports", label: "Reports", icon: "bar-chart-3" },
  { href: "/dashboard/ai-workforce", label: "AI Workforce", icon: "sparkles" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "bell" },
  { href: "/dashboard/integrations", label: "Integrations", icon: "plug" },
  { href: "/dashboard/automation", label: "Automation", icon: "repeat" },
  { href: "/dashboard/developer", label: "Developer", icon: "code" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
] as const;

export const APP_NAME = "Chasum";

/** Primary desktop navigation — Front Door order */
export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/meet-summer", label: "Meet Summer" },
  { href: "/platform", label: "Platform" },
  { href: "/product-tour", label: "Product Tour" },
  { href: "/industries", label: "Industries" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/pricing", label: "Pricing" },
] as const;

/** Resources dropdown */
export const NAV_RESOURCES = [
  {
    href: "/private-alpha",
    label: "Why Private Alpha?",
    description: "Design partner program",
  },
  {
    href: "/security",
    label: "Security",
    description: "Safeguards implemented today",
  },
  {
    href: "/status",
    label: "Status",
    description: "Service availability",
  },
] as const;

export const NAV_SUPPORT_HREF = "/contact";

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;
