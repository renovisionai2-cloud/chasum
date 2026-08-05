import { describe, expect, it } from "vitest";
import {
  DASHBOARD_NAV,
  DASHBOARD_NAV_GROUPS,
  HQ_NAV_ITEM,
  getMobilePrimaryItems,
  getNavPath,
  getPageTitle,
  isNavItemActive,
  isWidePortalPath,
} from "@/lib/dashboard/nav";

describe("portal navigation IA", () => {
  it("groups cover the Phase 1 information architecture", () => {
    const ids = DASHBOARD_NAV_GROUPS.map((g) => g.id);
    expect(ids).toEqual([
      "today",
      "people",
      "catalog",
      "money",
      "insights",
      "intelligence",
      "settings",
      "advanced",
    ]);
  });

  it("uses Customers not CRM in primary nav", () => {
    const customers = DASHBOARD_NAV.find((i) => i.href === "/dashboard/clients");
    expect(customers?.label).toBe("Customers");
    expect(DASHBOARD_NAV.some((i) => i.label === "CRM")).toBe(false);
  });

  it("labels Reception and Communications correctly", () => {
    expect(
      DASHBOARD_NAV.find((i) => i.href === "/dashboard/calendar")?.label,
    ).toBe("Reception");
    expect(
      DASHBOARD_NAV.find((i) => i.href === "/dashboard/notifications")?.label,
    ).toBe("Communications");
  });

  it("places Developer only in Advanced (collapsed by default)", () => {
    const advanced = DASHBOARD_NAV_GROUPS.find((g) => g.id === "advanced");
    expect(advanced?.defaultCollapsed).toBe(true);
    expect(advanced?.items.some((i) => i.href === "/dashboard/developer")).toBe(
      true,
    );
    const primary = DASHBOARD_NAV_GROUPS.filter((g) => g.id !== "advanced");
    expect(
      primary.some((g) =>
        g.items.some((i) => i.href === "/dashboard/developer"),
      ),
    ).toBe(false);
  });

  it("keeps HQ as owner-only and out of default groups", () => {
    expect(HQ_NAV_ITEM.ownerOnly).toBe(true);
    expect(
      DASHBOARD_NAV_GROUPS.some((g) =>
        g.items.some((i) => i.href === "/dashboard/hq"),
      ),
    ).toBe(false);
  });

  it("preserves existing route compatibility", () => {
    const hrefs = DASHBOARD_NAV.map((i) => getNavPath(i.href));
    for (const path of [
      "/dashboard",
      "/dashboard/calendar",
      "/dashboard/clients",
      "/dashboard/payments",
      "/dashboard/services",
      "/dashboard/business",
      "/dashboard/employees",
      "/dashboard/reports",
      "/dashboard/ai-workforce",
      "/dashboard/ai-workforce/summer",
      "/dashboard/notifications",
      "/dashboard/integrations",
      "/dashboard/automation",
      "/dashboard/developer",
      "/dashboard/settings",
    ]) {
      expect(hrefs).toContain(path);
    }
  });

  it("highlights active routes and Summer vs AI Workforce", () => {
    const overview = DASHBOARD_NAV.find((i) => i.href === "/dashboard")!;
    const reception = DASHBOARD_NAV.find(
      (i) => i.href === "/dashboard/calendar",
    )!;
    const summer = DASHBOARD_NAV.find(
      (i) => i.href === "/dashboard/ai-workforce/summer",
    )!;
    const workforce = DASHBOARD_NAV.find(
      (i) => i.href === "/dashboard/ai-workforce",
    )!;

    expect(isNavItemActive("/dashboard", "", overview)).toBe(true);
    expect(isNavItemActive("/dashboard/clients", "", overview)).toBe(false);
    expect(isNavItemActive("/dashboard/calendar", "", reception)).toBe(true);
    expect(
      isNavItemActive("/dashboard/ai-workforce/summer", "", summer),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/ai-workforce/summer", "", workforce),
    ).toBe(false);
  });

  it("highlights Packages tab without marking Business active", () => {
    const packages = DASHBOARD_NAV.find((i) => i.tab === "packages")!;
    const business = DASHBOARD_NAV.find(
      (i) => i.href === "/dashboard/business" && !i.tab,
    )!;
    expect(
      isNavItemActive("/dashboard/business", "tab=packages", packages),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/business", "tab=packages", business),
    ).toBe(false);
    expect(isNavItemActive("/dashboard/business", "tab=hours", business)).toBe(
      true,
    );
  });

  it("exposes a focused mobile primary set including Summer flag", () => {
    const primary = getMobilePrimaryItems();
    expect(primary.map((i) => i.label)).toEqual(
      expect.arrayContaining([
        "Overview",
        "Reception",
        "Customers",
        "Payments",
        "Summer",
      ]),
    );
  });

  it("marks operational paths as wide layout", () => {
    expect(isWidePortalPath("/dashboard/calendar")).toBe(true);
    expect(isWidePortalPath("/dashboard/clients/abc")).toBe(true);
    expect(isWidePortalPath("/dashboard/settings")).toBe(false);
  });

  it("resolves page titles with terminology", () => {
    expect(getPageTitle("/dashboard/clients")).toBe("Customers");
    expect(getPageTitle("/dashboard/calendar")).toBe("Reception");
    expect(getPageTitle("/dashboard/notifications")).toBe("Communications");
    expect(getPageTitle("/dashboard/ai-workforce/summer")).toBe("Summer");
    expect(getPageTitle("/dashboard/hq")).toBe("Chasum HQ");
  });
});
