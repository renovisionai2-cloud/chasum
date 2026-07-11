export const APP_NAME = "Chasum";

export const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
] as const;

export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview", icon: "layout-dashboard" },
  { href: "/dashboard/appointments", label: "Appointments", icon: "calendar" },
  { href: "/dashboard/clients", label: "Clients", icon: "users" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
] as const;
