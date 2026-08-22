import { describe, expect, it } from "vitest";
import {
  evaluateLocationQuota,
  evaluateStaffQuota,
  evaluateStaffSeatRequest,
  marketingLocationLimitLabel,
  marketingStaffLimitLabel,
  maxLocationsForPlan,
  maxStaffForPlan,
  STAFF_LIMIT_REACHED_CODE,
} from "@/lib/billing/plan-entitlements";
import { FALLBACK_PLANS } from "@/lib/billing/catalog";
import { PRICING_PLANS } from "@/lib/marketing/pricing";

describe("staff quota decision", () => {
  it("allows Free 0 → 1 and blocks the second", () => {
    expect(evaluateStaffQuota(0, "starter").allowed).toBe(true);
    expect(evaluateStaffQuota(1, "starter").allowed).toBe(false);
    expect(evaluateStaffQuota(1, "starter").message).toBe(
      "You've reached the 1 active staff member included in Free. Deactivate another active staff member or apply for Professional.",
    );
    expect(evaluateStaffQuota(1, "free").code).toBe(STAFF_LIMIT_REACHED_CODE);
  });

  it("allows Professional 0–2 and blocks the fourth", () => {
    expect(evaluateStaffQuota(0, "professional").allowed).toBe(true);
    expect(evaluateStaffQuota(2, "professional").allowed).toBe(true);
    expect(evaluateStaffQuota(3, "professional").allowed).toBe(false);
    expect(evaluateStaffQuota(3, "professional").message).toBe(
      "You've reached the 3 active staff members included in Professional. Deactivate another active staff member or apply for a higher plan.",
    );
  });

  it("allows Business more than 3 staff", () => {
    expect(evaluateStaffQuota(4, "business").allowed).toBe(true);
    expect(evaluateStaffQuota(50, "business").max).toBeNull();
  });

  it("leaves Enterprise unrestricted", () => {
    expect(evaluateStaffQuota(200, "enterprise").allowed).toBe(true);
    expect(maxStaffForPlan("enterprise")).toBeNull();
  });

  it("grandfathers existing over-limit rows and still blocks new adds", () => {
    const over = evaluateStaffQuota(5, "starter");
    expect(over.allowed).toBe(false);
    expect(over.currentCount).toBe(5);
    expect(over.max).toBe(1);
  });

  it("treats inactive seats as free capacity when requesting additional actives", () => {
    expect(evaluateStaffSeatRequest(0, 1, "starter").allowed).toBe(true);
    expect(evaluateStaffSeatRequest(1, 1, "starter").allowed).toBe(false);
    expect(evaluateStaffSeatRequest(3, 1, "professional").allowed).toBe(false);
    expect(evaluateStaffSeatRequest(2, 1, "professional").allowed).toBe(true);
    expect(evaluateStaffSeatRequest(3, 0, "professional").allowed).toBe(true);
    expect(evaluateStaffSeatRequest(2, 3, "professional").allowed).toBe(false);
    expect(evaluateStaffSeatRequest(1, 2, "professional").allowed).toBe(true);
  });
});

describe("location quota decision", () => {
  it("enforces Free = 1, Professional = 3, Business = 6, Enterprise unlimited", () => {
    expect(maxLocationsForPlan("starter")).toBe(1);
    expect(maxLocationsForPlan("professional")).toBe(3);
    expect(maxLocationsForPlan("business")).toBe(6);
    expect(maxLocationsForPlan("enterprise")).toBeNull();

    expect(evaluateLocationQuota(0, "starter").canAdd).toBe(true);
    expect(evaluateLocationQuota(1, "starter").canAdd).toBe(false);
    expect(evaluateLocationQuota(2, "professional").canAdd).toBe(true);
    expect(evaluateLocationQuota(3, "professional").canAdd).toBe(false);
    expect(evaluateLocationQuota(5, "business").canAdd).toBe(true);
    expect(evaluateLocationQuota(6, "business").canAdd).toBe(false);
    expect(evaluateLocationQuota(20, "enterprise").canAdd).toBe(true);
  });

  it("blocks a new Business location when the catalog cap is 6 even if a stale DB value is 10", () => {
    expect(FALLBACK_PLANS.find((p) => p.planKey === "business")?.maxLocations).toBe(
      6,
    );
    expect(evaluateLocationQuota(6, "business").canAdd).toBe(false);
    expect(evaluateLocationQuota(9, "business").canAdd).toBe(false);
  });
});

describe("marketing numeric limits match enforcement", () => {
  it("keeps Pricing staff and location labels on the canonical maxima", () => {
    const byKey = Object.fromEntries(PRICING_PLANS.map((p) => [p.planKey, p]));
    expect(byKey.starter?.features.staff_limit).toBe(
      marketingStaffLimitLabel("starter"),
    );
    expect(byKey.professional?.features.staff_limit).toBe(
      marketingStaffLimitLabel("professional"),
    );
    expect(byKey.business?.features.staff_limit).toBe(
      marketingStaffLimitLabel("business"),
    );
    expect(byKey.enterprise?.features.staff_limit).toBe(
      marketingStaffLimitLabel("enterprise"),
    );
    expect(byKey.starter?.features.location_limit).toBe(
      marketingLocationLimitLabel("starter"),
    );
    expect(byKey.professional?.features.location_limit).toBe(
      marketingLocationLimitLabel("professional"),
    );
    expect(byKey.business?.features.location_limit).toBe(
      marketingLocationLimitLabel("business"),
    );
    expect(byKey.enterprise?.features.location_limit).toBe(
      marketingLocationLimitLabel("enterprise"),
    );
    expect(byKey.business?.features.location_limit).toBe("Up to 6");
    expect(maxStaffForPlan("starter")).toBe(1);
    expect(maxStaffForPlan("professional")).toBe(3);
    expect(maxStaffForPlan("business")).toBeNull();
    expect(maxStaffForPlan("enterprise")).toBeNull();
  });
});
