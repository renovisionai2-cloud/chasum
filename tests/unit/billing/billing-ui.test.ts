import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FREE_PLAN_UPGRADE_CTA } from "@/lib/marketing/pricing";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Settings scheduling rules path", () => {
  it("uses the location scheduling action, not the business booking panel action", () => {
    const src = read("components/settings/settings-manager.tsx");
    expect(src).toMatch(/Save scheduling rules/);
    expect(src).toMatch(/updateLocationSettings/);
    expect(src).not.toMatch(/updateBusinessBookingSettings/);
  });

  it("keeps the Business page booking panel on the business-default action", () => {
    const src = read("components/business/booking-settings-panel.tsx");
    expect(src).toMatch(/updateBusinessBookingSettings/);
    expect(src).toMatch(/Save booking settings/);
  });
});

describe("Billing UI honesty", () => {
  it("hides cancel controls unless a paid subscription is cancellable", () => {
    const src = read("components/billing/billing-manager.tsx");
    expect(src).toMatch(/showSubscriptionLifecycleControls/);
    expect(src).toMatch(/Cancel at period end/);
  });

  it("does not present the header CTA as an immediate paid upgrade", () => {
    expect(FREE_PLAN_UPGRADE_CTA).toBe("Apply for Professional");
    const switcher = read("components/dashboard/location-switcher.tsx");
    expect(switcher).toMatch(/FREE_PLAN_UPGRADE_CTA/);
    const modal = read("components/marketing/upgrade-to-professional-modal.tsx");
    expect(modal).toMatch(/Apply for Professional/);
    expect(modal).toMatch(/\/apply/);
    expect(modal).not.toMatch(/title="Upgrade to Professional"/);
  });
});
