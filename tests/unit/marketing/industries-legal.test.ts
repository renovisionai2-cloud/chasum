import { describe, expect, it } from "vitest";
import { INDUSTRIES } from "@/lib/marketing/homepage";

describe("Industries Legal Services expansion", () => {
  it("includes Legal Services with representative practice types", () => {
    const legal = INDUSTRIES.find((industry) => industry.name === "Legal Services");
    expect(legal).toBeDefined();
    expect(legal?.solution).toMatch(/law firms/i);
    expect(legal?.problem).toMatch(/consultations|intake|billing/i);
    expect("types" in (legal ?? {}) && legal && "types" in legal).toBe(true);
    if (legal && "types" in legal) {
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
      expect(legal.types).toHaveLength(10);
    }
    expect(legal?.modules.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps Legal Services consistent with the shared industry card shape", () => {
    for (const industry of INDUSTRIES) {
      expect(industry.name.length).toBeGreaterThan(2);
      expect(industry.problem.length).toBeGreaterThan(20);
      expect(industry.solution.length).toBeGreaterThan(20);
      expect(industry.modules.length).toBeGreaterThan(0);
      expect(industry.status).toMatch(/Private Alpha/i);
    }
  });
});
