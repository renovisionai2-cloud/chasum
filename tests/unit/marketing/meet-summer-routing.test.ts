import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  APPLY_HREF,
  CTA_MEET_SUMMER_LABEL,
  MEET_SUMMER_HREF,
} from "@/lib/marketing/alpha";
import { PLATFORM_MODULES } from "@/lib/marketing/homepage";
import { NAV_RESOURCES } from "@/lib/constants";

describe("Meet Summer routing", () => {
  it("exposes a dedicated /meet-summer destination distinct from /apply", () => {
    expect(MEET_SUMMER_HREF).toBe("/meet-summer");
    expect(APPLY_HREF).toBe("/apply");
    expect(MEET_SUMMER_HREF).not.toBe(APPLY_HREF);
  });

  it("ships the Phase 3 Meet Summer page", () => {
    const page = path.join(
      process.cwd(),
      "app/(marketing)/meet-summer/page.tsx",
    );
    expect(existsSync(page)).toBe(true);
  });

  it("routes platform Summer CTA to Meet Summer, not Apply", () => {
    const summer = PLATFORM_MODULES.find((m) => m.id === "summer");
    expect(summer?.cta).toBe(CTA_MEET_SUMMER_LABEL);
    expect(summer?.ctaHref).toBe(MEET_SUMMER_HREF);
  });

  it("includes Meet Summer in marketing resource nav", () => {
    const link = NAV_RESOURCES.find((item) => item.label === "Meet Summer");
    expect(link?.href).toBe(MEET_SUMMER_HREF);
  });
});
