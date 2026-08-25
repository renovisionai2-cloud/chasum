import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  refusePaidPlanChange,
  refuseTenantSelfServePlanMutation,
  TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE,
} from "@/lib/billing/paid-upgrade-guard";
import {
  isOwnerAssignablePlanKey,
  privateAlphaStatusLabel,
  productPlanKeyForNewBusiness,
  publicPlanName,
} from "@/lib/billing/private-alpha-plan";

describe("Phase 4A signup product plan", () => {
  it("keeps Professional preference on Free / starter", () => {
    expect(productPlanKeyForNewBusiness("professional")).toBe("starter");
    expect(productPlanKeyForNewBusiness("business")).toBe("starter");
    expect(productPlanKeyForNewBusiness("enterprise")).toBe("starter");
    expect(productPlanKeyForNewBusiness("free")).toBe("starter");
    expect(productPlanKeyForNewBusiness(null)).toBe("starter");
  });

  it("does not write preferred_plan into subscription_plan_key on tenant create", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/actions/business.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/marketingPlanIdToDbKey/);
    expect(source).not.toMatch(/preferred_plan/);
    expect(source).not.toMatch(
      /update\(\{\s*subscription_plan_key:/,
    );
  });

  it("still stores signup plan as auth metadata only", () => {
    const source = readFileSync(join(process.cwd(), "lib/actions/auth.ts"), "utf8");
    expect(source).toMatch(/preferred_plan:/);
  });
});

describe("Phase 4A canonical plan display", () => {
  it("renders starter as Free", () => {
    expect(publicPlanName("starter")).toBe("Free");
    expect(publicPlanName("free")).toBe("Free");
  });

  it("keeps Private Alpha distinct from product plan", () => {
    expect(privateAlphaStatusLabel(true)).toBe("Enabled");
    expect(privateAlphaStatusLabel(false)).toBe("Off");
    expect(publicPlanName("starter")).not.toBe("Professional");
  });
});

describe("Phase 4A tenant self-serve lock", () => {
  it("locks mock tenant plan mutations", () => {
    expect(
      refuseTenantSelfServePlanMutation({ providerName: "mock" }),
    ).toBe(TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE);
  });

  it("does not lock a future Stripe provider", () => {
    expect(
      refuseTenantSelfServePlanMutation({ providerName: "stripe" }),
    ).toBeNull();
  });

  it("still refuses paid mock provider changes", () => {
    expect(
      refusePaidPlanChange({
        providerName: "mock",
        planKey: "professional",
      }),
    ).not.toBeNull();
  });
});

describe("Phase 4A owner allowlist", () => {
  it("allows starter and professional only", () => {
    expect(isOwnerAssignablePlanKey("starter")).toBe(true);
    expect(isOwnerAssignablePlanKey("professional")).toBe(true);
    expect(isOwnerAssignablePlanKey("business")).toBe(false);
    expect(isOwnerAssignablePlanKey("enterprise")).toBe(false);
  });
});
