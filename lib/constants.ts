export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview", icon: "layout-dashboard" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "calendar" },
  { href: "/dashboard/clients", label: "Clients", icon: "users" },
  { href: "/dashboard/services", label: "Services", icon: "briefcase" },
  { href: "/dashboard/staff", label: "Staff", icon: "user-cog" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
] as const;

export const APP_NAME = "Chasum";

export const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
] as const;

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
