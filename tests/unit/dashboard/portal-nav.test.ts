import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DASHBOARD_NAV,
  DASHBOARD_NAV_GROUPS,
  HQ_NAV_ITEM,
  getMobilePrimaryItems,
  getNavPath,
  getPageTitle,
  isNavItemActive,
} from "@/lib/dashboard/nav";

function group(id: string) {
  return DASHBOARD_NAV_GROUPS.find((g) => g.id === id);
}

function href(path: string) {
  return DASHBOARD_NAV.find((i) => i.href === path);
}

describe("portal navigation IA", () => {
  it("groups cover the approved World Class information architecture", () => {
    const ids = DASHBOARD_NAV_GROUPS.map((g) => g.id);
    expect(ids).toEqual([
      "today",
      "customers",
      "team",
      "catalog",
      "money",
      "operate",
      "ai",
      "business",
      "account",
      "advanced",
    ]);
  });

  it("uses Customers not CRM in primary nav", () => {
    const customers = href("/dashboard/clients");
    expect(customers?.label).toBe("Customers");
    expect(DASHBOARD_NAV.some((i) => i.label === "CRM")).toBe(false);
  });

  it("labels Reception, Business setup, and Communications correctly", () => {
    expect(href("/dashboard/calendar")?.label).toBe("Reception");
    expect(href("/dashboard/notifications")?.label).toBe("Communications");
    expect(
      DASHBOARD_NAV.find((i) => i.href === "/dashboard/business" && !i.tab)
        ?.label,
    ).toBe("Business setup");
  });

  it("places Catalog, Money, Operate, AI, Business, and Account items", () => {
    expect(group("catalog")!.items.map((i) => i.label)).toEqual([
      "Services",
      "Packages",
      "Memberships",
    ]);
    expect(group("money")!.items.map((i) => i.label)).toEqual([
      "Payments",
      "Gift Cards",
      "Discounts",
    ]);
    expect(group("operate")!.items.map((i) => i.label)).toEqual([
      "Reports",
      "Automations",
    ]);
    expect(group("ai")!.items.map((i) => i.label)).toEqual([
      "Summer",
      "Chase",
      "AI Workforce",
    ]);
    expect(group("business")!.items.map((i) => i.label)).toEqual([
      "Business setup",
      "Locations",
      "Communications",
      "Integrations",
    ]);
    expect(group("account")!.items.map((i) => i.label)).toEqual([
      "Account & billing",
    ]);
  });

  it("keeps HQ as owner-only current-main label, not Platform Admin", () => {
    expect(HQ_NAV_ITEM.ownerOnly).toBe(true);
    expect(HQ_NAV_ITEM.label).toBe("HQ");
    expect(HQ_NAV_ITEM.label).not.toBe("Platform Admin");
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
      "/dashboard/workforce/chase",
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
    const overview = href("/dashboard")!;
    const summer = href("/dashboard/ai-workforce/summer")!;
    const workforce = href("/dashboard/ai-workforce")!;
    const chase = href("/dashboard/workforce/chase")!;

    expect(isNavItemActive("/dashboard", "", overview)).toBe(true);
    expect(isNavItemActive("/dashboard/clients", "", overview)).toBe(false);
    expect(
      isNavItemActive("/dashboard/ai-workforce/summer", "", summer),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/ai-workforce/summer", "", workforce),
    ).toBe(false);
    expect(isNavItemActive("/dashboard/workforce/chase", "", chase)).toBe(true);
    expect(
      isNavItemActive("/dashboard/ai-workforce/chase", "", chase),
    ).toBe(true);
  });

  it("highlights sibling Business setup tabs without marking Business setup active", () => {
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

  it("keeps five persistent mobile destinations", () => {
    const primary = getMobilePrimaryItems();
    expect(primary.map((i) => i.label)).toEqual(
      expect.arrayContaining([
        "Command Centre",
        "Reception",
        "Customers",
        "Payments",
        "Summer",
      ]),
    );
    expect(primary).toHaveLength(5);
  });

  it("keeps the five-slot mobile bar", () => {
    const src = readFileSync(
      join(process.cwd(), "components/dashboard/mobile-bottom-nav.tsx"),
      "utf8",
    );
    expect(src).toMatch(/grid-cols-5/);
    expect(src).toMatch(/items\.slice\(0, 4\)/);
    expect(src).toMatch(/More navigation/);
  });

  it("resolves page titles with approved terminology", () => {
    expect(getPageTitle("/dashboard")).toBe("Command Centre");
    expect(getPageTitle("/dashboard/clients")).toBe("Customers");
    expect(getPageTitle("/dashboard/calendar")).toBe("Reception");
    expect(getPageTitle("/dashboard/notifications")).toBe("Communications");
    expect(getPageTitle("/dashboard/ai-workforce/summer")).toBe("Summer");
    expect(getPageTitle("/dashboard/hq")).toBe("Chasum HQ");
    expect(getPageTitle("/dashboard/settings")).toBe("Account & billing");
  });
});
