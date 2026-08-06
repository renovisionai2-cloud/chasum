import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("World Class Polish & Intelligence backlog lock", () => {
  it("locks the portal review recommendations with chapter assignments", () => {
    const backlog = readFileSync(
      join(process.cwd(), "docs/WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md"),
      "utf8",
    );
    expect(backlog).toMatch(/LOCKED/);
    expect(backlog).toMatch(/World Class Polish & Intelligence Program/);
    expect(backlog).toMatch(/Visual hierarchy/);
    expect(backlog).toMatch(/Deep appointment workspace/);
    expect(backlog).toMatch(/Customer profile depth/);
    expect(backlog).toMatch(/REQUIRED BEFORE LAUNCH/);
    expect(backlog).toMatch(/FINAL POLISH/);
    expect(backlog).toMatch(/Chapter 4 not started/);
    expect(backlog).toMatch(/do not implement in this commit/i);

    const parity = readFileSync(
      join(process.cwd(), "docs/WORLD_CLASS_MARKETING_PARITY.md"),
      "utf8",
    );
    expect(parity).toMatch(/WORLD_CLASS_MARKETING_PRODUCT_PARITY/);
    expect(parity).toMatch(/Polish & Intelligence Program/);
  });
});
