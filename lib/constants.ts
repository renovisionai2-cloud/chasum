export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview", icon: "layout-dashboard" },
  { href: "/dashboard/calendar", label: "Reception", icon: "calendar" },
  { href: "/dashboard/clients", label: "CRM", icon: "users" },
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

/** Primary enterprise navigation anchors */
export const NAV_LINKS = [
  { href: "/#platform", label: "Platform" },
  { href: "/#showcase", label: "Product" },
  { href: "/#industries", label: "Solutions" },
  { href: "/#stories", label: "Customers" },
  { href: "/#pricing", label: "Pricing" },
] as const;

/** Resources mega-menu — scales as Chasum grows */
export const NAV_RESOURCES = [
  {
    href: "/#ai-workforce",
    label: "AI Workforce",
    description: "Meet Emma and the expanding team",
  },
  {
    href: "/#journey",
    label: "How it works",
    description: "One connected customer journey",
  },
  {
    href: "/#compare",
    label: "Compare",
    description: "See how Chasum stacks up",
  },
  {
    href: "/#faq",
    label: "FAQ",
    description: "Straight answers about the product",
  },
] as const;

export const NAV_SUPPORT_HREF =
  "mailto:sales@chasum.app?subject=Chasum%20Support";

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
