export { DASHBOARD_NAV } from "@/lib/dashboard/nav";

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
    description: "Why join Chasum now",
  },
  {
    href: "/security",
    label: "Security",
    description: "Why you can trust Chasum",
  },
  {
    href: "/status",
    label: "Status",
    description: "Can I rely on Chasum?",
  },
] as const;

export const NAV_SUPPORT_HREF = "/contact";

export {
  TIMEZONES,
  TIMEZONE_OPTIONS,
  timezoneLabel,
  filterTimezoneOptions,
  withSavedTimezone,
} from "@/lib/constants/timezones";
