import { describe, expect, it } from "vitest";
import { evaluateSaasBillingReadiness, type SaasBillingConfiguration } from "@/lib/billing/saas-readiness";

const configured: SaasBillingConfiguration = {
  mode: "test", runtime: "preview", configurationStatus: "configured", newPurchasesRequested: true,
};

describe("pure SaaS capability policy — synthetic implementation only", () => {
  it("does not equate configuration with implemented capabilities", () => {
    expect(evaluateSaasBillingReadiness(configured)).toMatchObject({
      configurationStatus: "configured",
      checkout: { available: false, reason: "stripe_checkout_not_implemented" },
      reconciliation: { available: false, reason: "stripe_reconciliation_not_implemented" },
    });
  });

  it.each([
    ["mock", true, true, true, false, false],
    ["stripe", false, false, true, false, false],
    ["stripe", true, false, true, false, false],
    ["stripe", false, true, true, false, true],
    ["stripe", true, true, true, true, true],
    ["stripe", true, true, false, false, true],
  ] as const)("provider=%s checkout=%s reconcile=%s purchases=%s", (provider, checkoutImplemented, reconciliationImplemented, newPurchasesRequested, checkout, reconciliation) => {
    const result = evaluateSaasBillingReadiness({ ...configured, newPurchasesRequested }, {
      provider, checkoutImplemented, reconciliationImplemented,
    });
    expect(result.checkout.available).toBe(checkout);
    expect(result.reconciliation.available).toBe(reconciliation);
    if (!newPurchasesRequested) expect(result.checkout.reason).toBe("new_purchases_disabled");
  });

  it("returns typed unavailability for invalid config even with explicit implemented reconciliation", () => {
    const result = evaluateSaasBillingReadiness({ ...configured, configurationStatus: "invalid_secret_key", newPurchasesRequested: false }, {
      provider: "stripe", checkoutImplemented: true, reconciliationImplemented: true,
    });
    expect(result.checkout).toEqual({ available: false, reason: "configuration_unavailable" });
    expect(result.reconciliation).toEqual({ available: false, reason: "configuration_unavailable" });
  });
});
