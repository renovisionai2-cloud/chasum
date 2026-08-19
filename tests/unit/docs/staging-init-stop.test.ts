import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("World Class staging init stop lock", () => {
  it("records that 001–033 were not applied because Staging was not verified", () => {
    const doc = readFileSync(
      join(process.cwd(), "docs/WORLD_CLASS_STAGING_INIT_REPORT.md"),
      "utf8",
    );
    expect(doc).toMatch(/STOPPED BEFORE SQL/);
    expect(doc).toMatch(/kxcydvhswkuzepwzzinq/);
    expect(doc).toMatch(/NOT STARTED/);
    expect(doc).toMatch(/034 \/ 035 \/ 036/);
    expect(doc).toMatch(/Preview cutover readiness/);
    expect(doc).toMatch(/\*\*NO\*\*/);
    expect(doc).toMatch(/Production data copied/);
    expect(doc).toMatch(/Chasum HQ created/);
    expect(doc).toMatch(/Phase 6\.3/);
    expect(doc).toMatch(/\.env\.staging\.local/);
  });
});
