import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  PLATFORM_CONCLUSION,
  PLATFORM_DEPARTMENT_SIGNALS,
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

  it("embeds calm intelligence signals across departments", () => {
    expect(Object.keys(PLATFORM_DEPARTMENT_SIGNALS).length).toBeGreaterThanOrEqual(8);
    expect(PLATFORM_DEPARTMENT_SIGNALS.dashboard).toMatch(/attention/i);
    expect(PLATFORM_DEPARTMENT_SIGNALS.summer).toMatch(/never invented/i);
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
    expect(tour).toContain("PrivateAlphaInvite");
  });
});
