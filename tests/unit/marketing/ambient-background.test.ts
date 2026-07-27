import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

describe("AmbientBackground living interface", () => {
  it("ships the reusable AmbientBackground module", () => {
    const file = path.join(
      process.cwd(),
      "components/landing/ambient-background.tsx",
    );
    expect(existsSync(file)).toBe(true);
    const source = readFileSync(file, "utf8");
    expect(source).toContain("export function AmbientBackground");
    expect(source).toContain("export function AmbientSection");
    expect(source).toContain('aria-hidden');
  });

  it("wires ambient motion on the homepage only for Phase 1", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/(marketing)/page.tsx"),
      "utf8",
    );
    expect(source).toContain("AmbientSection");
    expect(source).toContain('variant="hero"');
    expect(source).toContain('variant="dawn"');
  });

  it("disables ambient orb animation under prefers-reduced-motion", () => {
    const css = readFileSync(
      path.join(process.cwd(), "app/globals.css"),
      "utf8",
    );
    expect(css).toContain(".ambient-bg__orb");
    expect(css).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]*\.ambient-bg__orb/,
    );
  });
});
