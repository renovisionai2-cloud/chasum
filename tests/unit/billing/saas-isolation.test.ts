// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSaasBillingReadiness, readSaasBillingConfiguration } from "@/lib/billing/saas-configuration";
import { getActiveProviderSummary, resolvePaymentProvider } from "@/lib/commerce/providers";
import { getStripeSecretKey, getStripeWebhookSecret } from "@/lib/env";
import { getBillingProvider, getBillingSummary, MockBillingProvider, resetBillingProvider } from "@/lib/billing/subscription-service";
import { PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE, TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE } from "@/lib/billing/paid-upgrade-guard";
import { cancelSubscriptionAction, changeSubscriptionPlan, reactivateSubscriptionAction } from "@/lib/actions/billing";

const db = vi.hoisted(() => ({ createClient: vi.fn(), createServiceClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: db.createClient }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: db.createServiceClient }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: async () => ({ id: "synthetic-business" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const saas = {
  CHASUM_SAAS_BILLING_MODE: "test",
  CHASUM_SAAS_STRIPE_SECRET_KEY: "sk_test_SaasSyntheticSentinel".padEnd(180, "S"),
  CHASUM_SAAS_STRIPE_WEBHOOK_SECRET: "whsec_SaasSyntheticSentinel".padEnd(180, "S"),
  CHASUM_SAAS_NEW_PURCHASES_ENABLED: "true",
};
const commerce = {
  STRIPE_SECRET_KEY: "sk_test_CommerceSyntheticSentinel".padEnd(180, "C"),
  STRIPE_WEBHOOK_SECRET: "whsec_CommerceSyntheticSentinel".padEnd(180, "C"),
};
const publicKeys = {
  NEXT_PUBLIC_STRIPE_SECRET_KEY: saas.CHASUM_SAAS_STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET: saas.CHASUM_SAAS_STRIPE_WEBHOOK_SECRET,
  ...Object.fromEntries(Object.entries(saas).map(([name, value]) => [`NEXT_PUBLIC_${name}`, value])),
};
function stub(values: Record<string, string>) {
  for (const [name, value] of Object.entries(values)) vi.stubEnv(name, value);
}

beforeEach(() => {
  for (const name of Object.keys({ ...saas, ...commerce, ...publicKeys })) vi.stubEnv(name, undefined);
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request"); }));
  db.createClient.mockReset();
  db.createServiceClient.mockReset();
  resetBillingProvider();
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetBillingProvider();
});

describe("real resolver namespace isolation — no charge or network calls", () => {
  it.each([
    ["SaaS only", saas, true, false],
    ["commerce only", commerce, false, true],
    ["both", { ...saas, ...commerce }, true, true],
    ["public only", publicKeys, false, false],
    ["public keys plus SaaS policy", { ...publicKeys, CHASUM_SAAS_BILLING_MODE: "test", CHASUM_SAAS_NEW_PURCHASES_ENABLED: "true" }, false, false],
    ["commerce plus SaaS policy", { ...commerce, CHASUM_SAAS_BILLING_MODE: "test", CHASUM_SAAS_NEW_PURCHASES_ENABLED: "true" }, false, true],
  ] as const)("%s", (_label, values, saasConfigured, commerceConfigured) => {
    stub(values);
    expect(readSaasBillingConfiguration().configurationStatus === "configured").toBe(saasConfigured);
    expect(getStripeSecretKey()).toBe(commerceConfigured ? commerce.STRIPE_SECRET_KEY : null);
    expect(getStripeWebhookSecret()).toBe(commerceConfigured ? commerce.STRIPE_WEBHOOK_SECRET : null);
    for (const method of ["credit_card", "debit_card"] as const) {
      expect(resolvePaymentProvider(method).name).toBe(commerceConfigured ? "stripe" : "manual");
    }
    expect(getActiveProviderSummary()).toEqual({ active: commerceConfigured ? "stripe" : "manual", stripeConfigured: commerceConfigured });
    const actual = getSaasBillingReadiness();
    expect(actual.checkout.available).toBe(false);
    expect(actual.reconciliation.available).toBe(false);
  });
});

describe.each([
  ["test", "preview", "configured"],
  ["test", "development", "configured"],
  ["live", "production", "configured"],
  ["test", "production", "test_requires_nonproduction"],
  ["live", "preview", "live_requires_production"],
  ["live", "development", "live_requires_production"],
] as const)("actual billing stays mock with %s mode in %s", (mode, runtime, status) => {
  beforeEach(() => {
    stub({ ...saas, ...commerce, CHASUM_SAAS_BILLING_MODE: mode,
      CHASUM_SAAS_STRIPE_SECRET_KEY: `sk_${mode}_SyntheticSentinel`, VERCEL_ENV: runtime });
    expect(readSaasBillingConfiguration().configurationStatus).toBe(status);
  });

  it("rejects paid provider mutations and every tenant self-serve action before DB access", async () => {
    const provider = getBillingProvider();
    expect(provider).toBeInstanceOf(MockBillingProvider);
    expect(provider.name).toBe("mock");
    for (const planKey of ["professional", "business"] as const) {
      await expect(provider.changePlan({ businessId: "synthetic-business", planKey, interval: "yearly" }))
        .rejects.toThrow(PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE);
    }
    for (const plan of ["starter", "professional", "business"]) {
      const form = new FormData();
      form.set("plan_key", plan);
      expect(await changeSubscriptionPlan({}, form)).toEqual({ error: TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE });
    }
    expect(await cancelSubscriptionAction({}, new FormData())).toEqual({ error: TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE });
    expect(await reactivateSubscriptionAction()).toEqual({ error: TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE });
    expect(db.createClient).not.toHaveBeenCalled();
    expect(db.createServiceClient).not.toHaveBeenCalled();
    expect(getSaasBillingReadiness()).toMatchObject({ checkout: { available: false }, reconciliation: { available: false } });
  });

  it("keeps the actual billing summary paid-checkout flag false using read-only mocks", async () => {
    const business = { id: "synthetic-business", name: "Synthetic", subscription_plan_key: "starter", subscription_status: "active", billing_interval: "monthly" };
    db.createClient.mockResolvedValue({ from: (table: string) => {
      const result = { data: table === "businesses" ? business : [], error: null };
      const query = {
        select: () => query, eq: () => query, order: () => query,
        single: async () => result, limit: async () => result,
        then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
      };
      return query;
    } });
    const summary = await getBillingSummary(business.id);
    expect(summary.paidSelfServeCheckoutAvailable).toBe(false);
    expect(summary.subscription.planKey).toBe("starter");
    expect(summary.invoices).toEqual([]);
    expect(summary.events).toEqual([]);
    expect(db.createServiceClient).not.toHaveBeenCalled();
  });
});
