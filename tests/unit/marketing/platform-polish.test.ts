import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  PLATFORM_AREA_SIGNALS,
  PLATFORM_CONCLUSION,
  PLATFORM_SHOWCASE,
  PLATFORM_STORY,
} from "@/lib/marketing/platform-page";
import {
  APPLY_HREF,
  MEET_SUMMER_HREF,
  PRODUCT_TOUR_HREF,
} from "@/lib/marketing/alpha";

describe("Platform page Final Polish", () => {
  it("centers the one intelligent operating system story", () => {
    expect(PLATFORM_STORY.headline).toMatch(/one intelligent operating system/i);
    expect(PLATFORM_STORY.lede).toMatch(/Business Brain/i);
    expect(PLATFORM_STORY.close).toMatch(/one memory/i);
    expect(PLATFORM_STORY.bridgeToShowcase.length).toBeGreaterThan(20);
  });

  it("embeds calm intelligence signals across current business areas", () => {
    expect(Object.keys(PLATFORM_AREA_SIGNALS)).toEqual([
      "command-centre",
      "reception",
      "customers",
      "employees",
      "payments",
      "reports",
      "communications",
      "summer",
    ]);
    expect(PLATFORM_AREA_SIGNALS["command-centre"]).toMatch(/attention/i);
    expect(PLATFORM_AREA_SIGNALS.summer).toMatch(/never invented/i);
  });

  it("closes with one OS message and explore / Summer / alpha CTAs", () => {
    expect(PLATFORM_CONCLUSION.headline).toMatch(/one platform/i);
    expect(PLATFORM_CONCLUSION.body).toMatch(/disconnected systems/i);
    expect(PLATFORM_CONCLUSION.pillars).toContain("One operating system");
    expect(PLATFORM_CONCLUSION.primaryCta.href).toBe(PRODUCT_TOUR_HREF);
    expect(PLATFORM_CONCLUSION.secondaryCta.href).toBe(MEET_SUMMER_HREF);
    expect(PLATFORM_CONCLUSION.tertiaryCta.href).toBe(APPLY_HREF);
  });

  it("wires platform-only conclusion and platform showcase mode", () => {
    const page = readFileSync(
      path.join(process.cwd(), "app/(marketing)/platform/page.tsx"),
      "utf8",
    );
    expect(page).toContain('mode="platform"');
    expect(page).toContain("PlatformConclusion");
    expect(page).not.toContain("PrivateAlphaInvite");

    expect(
      existsSync(
        path.join(process.cwd(), "components/landing/platform-conclusion.tsx"),
      ),
    ).toBe(true);

    const tour = readFileSync(
      path.join(process.cwd(), "app/(marketing)/product-tour/page.tsx"),
      "utf8",
    );
    expect(tour).toContain("DashboardShowcase");
    expect(tour).not.toContain('mode="platform"');
    expect(tour).toContain("ProductTourConclusion");
  });

  it("uses current-generation selector, mock IA, and chrome on Platform only", () => {
    const showcase = readFileSync(
      path.join(process.cwd(), "components/landing/dashboard-showcase.tsx"),
      "utf8",
    );
    expect(showcase).toContain('label: "Command Centre"');
    expect(showcase).toContain('label: "Reception"');
    expect(showcase).toContain('label: "Customers"');
    expect(showcase).toContain('label: "Employees"');
    expect(showcase).toContain('label: "Payments"');
    expect(showcase).toContain('label: "Reports"');
    expect(showcase).toContain('label: "Communications"');
    expect(showcase).toContain('label: "Summer"');
    expect(showcase).toContain('navIa={isPlatform ? "current" : "legacy"}');
    expect(showcase).toContain("Chasum · ${active.label}");
    expect(showcase).not.toContain('isPlatform ? "Chasum · Business Dashboard"');
    expect(showcase).toContain("Illustrative demo data · not a live tenant");

    expect(PLATFORM_SHOWCASE.headline).toMatch(/every part of your business/i);
    expect(PLATFORM_SHOWCASE.lede).toMatch(/Choose an area/i);

    const tourShowcaseStart = showcase.indexOf("const SHOWCASE_TABS");
    const platformShowcaseStart = showcase.indexOf("const PLATFORM_SHOWCASE_TABS");
    const tourBlock = showcase.slice(tourShowcaseStart, platformShowcaseStart);
    expect(tourBlock).toContain('label: "Dashboard"');
    expect(tourBlock).toContain('label: "CRM"');
    expect(tourBlock).toContain('label: "Billing"');
    expect(tourBlock).toContain('name: "Business Dashboard"');
  });

  it("composes hero capabilities as a compact two-column list", () => {
    const overview = readFileSync(
      path.join(process.cwd(), "components/landing/platform-overview.tsx"),
      "utf8",
    );
    expect(PLATFORM_STORY.layers).toEqual([
      "Scheduling.",
      "Customers.",
      "Staff.",
      "Payments.",
      "Communications.",
      "Reporting.",
      "Automation.",
      "AI.",
    ]);
    expect(overview).toContain("grid-cols-2");
    expect(overview).not.toContain("flex flex-col items-center");
  });
});
