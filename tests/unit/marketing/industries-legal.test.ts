import { describe, expect, it } from "vitest";
import { HOMEPAGE_INDUSTRY_TILES } from "@/components/landing/homepage-industries";
import {
  CORE_CHASUM_CAPABILITIES,
  INDUSTRIES,
  INDUSTRY_GROWING_STATEMENT,
} from "@/lib/marketing/homepage";
import {
  getIndustryImage,
  INDUSTRIES_PAGE_ORDER,
} from "@/lib/marketing/industryImages";

/** Phrases that imply Chasum replaces specialized industry software. */
const OVERCLAIM_PATTERN =
  /\b(complete industry solution|manages every aspect|replaces existing software|end-to-end platform|full industry management|electronic medical record|EMR|EHR|clinical charting|diagnostic software|legal case management|court integrations|collision estimating|OEM integrations|VIN decoding|parts ordering|inventory management|project management|takeoff software)\b/i;

/** Gap catalogs must not appear in visitor-facing industry fields. */
const MISSING_FEATURE_CATALOG =
  /\b(OEM integrations|VIN decoding|estimating|inventory|repair management|warranty processing|parts management|case management systems|legal document automation|court integrations|PACS|clinical charting)\b/i;

describe("Industries final content framework", () => {
  it("keeps the approved Industries order", () => {
    expect(INDUSTRIES.map((industry) => industry.name)).toEqual([
      ...INDUSTRIES_PAGE_ORDER,
    ]);
    expect(INDUSTRIES[0]?.name).toBe("Medical Clinics");
    expect(INDUSTRIES[1]?.name).toBe("Legal Services");
  });

  it("requires Designed-for intro, Helps Today solution, and types on every industry", () => {
    for (const industry of INDUSTRIES) {
      expect(
        "intro" in industry && industry.intro,
        `${industry.name} missing intro`,
      ).toBeTruthy();
      expect(industry.intro).toMatch(/^Designed for/i);
      expect(
        "types" in industry && industry.types?.length,
        `${industry.name} missing types`,
      ).toBeGreaterThan(0);
      expect(industry.solution).toMatch(/Chasum helps/i);
      expect(industry.solution).not.toMatch(/continue to evolve/i);
      expect("problem" in industry, industry.name).toBe(false);
    }
  });

  it("uses one shared Growing with Your Business statement", () => {
    expect(INDUSTRY_GROWING_STATEMENT).toMatch(
      /expand industry-specific intelligence/i,
    );
    expect(INDUSTRY_GROWING_STATEMENT).toMatch(
      /AI Business Operating System/i,
    );
    expect(INDUSTRY_GROWING_STATEMENT).not.toMatch(
      /coming next|roadmap|will launch|soon/i,
    );
  });

  it("uses shared Core Chasum Capabilities across every industry", () => {
    expect([...CORE_CHASUM_CAPABILITIES]).toEqual([
      "AI Receptionist",
      "Appointment Scheduling",
      "Customer Communication",
      "CRM",
      "Team Coordination",
      "Payments",
      "Business Reporting",
      "Business Memory",
      "Multi-location Support",
    ]);

    for (const industry of INDUSTRIES) {
      expect(industry.modules, industry.name).toEqual([
        ...CORE_CHASUM_CAPABILITIES,
      ]);
    }
  });

  it("keeps Medical Clinics representative businesses and operations-only claims", () => {
    const medical = INDUSTRIES.find(
      (industry) => industry.name === "Medical Clinics",
    );
    expect(medical && "intro" in medical && medical.intro).toMatch(
      /healthcare and wellness/i,
    );
    expect(medical?.solution).toMatch(
      /appointment scheduling|CRM|reminders|communication|team|payments|reporting/i,
    );
    expect(medical?.solution).not.toMatch(/\b(EMR|EHR|PACS|charting)\b/i);
    if (medical && "types" in medical) {
      expect(medical.types).toHaveLength(12);
    }
  });

  it("keeps Legal Services practice areas without case-management claims", () => {
    const legal = INDUSTRIES.find((industry) => industry.name === "Legal Services");
    expect(legal && "intro" in legal && legal.intro).toMatch(/legal practices/i);
    expect(legal?.solution).toMatch(/consultations|appointments|CRM|billing/i);
    expect(legal?.solution).not.toMatch(
      /case management|document automation|court integrations/i,
    );
    if (legal && "types" in legal) {
      expect(legal.types).toHaveLength(10);
    }
  });

  it("keeps Automotive Services types without estimating/repair-system claims", () => {
    const auto = INDUSTRIES.find(
      (industry) => industry.name === "Automotive Services",
    );
    expect(auto && "intro" in auto && auto.intro).toMatch(
      /automotive service businesses/i,
    );
    expect(auto?.solution).toMatch(
      /appointment scheduling|communication|CRM|team|payments|reporting/i,
    );
    expect(auto?.solution).not.toMatch(
      /estimat|repair management|inventory|OEM|VIN|warranty|parts/i,
    );
    if (auto && "types" in auto) {
      expect(auto.types).toHaveLength(12);
    }
  });

  it("maps every industry through the shared industryImages registry", () => {
    for (const industry of INDUSTRIES) {
      const image = getIndustryImage(industry.name);
      expect(image, `missing image for ${industry.name}`).toBeDefined();
      expect(image?.hero).toMatch(/^\/marketing\/industries\/.+\.webp$/);
      expect(image?.thumbnail).toMatch(/-tile\.webp$/);
    }

    for (const tile of HOMEPAGE_INDUSTRY_TILES) {
      expect(getIndustryImage(tile.name), tile.name).toBeDefined();
      expect(tile.blurb).toMatch(/^Designed for/i);
    }
  });

  it("avoids specialized-software replacement claims and missing-feature catalogs", () => {
    for (const industry of INDUSTRIES) {
      const fields = [
        industry.name,
        "intro" in industry ? industry.intro : "",
        industry.solution,
        ...industry.modules,
      ].join(" ");
      expect(fields, industry.name).not.toMatch(OVERCLAIM_PATTERN);
      expect(fields, industry.name).not.toMatch(MISSING_FEATURE_CATALOG);
    }

    expect(INDUSTRY_GROWING_STATEMENT).not.toMatch(OVERCLAIM_PATTERN);
    expect(INDUSTRY_GROWING_STATEMENT).not.toMatch(MISSING_FEATURE_CATALOG);
  });
});
