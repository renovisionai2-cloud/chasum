import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("World Class environment separation discovery lock", () => {
  it("records discovery-only staging/production split without connecting Preview", () => {
    const doc = readFileSync(
      join(process.cwd(), "docs/WORLD_CLASS_ENVIRONMENT_SEPARATION_DISCOVERY.md"),
      "utf8",
    );
    expect(doc).toMatch(/Discovery \*\*only\*\*/);
    expect(doc).toMatch(/Chasum Staging/);
    expect(doc).toMatch(/Replay repository migrations `001`–`033`/);
    expect(doc).toMatch(/034 \/ 035 \/ 036/);
    expect(doc).toMatch(/Whether Preview should be connected yet/);
    expect(doc).toMatch(/\*\*NO\*\*/);
    expect(doc).toMatch(/Chasum HQ tenant/);
    expect(doc).toMatch(/NOT CREATED/);
    expect(doc).toMatch(/Phase 6\.3 implementation/);
    expect(doc).toMatch(/NOT STARTED/);
    expect(doc).toMatch(/Phase 6\.4/);
    expect(doc).toMatch(/DB impact from this discovery/);
    expect(doc).toMatch(/NONE/);
    expect(doc).toMatch(/Do not copy Production GVM/);
    expect(doc).not.toMatch(/apply this migration now/i);
  });
});
