import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  APPLY_HREF,
  CONTACT_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  CTA_LOGIN_LABEL,
  CTA_MEET_SUMMER_LABEL,
  CTA_START_WITH_SUMMER_LABEL,
  DEMO_HREF,
  INDUSTRIES_HREF,
  LOGIN_HREF,
  MEET_SUMMER_HREF,
  PLATFORM_HREF,
  PRICING_HREF,
  PRIVATE_ALPHA_HREF,
  PRODUCT_TOUR_HREF,
  ROADMAP_HREF,
  SECURITY_HREF,
} from "@/lib/marketing/alpha";
import { NAV_LINKS, NAV_RESOURCES, NAV_SUPPORT_HREF } from "@/lib/constants";
import { MARKETING_PLANS } from "@/lib/marketing/pricing";

describe("primary CTA destinations", () => {
  it("uses the canonical CTA purposes", () => {
    expect(CTA_APPLY_LABEL).toBe("Apply for Private Alpha");
    expect(CTA_MEET_SUMMER_LABEL).toBe("Meet Summer");
    expect(CTA_START_WITH_SUMMER_LABEL).toBe("Start with Summer");
    expect(CTA_DEMO_LABEL).toBe("Schedule a Demo");
    expect(CTA_LOGIN_LABEL).toBe("Log in");
  });

  it("routes acquisition and experience CTAs to real pages", () => {
    expect(APPLY_HREF).toBe("/apply");
    expect(MEET_SUMMER_HREF).toBe("/meet-summer");
    expect(PLATFORM_HREF).toBe("/platform");
    expect(PRODUCT_TOUR_HREF).toBe("/product-tour");
    expect(INDUSTRIES_HREF).toBe("/industries");
    expect(PRICING_HREF).toBe("/pricing");
    expect(DEMO_HREF).toBe("/contact#walkthrough");
    expect(LOGIN_HREF).toBe("/login");
    expect(PRIVATE_ALPHA_HREF).toBe("/private-alpha");
    expect(ROADMAP_HREF).toBe("/roadmap");
    expect(SECURITY_HREF).toBe("/security");
    expect(CONTACT_HREF).toBe("/contact");
  });

  it("keeps primary nav destinations as real routes", () => {
    const hrefs = NAV_LINKS.map((l) => l.href);
    expect(hrefs).toEqual([
      "/",
      "/meet-summer",
      "/platform",
      "/product-tour",
      "/industries",
      "/roadmap",
      "/pricing",
    ]);
    expect(NAV_LINKS[0]?.label).toBe("Home");
    for (const href of hrefs) {
      expect(href.startsWith("/#")).toBe(false);
    }
  });

  it("keeps resources and support destinations valid", () => {
    const hrefs = NAV_RESOURCES.map((l) => l.href);
    expect(hrefs).toContain("/private-alpha");
    expect(hrefs).toContain("/security");
    expect(hrefs).toContain("/status");
    expect(NAV_SUPPORT_HREF).toBe("/contact");
  });

  it("routes pricing plan CTAs to apply or walkthrough paths", () => {
    for (const plan of MARKETING_PLANS) {
      expect(plan.href === APPLY_HREF || plan.href.startsWith("/contact")).toBe(
        true,
      );
      expect(plan.cta.toLowerCase()).not.toContain("request early access");
      if (plan.id === "enterprise") {
        expect(plan.cta.toLowerCase()).toMatch(/contact sales|schedule a demo/);
      }
    }
  });
});
describe("front door marketing pages", () => {
  it("ships homepage, platform, product tour and industries pages", () => {
    const pages = [
      "app/(marketing)/page.tsx",
      "app/(marketing)/platform/page.tsx",
      "app/(marketing)/product-tour/page.tsx",
      "app/(marketing)/industries/page.tsx",
    ];
    for (const page of pages) {
      expect(existsSync(path.join(process.cwd(), page))).toBe(true);
    }
  });
});
