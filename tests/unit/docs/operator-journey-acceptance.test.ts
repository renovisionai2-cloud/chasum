import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

  it("keeps the IA proposal unimplemented in nav.ts", () => {
    const proposal = read("docs/WORLD_CLASS_NAVIGATION_IA_PROPOSAL.md");
    expect(proposal).toMatch(/not implemented/i);
    const nav = read("lib/dashboard/nav.ts");
    expect(nav).toContain('label: "Business"');
    expect(nav).not.toContain('label: "Business setup"');
    expect(nav).not.toContain('href: "/dashboard/business?tab=memberships"');
  });
});
