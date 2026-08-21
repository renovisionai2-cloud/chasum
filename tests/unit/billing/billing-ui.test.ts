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
    expect(src).toMatch(/Location scheduling rules/);
    expect(src).toMatch(/These settings apply only to/);
    expect(src).toMatch(/Change business-wide defaults/);
    expect(src).toMatch(/updateLocationSettings/);
    expect(src).toMatch(/locationSchedulingFormRevision/);
    expect(src).not.toMatch(/updateBusinessBookingSettings/);
  });

  it("keeps the Business page booking panel on the business-default action", () => {
    const src = read("components/business/booking-settings-panel.tsx");
    expect(src).toMatch(/updateBusinessBookingSettings/);
    expect(src).toMatch(/Save booking settings/);
    expect(src).toMatch(/Manage location overrides/);
    expect(src).toMatch(/businessBookingFormRevision/);
    expect(src).not.toMatch(/useRefresh\(\)/);
  });

  it("does not let location Settings update the business interval", () => {
    const src = read("lib/actions/location.ts");
    expect(src).not.toMatch(/interval-sync/);
    expect(src).not.toMatch(/propagateInheritedBookingInterval/);
    expect(src).toMatch(/Location scheduling settings updated/);
    const updateFn = src.slice(src.indexOf("export async function updateLocationSettings"));
    expect(updateFn).not.toMatch(/from\("businesses"\)/);
    expect(updateFn).not.toMatch(/\.in\(/);
  });
});

describe("Billing reactivation honesty", () => {
  it("keeps mock reactivation behind the same paid-subscription guard", () => {
    const provider = read("lib/billing/subscription-service.ts");
    expect(provider).toMatch(/NO_REACTIVATABLE_SUBSCRIPTION_MESSAGE/);
    expect(provider).toMatch(/showSubscriptionLifecycleControls/);
    const action = read("lib/actions/billing.ts");
    expect(action).toMatch(/NO_REACTIVATABLE_SUBSCRIPTION_MESSAGE/);
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
