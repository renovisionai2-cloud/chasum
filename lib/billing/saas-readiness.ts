/** Public-safe policy projection, not provider health or end-to-end billing readiness. */
export type SaasBillingConfigurationStatus =
  | "configured"
  | "disabled"
  | "invalid_mode"
  | "unknown_runtime"
  | "live_requires_production"
  | "test_requires_nonproduction"
  | "invalid_secret_key"
  | "key_mode_mismatch"
  | "invalid_webhook_secret";

export type SaasBillingConfiguration = Readonly<{
  mode: "disabled" | "test" | "live" | "invalid";
  runtime: "production" | "preview" | "development" | "unknown";
  configurationStatus: SaasBillingConfigurationStatus;
  newPurchasesRequested: boolean;
}>;

/** Trusted implementation facts, never request flags or credentials. */
export type SaasBillingImplementation = Readonly<{
  provider: "mock" | "stripe";
  checkoutImplemented: boolean;
  reconciliationImplemented: boolean;
}>;

type UnavailabilityReason =
  | "configuration_unavailable"
  | "new_purchases_disabled"
  | "stripe_checkout_not_implemented"
  | "stripe_reconciliation_not_implemented";

export type SaasBillingCapability =
  | { available: false; reason: UnavailabilityReason }
  | { available: true; reason: "implemented" };

function capability(reason: UnavailabilityReason | null): SaasBillingCapability {
  return reason ? { available: false, reason } : { available: true, reason: "implemented" };
}

/**
 * No SaaS Stripe adapter exists today; omitted or mock implementation stays OFF.
 * Positive implementation inputs are a future audited adapter contract (synthetic
 * in tests), not a way to activate today's provider. No writes or reconciliation.
 */
export function evaluateSaasBillingReadiness(
  configuration: SaasBillingConfiguration,
  implementation?: SaasBillingImplementation,
) {
  const configUnavailable = configuration.configurationStatus !== "configured";
  const stripe = implementation?.provider === "stripe";
  const reconciliationReason: UnavailabilityReason | null = configUnavailable
    ? "configuration_unavailable"
    : !stripe || implementation?.reconciliationImplemented !== true
      ? "stripe_reconciliation_not_implemented"
      : null;
  const checkoutReason: UnavailabilityReason | null = configUnavailable
    ? "configuration_unavailable"
    : configuration.newPurchasesRequested !== true
      ? "new_purchases_disabled"
      : !stripe || implementation?.checkoutImplemented !== true
        ? "stripe_checkout_not_implemented"
        : reconciliationReason;

  return {
    configurationStatus: configuration.configurationStatus,
    checkout: capability(checkoutReason),
    reconciliation: capability(reconciliationReason),
  };
}
