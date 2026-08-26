import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  PRODUCT_TOUR_CONCLUSION,
  PRODUCT_TOUR_INTRO,
  PRODUCT_TOUR_JOURNEY,
  PRODUCT_TOUR_SHOWCASE,
  PRODUCT_TOUR_STOPS,
} from "@/lib/marketing/product-tour-page";
import { APPLY_HREF, MEET_SUMMER_HREF } from "@/lib/marketing/alpha";

const CURRENT_AREAS = [
  "Command Centre",
  "Reception",
  "Customers",
  "Employees",
  "Payments",
  "Reports",
  "Communications",
  "Summer",
] as const;

describe("Product Tour Final Polish", () => {
  it("leads every journey stop with why before how", () => {
    expect(PRODUCT_TOUR_JOURNEY.length).toBe(7);
    expect(PRODUCT_TOUR_JOURNEY.map((stop) => stop.title)).toEqual([
      "Appointment requested",
      "Availability confirmed",
      "Customer record updated",
      "Confirmation and reminder",
      "Service completed",
      "Payment recorded",
      "Reports updated",
    ]);
    for (const stop of PRODUCT_TOUR_JOURNEY) {
      expect(stop.why.length).toBeGreaterThan(12);
      expect(stop.detail.length).toBeGreaterThan(12);
      expect(["Recommendation", "Insight", "Observation", "Suggestion"]).toContain(
        stop.moment.kind,
      );
    }
  });

  it("embeds quiet AI moments across current operating areas", () => {
    const kinds = new Set(
      Object.values(PRODUCT_TOUR_STOPS).map((s) => s.moment.kind),
    );
    expect(kinds.has("Recommendation")).toBe(true);
    expect(kinds.has("Insight")).toBe(true);
    expect(kinds.has("Observation")).toBe(true);
    expect(kinds.has("Suggestion")).toBe(true);
    expect(PRODUCT_TOUR_STOPS["command-centre"]?.why).toMatch(/attention/i);
    expect(Object.keys(PRODUCT_TOUR_STOPS)).toEqual(
      expect.arrayContaining([
        "command-centre",
        "reception",
        "customers",
        "employees",
        "payments",
        "reports",
        "communications",
        "summer",
      ]),
    );
    expect(PRODUCT_TOUR_STOPS).not.toHaveProperty("dashboard");
    expect(PRODUCT_TOUR_STOPS).not.toHaveProperty("crm");
    expect(PRODUCT_TOUR_STOPS).not.toHaveProperty("billing");
  });

  it("uses area language rather than department copy", () => {
    expect(PRODUCT_TOUR_INTRO.bridgeToShowcase).toMatch(/area/i);
    expect(PRODUCT_TOUR_INTRO.bridgeToShowcase).not.toMatch(/department/i);
    expect(PRODUCT_TOUR_SHOWCASE.lede).toMatch(/Choose an area/i);
    expect(PRODUCT_TOUR_SHOWCASE.lede).not.toMatch(/department/i);
    expect(PRODUCT_TOUR_INTRO.headline).toBe(
      "One customer journey. One connected record.",
    );
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

  it("ships a calm living journey pulse with reduced-motion safety", () => {
    const journey = readFileSync(
      path.join(process.cwd(), "components/landing/customer-journey.tsx"),
      "utf8",
    );
    expect(journey).toContain("pt-journey-pulse");
    expect(journey).toContain("PRODUCT_TOUR_INTRO.headline");

    const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain("@keyframes pt-journey-flow");
    expect(css).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]*\.pt-journey-pulse/,
    );
  });

  it("uses current-generation selector, mock IA, chrome, and honesty on Product Tour", () => {
    const showcase = readFileSync(
      path.join(process.cwd(), "components/landing/dashboard-showcase.tsx"),
      "utf8",
    );
    for (const label of CURRENT_AREAS) {
      expect(showcase).toContain(`label: "${label}"`);
    }
    expect(showcase).not.toContain('label: "Dashboard"');
    expect(showcase).not.toContain('label: "CRM"');
    expect(showcase).not.toContain('label: "Billing"');
    expect(showcase).not.toContain('label: "AI Workforce"');
    expect(showcase).toContain('navIa="current"');
    expect(showcase).toContain("Chasum · ${active.label}");
    expect(showcase).toContain("Illustrative demo data · not a live tenant");
    expect(showcase).toContain("Your last selected area is remembered.");
    expect(showcase).not.toContain("Your selected department is remembered");
    expect(showcase).not.toContain("aria-label={isPlatform ? \"Business areas\" : \"Departments\"}");
  });
});
