import "server-only";

import {
  evaluateSaasBillingReadiness,
  type SaasBillingConfiguration,
  type SaasBillingConfigurationStatus,
} from "@/lib/billing/saas-readiness";

/**
 * Isolated SaaS configuration foundation, NOT a working checkout/reconciler.
 * No shared commerce credentials, secret exports, provider calls or activation.
 * Syntax checks cannot prove real key validity, account identity, permission
 * scope or test/live endpoint signing-secret pairing.
 * Only explicit Vercel deployment identity is supported; non-Vercel support is
 * not implemented. NODE_ENV is build optimization, never live permission here.
 * Configured Production requires live; Preview/development require test.
 * Future subscriber rollback uses the new-purchase control, not disabled billing
 * mode or removed keys: keep reconciliation healthy while stopping purchases.
 * Real reconciliation is not implemented in this slice.
 *
 * Future audited trust boundary (not implemented): server-resolved verified
 * user/Business/price/offer -> Checkout -> verified canonical provider mapping
 * -> transactional replay/concurrency-safe activation.
 */
export function readSaasBillingConfiguration(
  env: Readonly<Record<string, string | undefined>> = process.env,
): SaasBillingConfiguration {
  const rawMode = env.CHASUM_SAAS_BILLING_MODE;
  const mode = rawMode === undefined || rawMode === "disabled"
    ? "disabled"
    : rawMode === "test" || rawMode === "live" ? rawMode : "invalid";
  const identity = env.VERCEL_ENV;
  const runtime = identity === "production" || identity === "preview" || identity === "development"
    ? identity : "unknown";
  // Exact syntax: nonempty alphanumeric suffix; whitespace is not normalized.
  const keyMode = /^(?:sk|rk)_(test|live)_[A-Za-z0-9]+$/.exec(
    env.CHASUM_SAAS_STRIPE_SECRET_KEY ?? "",
  );
  const webhook = env.CHASUM_SAAS_STRIPE_WEBHOOK_SECRET ?? "";
  // JS $ can match before a final newline: require an exact full-string match.
  const keySyntax = keyMode?.[0] === env.CHASUM_SAAS_STRIPE_SECRET_KEY && !!keyMode;
  const webhookSyntax = /^whsec_[A-Za-z0-9]+$/.exec(webhook)?.[0] === webhook && webhook !== "";
  let configurationStatus: SaasBillingConfigurationStatus;
  if (mode === "disabled") configurationStatus = "disabled";
  else if (mode === "invalid") configurationStatus = "invalid_mode";
  else if (runtime === "unknown") configurationStatus = "unknown_runtime";
  else if (mode === "live" && runtime !== "production") configurationStatus = "live_requires_production";
  else if (mode === "test" && runtime === "production") configurationStatus = "test_requires_nonproduction";
  else if (!keySyntax) configurationStatus = "invalid_secret_key";
  else if (keyMode?.[1] !== mode) configurationStatus = "key_mode_mismatch";
  else if (!webhookSyntax) configurationStatus = "invalid_webhook_secret";
  else configurationStatus = "configured";

  return {
    mode,
    runtime,
    configurationStatus,
    newPurchasesRequested: env.CHASUM_SAAS_NEW_PURCHASES_ENABLED === "true",
  };
}

/** Actual capabilities remain absent; no injection/activation path in this slice. */
export function getSaasBillingReadiness() {
  return evaluateSaasBillingReadiness(readSaasBillingConfiguration());
}
