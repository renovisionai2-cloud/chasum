import { describe, expect, it } from "vitest";
import { HOMEPAGE_INDUSTRY_TILES } from "@/components/landing/homepage-industries";
import { INDUSTRIES } from "@/lib/marketing/homepage";
import {
  getIndustryImage,
  INDUSTRIES_PAGE_ORDER,
} from "@/lib/marketing/industryImages";

/** Phrases that imply Chasum replaces specialized industry software. */
const OVERCLAIM_PATTERN =
  /\b(complete industry solution|manages every aspect|replaces existing software|end-to-end platform|full industry management|electronic medical record|EMR|EHR|clinical charting|diagnostic software|legal case management|court integrations|collision estimating|OEM integrations|VIN decoding|parts ordering|inventory management|project management|takeoff software)\b/i;

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
    expect(legal?.problem).toMatch(/consultations|intake|billing|staff/i);
    expect(legal?.solution).toMatch(/consultations|client|scheduling|billing|CRM/i);
    expect(legal?.solution).not.toMatch(/case management|case updates|documents/i);
    expect(legal && "note" in legal && legal.note).toMatch(
      /legal advice|confidentiality|privacy|case management/i,
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
      /automotive service businesses/i,
    );
    expect(auto && "intro" in auto && auto.intro).toMatch(
      /appointments|communication|scheduling|CRM|payments|reporting/i,
    );
    expect(auto?.problem).toMatch(/appointments|customer|staff|follow-ups/i);
    expect(auto?.solution).toMatch(/collision|dealership|shops/i);
    expect(auto?.solution).not.toMatch(
      /estimates|repairs|inspections|vehicle history|parts/i,
    );
    expect(auto && "note" in auto && auto.note).toMatch(
      /estimating|OEM|VIN|parts|repair-order/i,
    );
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

  it("keeps Medical Clinics truth-first (operations, not EMR)", () => {
    const medical = INDUSTRIES.find(
      (industry) => industry.name === "Medical Clinics",
    );
    expect(medical && "intro" in medical && medical.intro).toMatch(
      /scheduling|communication|intake|staff/i,
    );
    expect(medical?.solution).toMatch(/scheduling|communication|intake|reminders/i);
    expect(medical?.solution).not.toMatch(/\b(EMR|EHR|charting|diagnostic)\b/i);
    expect(medical && "note" in medical && medical.note).toMatch(
      /electronic medical record|clinical/i,
    );
  });

  it("avoids specialized-software replacement claims across industries", () => {
    for (const industry of INDUSTRIES) {
      const fields = [
        industry.name,
        "intro" in industry ? industry.intro : "",
        industry.problem,
        industry.solution,
      ].join(" ");
      expect(fields, industry.name).not.toMatch(OVERCLAIM_PATTERN);
    }

    for (const tile of HOMEPAGE_INDUSTRY_TILES) {
      expect(`${tile.name} ${tile.blurb}`, tile.name).not.toMatch(
        OVERCLAIM_PATTERN,
      );
    }
  });
});
