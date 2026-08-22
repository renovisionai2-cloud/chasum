import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MEMBERSHIPS_PREVIEW_NOTICE,
  MEMBERSHIPS_STATUS_LABEL,
} from "@/lib/marketing/memberships-truth";
import {
  ROADMAP_AVAILABLE_TODAY,
  ROADMAP_COMING_SOON,
} from "@/lib/marketing/roadmap";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Memberships product truth", () => {
  it("keeps Memberships status as Coming Soon / Preview", () => {
    expect(MEMBERSHIPS_STATUS_LABEL).toBe("Preview / Coming Soon");
    expect(ROADMAP_COMING_SOON.cards.map((c) => c.title)).toContain(
      "Memberships",
    );
    expect(ROADMAP_AVAILABLE_TODAY.cards.map((c) => c.title)).not.toContain(
      "Memberships",
    );
  });

  it("keeps the Memberships tab present in Business Hub", () => {
    const hub = read("components/business/business-hub.tsx");
    expect(hub).toMatch(/key:\s*"memberships"/);
    expect(hub).toMatch(/label:\s*"Memberships"/);
    expect(hub).toMatch(/tab === "memberships"/);
  });

  it("shows a Preview / Coming Soon notice that does not claim a live workflow", () => {
    const hub = read("components/business/business-hub.tsx");
    expect(hub).toMatch(/MEMBERSHIPS_STATUS_LABEL/);
    expect(hub).toMatch(/MEMBERSHIPS_PREVIEW_NOTICE/);
    expect(MEMBERSHIPS_PREVIEW_NOTICE).toMatch(/preview and configuration/i);
    expect(MEMBERSHIPS_PREVIEW_NOTICE).toMatch(
      /Recurring billing is not operational yet/,
    );
    expect(MEMBERSHIPS_PREVIEW_NOTICE).toMatch(
      /redemption tracking is not operational yet/i,
    );
    expect(MEMBERSHIPS_PREVIEW_NOTICE).toMatch(
      /Booking integration is not operational yet/,
    );
    expect(MEMBERSHIPS_PREVIEW_NOTICE).not.toMatch(
      /recurring billing (is|are) (live|operational|available)/i,
    );
    expect(MEMBERSHIPS_PREVIEW_NOTICE).not.toMatch(
      /redemption (is|are) (live|operational|available)/i,
    );
    expect(MEMBERSHIPS_PREVIEW_NOTICE).not.toMatch(
      /booking integration (is|are) (live|operational|available)/i,
    );
  });

  it("keeps Packages separately Available Today", () => {
    expect(ROADMAP_AVAILABLE_TODAY.cards.map((c) => c.title)).toContain(
      "Service Packages",
    );
    const hub = read("components/business/business-hub.tsx");
    expect(hub).toMatch(/key:\s*"packages"/);
    expect(hub).toMatch(/label:\s*"Packages"/);
    const packagesTab = hub.split('tab === "packages"')[1] ?? "";
    expect(packagesTab).not.toMatch(/MEMBERSHIPS_PREVIEW_NOTICE/);
    expect(packagesTab).not.toMatch(/Preview \/ Coming Soon/);
  });
});
