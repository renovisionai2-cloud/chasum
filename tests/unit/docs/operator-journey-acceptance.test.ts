import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DASHBOARD_NAV, DASHBOARD_NAV_GROUPS } from "@/lib/dashboard/nav";
import { QUICK_CREATE_ACTIONS } from "@/lib/dashboard/quick-create";

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Operator-journey World Class acceptance", () => {
  it("records completeness beyond code/route/tests in the living SoT", () => {
    const state = read("docs/CURRENT_PROJECT_STATE.md");
    expect(state).toMatch(/not complete/i);
    expect(state).toMatch(/discoverable/);
    expect(state).toMatch(/reachable/);
    expect(state).toMatch(/understandable/);
    expect(state).toMatch(/usable/);
    expect(state).toMatch(/trustworthy/);
    expect(state).toMatch(/EXACT NAVIGATION PATH/);
    expect(state).toMatch(/product\/IA finding/);
    expect(state).toMatch(/WORLD_CLASS_NAVIGATION_IA_PROPOSAL/);
  });

  it("records Summer domain readiness without expanding Summer", () => {
    const summer = read("docs/ai/SUMMER_PRINCIPLE.md");
    expect(summer).toMatch(/UNDERSTAND/);
    expect(summer).toMatch(/EXPLAIN/);
    expect(summer).toMatch(/RECOMMEND/);
    expect(summer).toMatch(/ACT/);
    expect(summer).toMatch(/AUDIT/);
    expect(summer).toMatch(/governance only/i);
  });

  it("implements the approved navigation IA in nav.ts", () => {
    const proposal = read("docs/WORLD_CLASS_NAVIGATION_IA_PROPOSAL.md");
    expect(proposal).toMatch(/\*\*Status:\*\* Implemented/);
    expect(proposal).not.toMatch(/Proposal only — \*\*not implemented\*\*/);
    const nav = read("lib/dashboard/nav.ts");
    expect(nav).toContain('label: "Business setup"');
    expect(nav).toContain('href: "/dashboard/business?tab=memberships"');
    expect(nav).toContain('href: "/dashboard/business?tab=giftcards"');
    expect(nav).toContain('href: "/dashboard/workforce/chase"');
    expect(DASHBOARD_NAV_GROUPS.map((g) => g.id)).toContain("catalog");
    expect(DASHBOARD_NAV.some((i) => i.label === "Memberships")).toBe(true);
    expect(DASHBOARD_NAV.some((i) => i.label === "Packages")).toBe(true);
  });

  it("keeps Quick Create on real workflows", () => {
    expect(QUICK_CREATE_ACTIONS.map((a) => a.label)).toEqual([
      "Book appointment",
      "Add customer",
      "Record payment",
    ]);
  });
});
