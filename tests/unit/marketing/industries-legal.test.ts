import { describe, expect, it } from "vitest";
import { HOMEPAGE_INDUSTRY_TILES } from "@/components/landing/homepage-industries";
import { INDUSTRIES } from "@/lib/marketing/homepage";
import {
  getHomepageIndustryTileVisual,
  getIndustryDetailVisual,
  HOMEPAGE_INDUSTRY_TILE_VISUALS,
  INDUSTRY_DETAIL_VISUALS,
} from "@/lib/marketing/industry-visuals";

const APPROVED_ORDER = [
  "Medical Clinics",
  "Legal Services",
  "Salons",
  "Spas",
  "Gyms",
  "Automotive",
  "Home & Field Services",
  "Photography & Creative",
  "Pet Services",
  "Cleaning",
  "Professional Services",
] as const;

describe("Industries Legal Services + premium visuals", () => {
  it("keeps the approved industry order with Legal Services second", () => {
    expect(INDUSTRIES.map((industry) => industry.name)).toEqual([
      ...APPROVED_ORDER,
    ]);
    expect(INDUSTRIES[0]?.name).toBe("Medical Clinics");
    expect(INDUSTRIES[1]?.name).toBe("Legal Services");
  });

  it("includes Legal Services content required by the visual sprint", () => {
    const legal = INDUSTRIES.find((industry) => industry.name === "Legal Services");
    expect(legal).toBeDefined();
    expect(legal && "intro" in legal && legal.intro).toMatch(/law firms/i);
    expect(legal?.problem).toMatch(/intake|consultations|case management/i);
    expect(legal?.solution).toMatch(/consultations|client history|payment/i);
    expect(legal && "note" in legal && legal.note).toMatch(
      /legal advice|confidentiality|privacy/i,
    );
    if (legal && "types" in legal) {
      expect(legal.types).toHaveLength(10);
      expect(legal.types).toEqual(
        expect.arrayContaining([
          "Family Law",
          "Personal Injury",
          "Criminal Defence",
          "Immigration Law",
          "Real Estate Law",
          "Corporate Law",
          "Estate Planning",
          "Employment Law",
          "Civil Litigation",
          "General Practice",
        ]),
      );
    }
    expect(legal?.modules).toEqual(
      expect.arrayContaining([
        "Scheduling & Reception",
        "CRM",
        "Team & Locations",
        "Communication",
        "Payments",
        "Commerce & Reporting",
      ]),
    );
  });

  it("keeps every industry card shape consistent", () => {
    for (const industry of INDUSTRIES) {
      expect(industry.name.length).toBeGreaterThan(2);
      expect(industry.problem.length).toBeGreaterThan(20);
      expect(industry.solution.length).toBeGreaterThan(20);
      expect(industry.modules.length).toBeGreaterThan(0);
      expect(industry.status).toMatch(/Private Alpha/i);
      expect(getIndustryDetailVisual(industry.name)?.src).toMatch(
        /^\/marketing\/industries\/.+\.webp$/,
      );
    }
  });

  it("maps local WebP assets for detail and homepage tiles", () => {
    expect(Object.keys(INDUSTRY_DETAIL_VISUALS)).toHaveLength(APPROVED_ORDER.length);
    for (const name of APPROVED_ORDER) {
      const visual = getIndustryDetailVisual(name);
      expect(visual?.src.startsWith("/marketing/industries/")).toBe(true);
      expect(visual?.tileSrc.endsWith("-tile.webp")).toBe(true);
      expect(visual?.alt.length).toBeGreaterThan(12);
      expect(visual?.width).toBeGreaterThan(0);
      expect(visual?.height).toBeGreaterThan(0);
    }

    for (const tile of HOMEPAGE_INDUSTRY_TILES) {
      const visual = getHomepageIndustryTileVisual(tile.name);
      expect(visual, `missing tile visual for ${tile.name}`).toBeDefined();
      expect(visual?.tileSrc).toMatch(/-tile\.webp$/);
    }

    expect(HOMEPAGE_INDUSTRY_TILE_VISUALS["Legal Services"]).toBeDefined();
    expect(HOMEPAGE_INDUSTRY_TILES.some((t) => t.name === "Legal Services")).toBe(
      true,
    );
  });

  it("does not fold Legal Services only under Professional Services on homepage", () => {
    const names = HOMEPAGE_INDUSTRY_TILES.map((tile) => tile.name);
    expect(names).toContain("Legal Services");
    expect(names).toContain("Professional Services");
    expect(names.indexOf("Legal Services")).toBeLessThan(
      names.indexOf("Professional Services"),
    );
  });
});
