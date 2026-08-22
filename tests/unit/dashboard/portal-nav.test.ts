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
  isWidePortalPath,
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
    expect(
      DASHBOARD_NAV.some(
        (i) => i.href === "/dashboard/business" && i.label === "Business",
      ),
    ).toBe(false);
    expect(DASHBOARD_NAV.some((i) => i.label === "Business Hub")).toBe(false);
  });

  it("places Memberships and Packages in Catalog without collapsing them", () => {
    const catalog = group("catalog")!;
    expect(catalog.items.map((i) => i.label)).toEqual([
      "Services",
      "Packages",
      "Memberships",
    ]);
    expect(
      catalog.items.find((i) => i.label === "Memberships")?.href,
    ).toBe("/dashboard/business?tab=memberships");
    expect(
      catalog.items.find((i) => i.label === "Packages")?.href,
    ).toBe("/dashboard/business?tab=packages");
  });

  it("places Gift Cards and Discounts in Money", () => {
    const money = group("money")!;
    expect(money.items.map((i) => i.label)).toEqual([
      "Payments",
      "Gift Cards",
      "Discounts",
    ]);
    expect(href("/dashboard/business?tab=giftcards")?.href).toBe(
      "/dashboard/business?tab=giftcards",
    );
    expect(href("/dashboard/business?tab=discounts")?.href).toBe(
      "/dashboard/business?tab=discounts",
    );
  });

  it("places Chase in AI without adding extra workers", () => {
    const ai = group("ai")!;
    expect(ai.items.map((i) => i.label)).toEqual([
      "Summer",
      "Chase",
      "AI Workforce",
    ]);
    expect(href("/dashboard/workforce/chase")?.href).toBe(
      "/dashboard/workforce/chase",
    );
    expect(DASHBOARD_NAV.some((i) => /maya|leo|sophia/i.test(i.label))).toBe(
      false,
    );
  });

  it("places Locations, Communications, and Integrations under Business", () => {
    const business = group("business")!;
    expect(business.items.map((i) => i.label)).toEqual([
      "Business setup",
      "Locations",
      "Communications",
      "Integrations",
    ]);
    expect(
      business.items.find((i) => i.label === "Locations")?.href,
    ).toBe("/dashboard/business?tab=locations");
  });

  it("does not dump configuration extras into the sidebar", () => {
    const labels = DASHBOARD_NAV.map((i) => i.label);
    for (const forbidden of [
      "Taxes",
      "Rooms & Resources",
      "Rooms & resources",
      "Categories",
      "Custom Forms",
      "Custom forms",
      "Booking notifications",
      "Business rules",
      "Branding",
      "Documents",
    ]) {
      expect(labels).not.toContain(forbidden);
    }
  });

  it("places Developer only in Advanced (collapsed by default)", () => {
    const advanced = group("advanced");
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
    expect(HQ_NAV_ITEM.label).toBe("Platform Admin");
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
    const reception = href("/dashboard/calendar")!;
    const summer = href("/dashboard/ai-workforce/summer")!;
    const workforce = href("/dashboard/ai-workforce")!;
    const chase = href("/dashboard/workforce/chase")!;

    expect(isNavItemActive("/dashboard", "", overview)).toBe(true);
    expect(isNavItemActive("/dashboard/clients", "", overview)).toBe(false);
    expect(isNavItemActive("/dashboard/calendar", "", reception)).toBe(true);
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
    expect(
      isNavItemActive("/dashboard/ai-workforce/chase", "", workforce),
    ).toBe(false);
  });

  it("highlights sibling Business setup tabs without marking Business setup active", () => {
    const packages = DASHBOARD_NAV.find((i) => i.tab === "packages")!;
    const memberships = DASHBOARD_NAV.find((i) => i.tab === "memberships")!;
    const giftCards = DASHBOARD_NAV.find((i) => i.tab === "giftcards")!;
    const discounts = DASHBOARD_NAV.find((i) => i.tab === "discounts")!;
    const locations = DASHBOARD_NAV.find((i) => i.tab === "locations")!;
    const business = DASHBOARD_NAV.find(
      (i) => i.href === "/dashboard/business" && !i.tab,
    )!;

    expect(
      isNavItemActive("/dashboard/business", "tab=packages", packages),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/business", "tab=packages", business),
    ).toBe(false);
    expect(
      isNavItemActive("/dashboard/business", "tab=memberships", memberships),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/business", "tab=giftcards", giftCards),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/business", "tab=discounts", discounts),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/business", "tab=locations", locations),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/business", "tab=locations", business),
    ).toBe(false);
    expect(isNavItemActive("/dashboard/business", "tab=hours", business)).toBe(
      true,
    );
  });

  it("keeps five persistent mobile destinations with Summer filtered from the bar data flag", () => {
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
    expect(
      primary.find((i) => i.href === "/dashboard")?.mobileLabel,
    ).toBe("Centre");
    expect(primary.some((i) => i.label === "Memberships")).toBe(false);
    expect(primary.some((i) => i.label === "Gift Cards")).toBe(false);
    expect(primary.some((i) => i.label === "Discounts")).toBe(false);
    expect(primary.some((i) => i.label === "Chase")).toBe(false);
    expect(primary.some((i) => i.label === "Locations")).toBe(false);
  });

  it("keeps the five-slot mobile bar and exposes groups through More", () => {
    const src = readFileSync(
      join(process.cwd(), "components/dashboard/mobile-bottom-nav.tsx"),
      "utf8",
    );
    expect(src).toMatch(/grid-cols-5/);
    expect(src).toMatch(/items\.slice\(0, 4\)/);
    expect(src).toMatch(/ai-workforce\/summer/);
    expect(src).toMatch(/More navigation/);
    expect(src).toMatch(/Keep five slots/);
  });

  it("marks operational paths as wide layout", () => {
    expect(isWidePortalPath("/dashboard/calendar")).toBe(true);
    expect(isWidePortalPath("/dashboard/clients/abc")).toBe(true);
    expect(isWidePortalPath("/dashboard/settings")).toBe(false);
  });

  it("resolves page titles with terminology", () => {
    expect(getPageTitle("/dashboard")).toBe("Command Centre");
    expect(getPageTitle("/dashboard/clients")).toBe("Customers");
    expect(getPageTitle("/dashboard/calendar")).toBe("Reception");
    expect(getPageTitle("/dashboard/notifications")).toBe("Communications");
    expect(getPageTitle("/dashboard/ai-workforce/summer")).toBe("Summer");
    expect(getPageTitle("/dashboard/workforce/chase")).toBe("Chase");
    expect(getPageTitle("/dashboard/business")).toBe("Business setup");
    expect(getPageTitle("/dashboard/business", "tab=memberships")).toBe(
      "Memberships",
    );
    expect(getPageTitle("/dashboard/business", "tab=giftcards")).toBe(
      "Gift Cards",
    );
    expect(getPageTitle("/dashboard/hq")).toBe("Platform Admin");
    expect(HQ_NAV_ITEM.label).toBe("Platform Admin");
  });
});
