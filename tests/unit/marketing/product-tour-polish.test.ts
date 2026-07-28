import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  PRODUCT_TOUR_CONCLUSION,
  PRODUCT_TOUR_JOURNEY,
  PRODUCT_TOUR_STOPS,
} from "@/lib/marketing/product-tour-page";
import { APPLY_HREF, MEET_SUMMER_HREF } from "@/lib/marketing/alpha";

describe("Product Tour Final Polish", () => {
  it("leads every journey stop with why before how", () => {
    expect(PRODUCT_TOUR_JOURNEY.length).toBe(7);
    for (const stop of PRODUCT_TOUR_JOURNEY) {
      expect(stop.why.length).toBeGreaterThan(12);
      expect(stop.detail.length).toBeGreaterThan(12);
      expect(["Recommendation", "Insight", "Observation", "Suggestion"]).toContain(
        stop.moment.kind,
      );
    }
  });

  it("embeds quiet AI moments across tour departments", () => {
    const kinds = new Set(
      Object.values(PRODUCT_TOUR_STOPS).map((s) => s.moment.kind),
    );
    expect(kinds.has("Recommendation")).toBe(true);
    expect(kinds.has("Insight")).toBe(true);
    expect(kinds.has("Observation")).toBe(true);
    expect(kinds.has("Suggestion")).toBe(true);
    expect(PRODUCT_TOUR_STOPS.dashboard?.why).toMatch(/attention/i);
  });

  it("closes with desire for the OS and Private Alpha / Meet Summer CTAs", () => {
    expect(PRODUCT_TOUR_CONCLUSION.desire).toMatch(/operating system running my business/i);
    expect(PRODUCT_TOUR_CONCLUSION.primaryCta.href).toBe(APPLY_HREF);
    expect(PRODUCT_TOUR_CONCLUSION.secondaryCta.href).toBe(MEET_SUMMER_HREF);
  });

  it("wires tour conclusion and tour showcase mode on the page", () => {
    const page = readFileSync(
      path.join(process.cwd(), "app/(marketing)/product-tour/page.tsx"),
      "utf8",
    );
    expect(page).toContain('mode="tour"');
    expect(page).toContain("ProductTourConclusion");
    expect(page).not.toContain("PrivateAlphaInvite");
    expect(
      existsSync(
        path.join(process.cwd(), "components/landing/product-tour-conclusion.tsx"),
      ),
    ).toBe(true);
  });
});
