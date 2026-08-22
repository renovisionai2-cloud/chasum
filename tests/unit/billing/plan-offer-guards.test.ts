import { describe, expect, it } from "vitest";
import {
  LOCKED_OFFER_IMMUTABLE_FIELDS,
  LOCKED_OFFER_MUTABLE_FLAGS,
  assertOfferAssignment,
  assertOfferLifecycle,
  canAssignOfferId,
  canMutateLockedPayload,
  canUnlockOffer,
} from "@/lib/billing/plan-offer-guards";
import {
  MICROS_PER_CENT,
  isSubCentMicros,
  usdMajorAndRemainder,
} from "@/lib/billing/usage-cost";

describe("offer lifecycle guards", () => {
  it("rejects draft default and draft active-for-sale", () => {
    expect(
      assertOfferLifecycle({
        isLocked: false,
        isDefaultForNew: true,
        isActiveForNewSales: true,
      }),
    ).toMatch(/draft offers cannot be default/);
    expect(
      assertOfferLifecycle({
        isLocked: false,
        isDefaultForNew: false,
        isActiveForNewSales: true,
      }),
    ).toMatch(/draft offers cannot be active/);
  });

  it("requires default to also be active and locked", () => {
    expect(
      assertOfferLifecycle({
        isLocked: true,
        isDefaultForNew: true,
        isActiveForNewSales: false,
      }),
    ).toMatch(/must also be active/);
    expect(
      assertOfferLifecycle({
        isLocked: true,
        isDefaultForNew: true,
        isActiveForNewSales: true,
      }),
    ).toBeNull();
  });

  it("treats locked payload as immutable and flags as mutable", () => {
    expect(canMutateLockedPayload()).toBe(false);
    expect(canUnlockOffer()).toBe(false);
    expect(LOCKED_OFFER_IMMUTABLE_FIELDS).toContain("monthly_cents");
    expect(LOCKED_OFFER_IMMUTABLE_FIELDS).toContain("effective_from");
    expect(LOCKED_OFFER_MUTABLE_FLAGS).toEqual([
      "is_default_for_new",
      "is_active_for_new_sales",
    ]);
  });
});

describe("offer assignment by role", () => {
  const base = {
    offerIdChanging: true,
    offerId: "offer-pro-v1",
    offerLocked: true,
    offerPlanKey: "professional",
    businessPlanKey: "professional",
  };

  it("allows only service_role to assign a locked matching offer", () => {
    expect(canAssignOfferId("service_role")).toBe(true);
    expect(assertOfferAssignment({ ...base, role: "service_role" })).toBeNull();
  });

  it("blocks anonymous, primary owner, and co-owner admin (authenticated)", () => {
    expect(canAssignOfferId("anon")).toBe(false);
    expect(canAssignOfferId("authenticated")).toBe(false);
    expect(assertOfferAssignment({ ...base, role: "anon" })).toMatch(
      /trusted server role/,
    );
    expect(assertOfferAssignment({ ...base, role: "authenticated" })).toMatch(
      /trusted server role/,
    );
  });

  it("blocks draft assignment and plan_key mismatch even for service_role", () => {
    expect(
      assertOfferAssignment({
        ...base,
        role: "service_role",
        offerLocked: false,
      }),
    ).toMatch(/locked offers/);
    expect(
      assertOfferAssignment({
        ...base,
        role: "service_role",
        offerPlanKey: "business",
      }),
    ).toMatch(/must match/);
  });

  it("does not treat a null uid role as trusted — anon is not service_role", () => {
    expect(canAssignOfferId("anon")).toBe(false);
  });

  it("keeps a v1 attachment valid after a v2 offer exists (assignment identity)", () => {
    const v1 = assertOfferAssignment({
      role: "service_role",
      offerIdChanging: false,
      offerId: "pro-cad-v1",
      offerLocked: true,
      offerPlanKey: "professional",
      businessPlanKey: "professional",
    });
    expect(v1).toBeNull();
  });
});

describe("usage micro-USD", () => {
  it("does not round sub-cent AI costs to zero", () => {
    expect(isSubCentMicros(1n)).toBe(true);
    expect(isSubCentMicros(MICROS_PER_CENT - 1n)).toBe(true);
    expect(usdMajorAndRemainder(1n)).toEqual({
      dollars: 0n,
      remainderMicros: 1n,
    });
    expect(usdMajorAndRemainder(1n).remainderMicros === 0n).toBe(false);
  });
});
