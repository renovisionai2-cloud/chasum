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

describe("Industries final lock — structure and truth-first copy", () => {
  it("keeps the approved Industries order", () => {
    expect(INDUSTRIES.map((industry) => industry.name)).toEqual([
      ...INDUSTRIES_PAGE_ORDER,
    ]);
    expect(INDUSTRIES[0]?.name).toBe("Medical Clinics");
    expect(INDUSTRIES[1]?.name).toBe("Legal Services");
  });

  it("requires Designed-for intro, types, and evolving-future solution on every industry", () => {
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
      expect(industry.solution).toMatch(/Today,? Chasum helps/i);
      expect(industry.solution).toMatch(/continue to evolve/i);
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
      /appointment scheduling|CRM|reminders|communication|staff|payments|reporting/i,
    );
    expect(medical?.solution).not.toMatch(/\b(EMR|EHR|PACS|charting)\b/i);
    expect(medical && "note" in medical && medical.note).toMatch(
      /EMR|EHR|PACS|clinical/i,
    );
    if (medical && "types" in medical) {
      expect(medical.types).toEqual(
        expect.arrayContaining([
          "Family Medical Clinics",
          "Private Ultrasound Clinics",
          "3D/4D/5D Baby Ultrasound Studios",
          "Diagnostic Imaging Clinics",
          "Dental Clinics",
          "Veterinary Clinics",
        ]),
      );
      expect(medical.types).toHaveLength(12);
    }
  });

  it("keeps Legal Services practice areas without case-management claims", () => {
    const legal = INDUSTRIES.find((industry) => industry.name === "Legal Services");
    expect(legal && "intro" in legal && legal.intro).toMatch(/legal practices/i);
    expect(legal?.problem).toMatch(/consultations|intake|billing|team/i);
    expect(legal?.solution).toMatch(/consultations|appointments|CRM|billing/i);
    expect(legal?.solution).not.toMatch(
      /case management|document automation|court integrations/i,
    );
    expect(legal && "note" in legal && legal.note).toMatch(
      /legal advice|case management|court integrations/i,
    );
    if (legal && "types" in legal) {
      expect(legal.types).toEqual([
        "Family Law",
        "Criminal Defence",
        "Personal Injury",
        "Immigration Law",
        "Real Estate Law",
        "Estate Planning",
        "Employment Law",
        "Corporate Law",
        "Civil Litigation",
        "General Practice",
      ]);
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
      /appointment scheduling|communication|CRM|staff|payments|reporting/i,
    );
    expect(auto?.solution).not.toMatch(
      /estimat|repair management|inventory|OEM|VIN|warranty|parts/i,
    );
    expect(auto && "note" in auto && auto.note).toMatch(
      /estimating|inventory|OEM|VIN|warranty|parts/i,
    );
    if (auto && "types" in auto) {
      expect(auto.types).toHaveLength(12);
      expect(auto.types).toEqual(
        expect.arrayContaining([
          "Collision Repair Centres",
          "Dealership Service Departments",
          "EV Service Centres",
          "Fleet Maintenance",
        ]),
      );
    }
  });

  it("keeps Home & Field and Professional representative businesses", () => {
    const home = INDUSTRIES.find(
      (industry) => industry.name === "Home & Field Services",
    );
    const pro = INDUSTRIES.find(
      (industry) => industry.name === "Professional Services",
    );
    if (home && "types" in home) {
      expect(home.types).toEqual(
        expect.arrayContaining([
          "General Contractors",
          "Electricians",
          "Plumbers",
          "HVAC",
        ]),
      );
    }
    expect(home?.solution).not.toMatch(/\b(takeoff|project management)\b/i);
    if (pro && "types" in pro) {
      expect(pro.types).toEqual(
        expect.arrayContaining([
          "Accountants",
          "Financial Advisors",
          "Consultants",
          "Architects",
        ]),
      );
    }
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
      expect(tile.blurb).toMatch(/^Designed for/i);
    }

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

  it("avoids specialized-software replacement claims across public industry fields", () => {
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
