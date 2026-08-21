import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ENTERPRISE_SALES_MESSAGE,
  PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE,
  refusePaidPlanChange,
} from "@/lib/billing/paid-upgrade-guard";
import { MockBillingProvider } from "@/lib/billing/subscription-service";

const getOrCreateBusiness = vi.fn();
const changePlan = vi.fn();
const getBillingProvider = vi.fn();

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
}));

vi.mock("@/lib/billing/subscription-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/billing/subscription-service")
  >("@/lib/billing/subscription-service");
  return {
    ...actual,
    getBillingProvider: (...args: unknown[]) => getBillingProvider(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { changeSubscriptionPlan } from "@/lib/actions/billing";

function planForm(planKey: string, interval = "monthly") {
  const data = new FormData();
  data.set("plan_key", planKey);
  data.set("billing_interval", interval);
  return data;
}

describe("refusePaidPlanChange", () => {
  it("blocks Professional and Business when the provider is mock", () => {
    expect(
      refusePaidPlanChange({
        providerName: "mock",
        planKey: "professional",
      }),
    ).toBe(PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE);
    expect(
      refusePaidPlanChange({
        providerName: "mock",
        planKey: "business",
      }),
    ).toBe(PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE);
  });

  it("keeps Enterprise on the sales path", () => {
    expect(
      refusePaidPlanChange({
        providerName: "mock",
        planKey: "enterprise",
      }),
    ).toBe(ENTERPRISE_SALES_MESSAGE);
  });

  it("does not block a future Stripe provider from paid self-serve plans", () => {
    expect(
      refusePaidPlanChange({
        providerName: "stripe",
        planKey: "professional",
      }),
    ).toBeNull();
    expect(
      refusePaidPlanChange({
        providerName: "stripe",
        planKey: "business",
      }),
    ).toBeNull();
  });

  it("allows starter on mock", () => {
    expect(
      refusePaidPlanChange({
        providerName: "mock",
        planKey: "starter",
      }),
    ).toBeNull();
  });
});

describe("MockBillingProvider.changePlan", () => {
  it("refuses Professional before any database writes", async () => {
    const provider = new MockBillingProvider();
    await expect(
      provider.changePlan({
        businessId: "biz-1",
        planKey: "professional",
        interval: "monthly",
      }),
    ).rejects.toThrow(PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE);
  });

  it("refuses Business before any database writes", async () => {
    const provider = new MockBillingProvider();
    await expect(
      provider.changePlan({
        businessId: "biz-1",
        planKey: "business",
        interval: "yearly",
      }),
    ).rejects.toThrow(PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE);
  });
});

describe("changeSubscriptionPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    changePlan.mockReset();
    getBillingProvider.mockReturnValue({
      name: "mock",
      changePlan,
    });
  });

  it("does not invoke the mock provider for Professional", async () => {
    const result = await changeSubscriptionPlan(
      {},
      planForm("professional"),
    );
    expect(result).toEqual({
      error: PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE,
    });
    expect(changePlan).not.toHaveBeenCalled();
  });

  it("does not invoke the mock provider for Business", async () => {
    const result = await changeSubscriptionPlan({}, planForm("business"));
    expect(result).toEqual({
      error: PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE,
    });
    expect(changePlan).not.toHaveBeenCalled();
  });

  it("keeps Enterprise on sales contact without changing the plan", async () => {
    const result = await changeSubscriptionPlan({}, planForm("enterprise"));
    expect(result).toEqual({ error: ENTERPRISE_SALES_MESSAGE });
    expect(changePlan).not.toHaveBeenCalled();
  });

  it("still allows a future Stripe provider to receive paid plan changes", async () => {
    getBillingProvider.mockReturnValue({
      name: "stripe",
      changePlan,
    });
    changePlan.mockResolvedValue(undefined);

    const result = await changeSubscriptionPlan(
      {},
      planForm("professional"),
    );
    expect(result).toEqual({ success: "Subscription updated." });
    expect(changePlan).toHaveBeenCalledWith({
      businessId: "biz-1",
      planKey: "professional",
      interval: "monthly",
    });
  });
});
