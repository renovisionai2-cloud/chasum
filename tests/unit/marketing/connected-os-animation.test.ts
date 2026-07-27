import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

describe("ConnectedOperatingSystemAnimation signature experience", () => {
  it("ships the reusable signature animation component", () => {
    const file = path.join(
      process.cwd(),
      "components/landing/connected-operating-system-animation.tsx",
    );
    expect(existsSync(file)).toBe(true);
    const source = readFileSync(file, "utf8");
    expect(source).toContain("export function ConnectedOperatingSystemAnimation");
    expect(source).toContain("aria-hidden");
    expect(source).toContain("animateMotion");
    expect(source).toContain("prefers-reduced-motion");
  });

  it("is wired into the disconnected-business section only", () => {
    const trusted = readFileSync(
      path.join(process.cwd(), "components/landing/trusted-platform.tsx"),
      "utf8",
    );
    expect(trusted).toContain("ConnectedOperatingSystemAnimation");
    expect(trusted).toContain("Every business is already full of software.");

    const homepage = readFileSync(
      path.join(process.cwd(), "app/(marketing)/page.tsx"),
      "utf8",
    );
    expect(homepage).toContain("TrustedPlatform");

    const summer = readFileSync(
      path.join(process.cwd(), "components/landing/summer-intro.tsx"),
      "utf8",
    );
    expect(summer).not.toContain("ConnectedOperatingSystemAnimation");
  });

  it("disables signature pulses under prefers-reduced-motion", () => {
    const css = readFileSync(
      path.join(process.cwd(), "app/globals.css"),
      "utf8",
    );
    expect(css).toContain(".cos-pulse-dot");
    expect(css).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]*\.cos-pulse-dot/,
    );
  });
});
