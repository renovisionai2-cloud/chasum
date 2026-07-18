import { ManualPaymentProvider } from "@/lib/commerce/providers/manual";
import {
  isStripeConfigured,
  StripePaymentProvider,
} from "@/lib/commerce/providers/stripe";
import type {
  ChargeInput,
  ChargeResult,
  PaymentProvider,
  RefundInput,
  RefundResult,
} from "@/lib/commerce/providers/types";
import { isCardMethod } from "@/lib/commerce/providers/types";
import type { PaymentMethod, PaymentProviderName } from "@/lib/commerce/types";

const manual = new ManualPaymentProvider();
const stripe = new StripePaymentProvider();

/** Resolve provider for a payment method. Cards prefer Stripe when configured. */
export function resolvePaymentProvider(method: PaymentMethod): PaymentProvider {
  if (isCardMethod(method) && isStripeConfigured()) {
    return stripe;
  }
  if (isCardMethod(method) && !isStripeConfigured()) {
    // Offline POS card recording stays on manual — never invent Stripe charges
    return manual;
  }
  return manual;
}

export function getStripeProvider(): PaymentProvider {
  return stripe;
}

export function getManualProvider(): PaymentProvider {
  return manual;
}

export function getActiveProviderSummary(): {
  active: PaymentProviderName;
  stripeConfigured: boolean;
} {
  return {
    active: isStripeConfigured() ? "stripe" : "manual",
    stripeConfigured: isStripeConfigured(),
  };
}

export type {
  PaymentProvider,
  ChargeInput,
  ChargeResult,
  RefundInput,
  RefundResult,
};
export { isCardMethod, isStripeConfigured };
