import { describe, expect, it } from "vitest";
import {
  APPLY_HREF,
  CONTACT_HREF,
  CTA_APPLY_LABEL,
  CTA_DEMO_LABEL,
  CTA_LOGIN_LABEL,
  CTA_MEET_SUMMER_LABEL,
  CTA_START_WITH_SUMMER_LABEL,
  DEMO_HREF,
  LOGIN_HREF,
  MEET_SUMMER_HREF,
  PRIVATE_ALPHA_HREF,
  ROADMAP_HREF,
  SECURITY_HREF,
} from "@/lib/marketing/alpha";
import { NAV_LINKS, NAV_RESOURCES } from "@/lib/constants";
import { MARKETING_PLANS } from "@/lib/marketing/pricing";

describe("primary CTA destinations", () => {
  it("uses the canonical CTA purposes", () => {
    expect(CTA_APPLY_LABEL).toBe("Apply for Private Alpha");
    expect(CTA_MEET_SUMMER_LABEL).toBe("Meet Summer");
    expect(CTA_START_WITH_SUMMER_LABEL).toBe("Start with Summer");
    expect(CTA_DEMO_LABEL).toBe("Book a Walkthrough");
    expect(CTA_LOGIN_LABEL).toBe("Log in");
  });

  it("routes acquisition and experience CTAs to real pages", () => {
    expect(APPLY_HREF).toBe("/apply");
    expect(MEET_SUMMER_HREF).toBe("/meet-summer");
    expect(DEMO_HREF).toBe("/contact#walkthrough");
    expect(LOGIN_HREF).toBe("/login");
    expect(PRIVATE_ALPHA_HREF).toBe("/private-alpha");
    expect(ROADMAP_HREF).toBe("/roadmap");
    expect(SECURITY_HREF).toBe("/security");
    expect(CONTACT_HREF).toBe("/contact");
  });

  it("keeps primary nav destinations valid", () => {
    const hrefs = [...NAV_LINKS, ...NAV_RESOURCES].map((l) => l.href);
    expect(hrefs).toContain("/meet-summer");
    expect(hrefs).toContain("/roadmap");
    expect(hrefs).toContain("/#platform");
    expect(hrefs).toContain("/#pricing");
    expect(hrefs).toContain("/#how-it-works");
    expect(hrefs).toContain("/private-alpha");
    expect(hrefs).toContain("/security");
    expect(hrefs).toContain("/contact");
  });

  it("routes pricing plan CTAs to apply or walkthrough paths", () => {
    for (const plan of MARKETING_PLANS) {
      expect(plan.href === APPLY_HREF || plan.href.startsWith("/contact")).toBe(
        true,
      );
      expect(plan.cta.toLowerCase()).not.toContain("contact sales");
      expect(plan.cta.toLowerCase()).not.toContain("request early access");
    }
  });
});
