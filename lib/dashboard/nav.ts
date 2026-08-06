/**
 * Portal navigation IA — World Class Chapter 1 foundation.
 * Presentation labels only; routes stay compatible with existing pages.
 */

export type DashboardNavIcon =
  | "layout-dashboard"
  | "calendar"
  | "users"
  | "banknote"
  | "briefcase"
  | "package"
  | "building-2"
  | "user-cog"
  | "bar-chart-3"
  | "sparkles"
  | "sun"
  | "bell"
  | "plug"
  | "repeat"
  | "code"
  | "settings"
  | "crown";

export type DashboardNavItem = {
  href: string;
  label: string;
  /** Shorter label for mobile bottom nav when `label` is long. */
  mobileLabel?: string;
  icon: DashboardNavIcon;
  /** Match against pathname (+ optional tab query). */
  match?: "exact" | "prefix";
  /** When set, item is active only if ?tab= matches. */
  tab?: string;
  /** Hide from primary mobile bottom bar. */
  mobilePrimary?: boolean;
  /** Owner / platform-only. */
  ownerOnly?: boolean;
  /** Shown in Advanced group; demoted for ordinary tenants. */
  advanced?: boolean;
};

export type DashboardNavGroup = {
  id: string;
  /** Group heading — omit for untitled (e.g. owner HQ strip). */
  label: string | null;
  items: DashboardNavItem[];
  /** Collapsed by default (Advanced). */
  defaultCollapsed?: boolean;
};

/**
 * Group labels chosen for small service-business owners:
 * Catalog (not “Offer”), Insights (not “Grow”), Settings (not “Configure”).
 * Command Centre label maps to `/dashboard` — page depth is Chapter 2.
 */
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "today",
    label: "Today",
    items: [
      {
        href: "/dashboard",
        label: "Command Centre",
        mobileLabel: "Centre",
        icon: "layout-dashboard",
        match: "exact",
        mobilePrimary: true,
      },
      {
        href: "/dashboard/calendar",
        label: "Reception",
        icon: "calendar",
        mobilePrimary: true,
      },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      {
        href: "/dashboard/clients",
        label: "Customers",
        icon: "users",
        mobilePrimary: true,
      },
      {
        href: "/dashboard/employees",
        label: "Employees",
        icon: "user-cog",
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      {
        href: "/dashboard/services",
        label: "Services",
        icon: "briefcase",
      },
      {
        href: "/dashboard/business?tab=packages",
        label: "Packages",
        icon: "package",
        tab: "packages",
      },
    ],
  },
  {
    id: "money",
    label: "Money",
    items: [
      {
        href: "/dashboard/payments",
        label: "Payments",
        icon: "banknote",
        mobilePrimary: true,
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        href: "/dashboard/reports",
        label: "Reports",
        icon: "bar-chart-3",
      },
      {
        href: "/dashboard/automation",
        label: "Automations",
        icon: "repeat",
      },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      {
        href: "/dashboard/ai-workforce/summer",
        label: "Summer",
        icon: "sun",
        mobilePrimary: true,
      },
      {
        href: "/dashboard/ai-workforce",
        label: "AI Workforce",
        icon: "sparkles",
        match: "exact",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      {
        href: "/dashboard/business",
        label: "Business",
        icon: "building-2",
      },
      {
        href: "/dashboard/integrations",
        label: "Integrations",
        icon: "plug",
      },
      {
        href: "/dashboard/settings",
        label: "Account & billing",
        icon: "settings",
      },
      {
        href: "/dashboard/notifications",
        label: "Communications",
        icon: "bell",
      },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    defaultCollapsed: true,
    items: [
      {
        href: "/dashboard/developer",
        label: "Developer",
        icon: "code",
        advanced: true,
      },
    ],
  },
];

export const HQ_NAV_ITEM: DashboardNavItem = {
  href: "/dashboard/hq",
  label: "HQ",
  icon: "crown",
  ownerOnly: true,
};

/** Flat list for legacy imports / title lookup. */
export const DASHBOARD_NAV: DashboardNavItem[] = DASHBOARD_NAV_GROUPS.flatMap(
  (g) => g.items,
);

export function getNavPath(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

export function isNavItemActive(
  pathname: string,
  search: string,
  item: DashboardNavItem,
): boolean {
  const path = getNavPath(item.href);
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const tab = item.tab ?? null;

  if (item.match === "exact" || path === "/dashboard") {
    if (path === "/dashboard") return pathname === "/dashboard";
    if (path === "/dashboard/ai-workforce") {
      return (
        pathname === "/dashboard/ai-workforce" ||
        (pathname.startsWith("/dashboard/ai-workforce/") &&
          !pathname.startsWith("/dashboard/ai-workforce/summer") &&
          !pathname.startsWith("/dashboard/ai-workforce/chase") &&
          !pathname.startsWith("/dashboard/ai-workforce/command"))
      );
    }
    return pathname === path;
  }

  if (tab) {
    if (!(pathname === path || pathname.startsWith(`${path}/`))) return false;
    return params.get("tab") === tab;
  }

  // Business root: active only when not on a Catalog-specific tab.
  if (path === "/dashboard/business") {
    if (!(pathname === path || pathname.startsWith(`${path}/`))) return false;
    const t = params.get("tab");
    if (t === "packages" || t === "memberships") return false;
    return true;
  }

  // Summer should win over AI Workforce prefix.
  if (path === "/dashboard/ai-workforce/summer") {
    return (
      pathname === path || pathname.startsWith("/dashboard/ai-workforce/summer")
    );
  }

  if (path === "/dashboard/settings") {
    return (
      pathname === path || pathname.startsWith("/dashboard/settings/")
    );
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

export function getPageTitle(pathname: string, search = ""): string {
  if (pathname.startsWith("/dashboard/hq/private-alpha")) {
    return "Private Alpha";
  }
  if (pathname.startsWith("/dashboard/hq")) return "Chasum HQ";
  if (pathname.startsWith("/dashboard/workforce/chase")) return "Chase";
  if (pathname.startsWith("/dashboard/ai-workforce/command")) {
    return "AI Command";
  }
  if (pathname.startsWith("/dashboard/settings/billing")) {
    return "Billing";
  }

  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  if (pathname.startsWith("/dashboard/business") && params.get("tab") === "packages") {
    return "Packages";
  }

  for (const item of [HQ_NAV_ITEM, ...DASHBOARD_NAV]) {
    if (isNavItemActive(pathname, search, item)) return item.label;
  }
  return "Dashboard";
}

export function getMobilePrimaryItems(): DashboardNavItem[] {
  return DASHBOARD_NAV.filter((i) => i.mobilePrimary);
}

/** Operational routes that should use the full content width. */
export function isWidePortalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard/calendar") ||
    pathname.startsWith("/dashboard/clients") ||
    pathname.startsWith("/dashboard/payments") ||
    pathname.startsWith("/dashboard/employees") ||
    pathname.startsWith("/dashboard/reports") ||
    pathname.startsWith("/dashboard/services") ||
    pathname === "/dashboard"
  );
}
