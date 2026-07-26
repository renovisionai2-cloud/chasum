import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("homepage accessibility smoke", () => {
  it("keeps a single H1 on the front door page", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/(marketing)/page.tsx"),
      "utf8",
    );
    // Home composes sections; Hero owns the only H1.
    expect(source).toContain("<Hero />");
    expect(source).not.toMatch(/<h1[\s>]/);
  });

  it("hero uses one H1 and reduced-motion-aware entrance classes", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/landing/hero.tsx"),
      "utf8",
    );
    const h1Count = (source.match(/<h1[\s>]/g) ?? []).length;
    expect(h1Count).toBe(1);
    expect(source).toContain('id="hero-heading"');
    expect(source).toContain("fd-hero-enter");
  });

  it("decorative connection visual is hidden from assistive tech", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/landing/trusted-platform.tsx"),
      "utf8",
    );
    expect(source).toContain('aria-hidden');
  });
});
