import { describe, expect, it } from "vitest";
import { HOMEPAGE_INDUSTRY_TILES } from "@/components/landing/homepage-industries";
import {
  INDUSTRIES,
  INDUSTRIES_ALPHA_HEADLINE,
  INDUSTRIES_HERO,
  INDUSTRY_CAPABILITY_CATALOG,
  INDUSTRY_GROWING_STATEMENT,
  INDUSTRY_SUMMER_LINE,
  INDUSTRY_TYPES_PREVIEW,
} from "@/lib/marketing/industries-page";
import {
  getIndustryImage,
  INDUSTRIES_PAGE_ORDER,
} from "@/lib/marketing/industryImages";
import { readFileSync } from "node:fs";
import path from "node:path";

/** Phrases that imply Chasum replaces specialized industry software. */
const OVERCLAIM_PATTERN =
  /\b(complete industry solution|manages every aspect|replaces existing software|end-to-end platform|full industry management|electronic medical record|EMR|EHR|clinical charting|diagnostic software|legal case management|court integrations|collision estimating|OEM integrations|VIN decoding|parts ordering|inventory management|project management|takeoff software)\b/i;

/** Gap catalogs must not appear in visitor-facing industry fields. */
const MISSING_FEATURE_CATALOG =
  /\b(OEM integrations|VIN decoding|estimating|inventory|repair management|warranty processing|parts management|case management systems|legal document automation|court integrations|PACS|clinical charting)\b/i;

const LEGACY_TERMS =
  /\b(CRM|Billing|Dashboard|AI Workforce|Team Coordination|Customer Communication)\b/;

describe("Industries page world-class alignment", () => {
  it("keeps the approved Industries order and omits Education by design", () => {
    expect(INDUSTRIES.map((industry) => industry.name)).toEqual([
      ...INDUSTRIES_PAGE_ORDER,
    ]);
    expect(INDUSTRIES.map((industry) => industry.name)).not.toContain(
      "Education",
    );
    expect(INDUSTRIES[0]?.name).toBe("Medical Clinics");
    expect(INDUSTRIES[1]?.name).toBe("Legal Services");
    expect(
      HOMEPAGE_INDUSTRY_TILES.some((tile) => tile.name === "Education"),
    ).toBe(true);
  });

  it("preserves the approved hero and one-operating-system bridge", () => {
    expect(INDUSTRIES_HERO.headline).toBe(
      "Built around the way service businesses actually work.",
    );
    expect(INDUSTRIES_HERO.lede).toMatch(/workflows differ/i);
    expect(INDUSTRIES_HERO.lede).toMatch(/not a separate product/i);
    expect(INDUSTRIES_HERO.bridge).toMatch(/One platform/i);
    expect(INDUSTRIES_HERO.bridge).toMatch(/One memory/i);
    expect(INDUSTRIES_HERO.bridge).toMatch(/One intelligence/i);
  });

  it("requires intro, distinction, connect copy, and types on every industry", () => {
    for (const industry of INDUSTRIES) {
      expect(industry.intro).toMatch(/^Designed for/i);
      expect(industry.distinction.length).toBeGreaterThan(24);
      expect(industry.solution.length).toBeGreaterThan(40);
      expect(industry.solution.length).toBeLessThan(320);
      expect(industry.types.length).toBeGreaterThan(0);
      expect(industry.modules.length).toBeGreaterThan(2);
      expect(industry.modules.length).toBeLessThan(7);
    }

    const distinctions = INDUSTRIES.map((industry) => industry.distinction);
    expect(new Set(distinctions).size).toBe(distinctions.length);
    const solutions = INDUSTRIES.map((industry) => industry.solution);
    expect(new Set(solutions).size).toBe(solutions.length);
  });

  it("uses current-generation capability chips, not a generic identical set", () => {
    const moduleSets = INDUSTRIES.map((industry) => industry.modules.join("|"));
    expect(new Set(moduleSets).size).toBeGreaterThan(4);

    for (const industry of INDUSTRIES) {
      for (const mod of industry.modules) {
        expect(INDUSTRY_CAPABILITY_CATALOG, industry.name).toContain(mod);
        expect(mod).not.toMatch(LEGACY_TERMS);
      }
    }
  });

  it("keeps growing and Summer copy honest", () => {
    expect(INDUSTRY_GROWING_STATEMENT).toMatch(/same operating model/i);
    expect(INDUSTRY_GROWING_STATEMENT).not.toMatch(
      /coming next|roadmap|will launch|soon|industry intelligence/i,
    );
    expect(INDUSTRY_SUMMER_LINE).toMatch(/AI Business Manager/i);
    expect(INDUSTRY_SUMMER_LINE).toMatch(/same operating context/i);
    expect(INDUSTRY_SUMMER_LINE).toMatch(/surface what needs attention/i);
    expect(INDUSTRY_SUMMER_LINE).toMatch(/recommend what to do next/i);
    expect(INDUSTRY_SUMMER_LINE).toMatch(/remain in control/i);
    expect(INDUSTRY_SUMMER_LINE).not.toMatch(
      /AI receptionist|chatbot|autonomous execution|running the business on her own/i,
    );
  });

  it("reuses the approved Homepage Private Alpha headline on Industries only", () => {
    const homepage = readFileSync(
      path.join(process.cwd(), "app/(marketing)/page.tsx"),
      "utf8",
    );
    const industriesPage = readFileSync(
      path.join(process.cwd(), "app/(marketing)/industries/page.tsx"),
      "utf8",
    );
    expect(INDUSTRIES_ALPHA_HEADLINE).toBe(
      "Help shape the future of how service businesses operate.",
    );
    expect(homepage).toContain(INDUSTRIES_ALPHA_HEADLINE);
    expect(industriesPage).toContain("INDUSTRIES_ALPHA_HEADLINE");
    expect(industriesPage).toContain("headline={INDUSTRIES_ALPHA_HEADLINE}");
    expect(homepage).not.toContain("INDUSTRIES_ALPHA_HEADLINE");
  });

  it("places Veterinary Clinics under Pet Services only", () => {
    const medical = INDUSTRIES.find(
      (industry) => industry.name === "Medical Clinics",
    );
    const pet = INDUSTRIES.find((industry) => industry.name === "Pet Services");
    expect(medical?.types).not.toContain("Veterinary Clinics");
    expect(pet?.types[0]).toBe("Veterinary Clinics");
    const owners = INDUSTRIES.filter((industry) =>
      industry.types.includes("Veterinary Clinics"),
    ).map((industry) => industry.name);
    expect(owners).toEqual(["Pet Services"]);
  });

  it("keeps Medical Clinics representative businesses and operations-only claims", () => {
    const medical = INDUSTRIES.find(
      (industry) => industry.name === "Medical Clinics",
    );
    expect(medical?.intro).toMatch(/healthcare and wellness/i);
    expect(medical?.distinction).toMatch(/Clinical and wellness practices/i);
    expect(medical?.distinction).not.toMatch(/Care businesses/i);
    expect(medical?.solution).toMatch(/visit|provider|reminders/i);
    expect(medical?.solution).toMatch(/clinical records stay/i);
    expect(medical?.solution).not.toMatch(/patient record|EMR|EHR/i);
    expect(medical?.types).toHaveLength(11);
    expect(medical?.modules[0]).toBe("Appointment Scheduling");
  });

  it("uses industry-native scheduling labels for the same capability", () => {
    const byName = Object.fromEntries(
      INDUSTRIES.map((industry) => [industry.name, industry.modules[0]]),
    );
    expect(byName["Medical Clinics"]).toBe("Appointment Scheduling");
    expect(byName["Legal Services"]).toBe("Consultation Scheduling");
    expect(byName.Salons).toBe("Appointment Scheduling");
    expect(byName.Spas).toBe("Appointment Scheduling");
    expect(byName.Gyms).toBe("Session Scheduling");
    expect(byName["Home & Field Services"]).toBe("Job Scheduling");
    expect(byName["Automotive Services"]).toBe("Service Scheduling");
    expect(byName["Professional Services"]).toBe("Consultation Scheduling");
    expect(byName["Photography & Creative"]).toBe("Session Scheduling");
    expect(byName["Pet Services"]).toBe("Appointment Scheduling");
    expect(byName.Cleaning).toBe("Job Scheduling");
  });

  it("preserves the full source taxonomy while previewing 8 types", () => {
    expect(INDUSTRY_TYPES_PREVIEW).toBe(8);
    const auto = INDUSTRIES.find(
      (industry) => industry.name === "Automotive Services",
    );
    const legal = INDUSTRIES.find(
      (industry) => industry.name === "Legal Services",
    );
    const home = INDUSTRIES.find(
      (industry) => industry.name === "Home & Field Services",
    );
    expect(auto?.types).toHaveLength(12);
    expect(legal?.types).toHaveLength(10);
    expect(home?.types).toHaveLength(9);

    const source = readFileSync(
      path.join(process.cwd(), "components/landing/industries.tsx"),
      "utf8",
    );
    expect(source).toContain("INDUSTRY_TYPES_PREVIEW");
    expect(source).toContain("typesExpanded");
    expect(source).toContain("+ ${hiddenTypeCount} more");
  });

  it("keeps industry product-boundary statements", () => {
    const byName = Object.fromEntries(
      INDUSTRIES.map((industry) => [industry.name, industry.solution]),
    );
    expect(byName["Medical Clinics"]).toMatch(/Clinical records stay/i);
    expect(byName["Legal Services"]).toMatch(
      /Practice-management and filing systems stay/i,
    );
    expect(byName["Home & Field Services"]).toMatch(
      /Quoting and route-planning tools stay separate/i,
    );
    expect(byName["Automotive Services"]).toMatch(
      /Shop-management and manufacturer systems stay separate/i,
    );
    expect(byName["Professional Services"]).toMatch(
      /not specialized compliance software/i,
    );
    expect(byName["Photography & Creative"]).toMatch(
      /not a separate studio-management product/i,
    );
    expect(byName["Pet Services"]).toMatch(
      /Veterinary clinics still need their clinical systems/i,
    );
    expect(byName.Cleaning).toMatch(/Route-planning tools stay separate/i);
  });

  it("keeps Legal Services practice areas without case-management claims", () => {
    const legal = INDUSTRIES.find((industry) => industry.name === "Legal Services");
    expect(legal?.intro).toMatch(/legal practices/i);
    expect(legal?.solution).toMatch(/consultation|client records|communications/i);
    expect(legal?.solution).not.toMatch(
      /case management|document automation|court integrations/i,
    );
    expect(legal?.types).toHaveLength(10);
    expect(legal?.modules[0]).toBe("Consultation Scheduling");
  });

  it("keeps Automotive Services types without estimating/repair-system claims", () => {
    const auto = INDUSTRIES.find(
      (industry) => industry.name === "Automotive Services",
    );
    expect(auto?.intro).toMatch(/automotive service businesses/i);
    expect(auto?.solution).toMatch(/appointments|history|schedules/i);
    expect(auto?.solution).not.toMatch(
      /estimat|repair management|inventory|OEM|VIN|warranty|parts/i,
    );
    expect(auto?.types).toHaveLength(12);
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
        industry.intro,
        industry.distinction,
        industry.solution,
        ...industry.modules,
      ].join(" ");
      expect(fields, industry.name).not.toMatch(OVERCLAIM_PATTERN);
      expect(fields, industry.name).not.toMatch(MISSING_FEATURE_CATALOG);
      expect(fields, industry.name).not.toMatch(LEGACY_TERMS);
    }

    expect(INDUSTRY_GROWING_STATEMENT).not.toMatch(OVERCLAIM_PATTERN);
    expect(INDUSTRIES_HERO.lede).not.toMatch(OVERCLAIM_PATTERN);
  });

  it("uses keyboard-accessible tabs on the Industries selector", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/landing/industries.tsx"),
      "utf8",
    );
    expect(source).toContain('role="tablist"');
    expect(source).toContain('role="tab"');
    expect(source).toContain("aria-selected");
    expect(source).toContain("ArrowRight");
    expect(source).toContain("tabIndex={selected ? 0 : -1}");
    expect(source).not.toContain('from "@/lib/marketing/homepage"');
  });
});
