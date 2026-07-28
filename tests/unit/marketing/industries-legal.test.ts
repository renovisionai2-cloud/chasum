import { describe, expect, it } from "vitest";
import { HOMEPAGE_INDUSTRY_TILES } from "@/components/landing/homepage-industries";
import { INDUSTRIES } from "@/lib/marketing/homepage";
import {
  getIndustryImage,
  INDUSTRIES_PAGE_ORDER,
} from "@/lib/marketing/industryImages";

describe("Industries editorial photography system", () => {
  it("keeps Legal Services second in the approved Industries order", () => {
    expect(INDUSTRIES.map((industry) => industry.name)).toEqual([
      ...INDUSTRIES_PAGE_ORDER,
    ]);
    expect(INDUSTRIES[0]?.name).toBe("Medical Clinics");
    expect(INDUSTRIES[1]?.name).toBe("Legal Services");
  });

  it("keeps Legal Services copy required for the category", () => {
    const legal = INDUSTRIES.find((industry) => industry.name === "Legal Services");
    expect(legal && "intro" in legal && legal.intro).toMatch(/law firms/i);
    expect(legal?.problem).toMatch(/intake|consultations|case management/i);
    expect(legal?.solution).toMatch(/consultations|client history|payment/i);
    expect(legal && "note" in legal && legal.note).toMatch(
      /legal advice|confidentiality|privacy/i,
    );
    if (legal && "types" in legal) {
      expect(legal.types).toHaveLength(10);
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

  it("maps every industry through the shared industryImages registry", () => {
    for (const industry of INDUSTRIES) {
      const image = getIndustryImage(industry.name);
      expect(image, `missing image for ${industry.name}`).toBeDefined();
      expect(image?.hero).toMatch(/^\/marketing\/industries\/.+\.webp$/);
      expect(image?.thumbnail).toMatch(/-tile\.webp$/);
      expect(image?.alt.length).toBeGreaterThan(12);
      expect(image?.heroWidth).toBeGreaterThan(0);
      expect(image?.heroHeight).toBeGreaterThan(0);
    }

    for (const tile of HOMEPAGE_INDUSTRY_TILES) {
      const image = getIndustryImage(tile.name);
      expect(image, `missing homepage image for ${tile.name}`).toBeDefined();
    }

    // Homepage categories share the same asset paths as Industries detail.
    expect(getIndustryImage("Healthcare")?.hero).toBe(
      getIndustryImage("Medical Clinics")?.hero,
    );
    expect(getIndustryImage("Beauty & Personal Care")?.hero).toBe(
      getIndustryImage("Salons")?.hero,
    );
    expect(getIndustryImage("Fitness & Wellness")?.hero).toBe(
      getIndustryImage("Gyms")?.hero,
    );
  });

  it("includes Automotive Services with representative business types", () => {
    const auto = INDUSTRIES.find(
      (industry) => industry.name === "Automotive Services",
    );
    expect(auto).toBeDefined();
    expect(auto && "intro" in auto && auto.intro).toMatch(
      /automotive businesses/i,
    );
    expect(auto?.problem).toMatch(/estimates|bay|inspections/i);
    expect(auto?.solution).toMatch(/collision|dealership|shops/i);
    if (auto && "types" in auto) {
      expect(auto.types).toEqual(
        expect.arrayContaining([
          "Collision Repair Centres",
          "Auto Body Shops",
          "Dealership Service Departments",
          "EV Service Centres",
          "Fleet Maintenance",
        ]),
      );
      expect(auto.types).toHaveLength(12);
    }
    expect(getIndustryImage("Automotive Services")?.hero).toMatch(
      /automotive\.webp$/,
    );
  });
});
