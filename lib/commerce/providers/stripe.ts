/**
 * Stripe payment provider — first production provider.
 * Uses Stripe REST API via fetch (no card numbers stored — PaymentIntent refs only).
 * When STRIPE_SECRET_KEY is unset, card charges return a clear configuration error.
 */

import type {
  ChargeInput,
  ChargeResult,
  PaymentProvider,
  RefundInput,
  RefundResult,
} from "@/lib/commerce/providers/types";
import { isCardMethod } from "@/lib/commerce/providers/types";
import type { PaymentMethod } from "@/lib/commerce/types";
import { getStripeSecretKey } from "@/lib/env";

function stripeSecret(): string | null {
  const key = getStripeSecretKey()?.trim();
  return key || null;
}

export function isStripeConfigured(): boolean {
  return Boolean(stripeSecret());
}

async function stripeForm(
  path: string,
  params: Record<string, string>,
): Promise<{ ok: boolean; data: Record<string, unknown>; error?: string }> {
  const key = stripeSecret();
  if (!key) {
    return { ok: false, data: {}, error: "Stripe is not configured." };
  }

  const body = new URLSearchParams(params);
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined;
    return {
      ok: false,
      data,
      error: err?.message ?? `Stripe error (${res.status})`,
    };
  }
  return { ok: true, data };
}

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  supportsMethod(method: PaymentMethod): boolean {
    return isCardMethod(method);
  }

  async charge(input: ChargeInput): Promise<ChargeResult> {
    if (!isCardMethod(input.method)) {
      return {
        ok: false,
        provider: "stripe",
        status: "failed",
        providerReference: null,
        providerPaymentIntentId: null,
        message: "Stripe only supports card methods.",
      };
    }

    if (!isStripeConfigured()) {
      // PCI-safe offline path: never invent a charge; require manual or configure Stripe
      return {
        ok: false,
        provider: "stripe",
        status: "failed",
        providerReference: null,
        providerPaymentIntentId: null,
        message:
          "Stripe is not configured (set STRIPE_SECRET_KEY). Use cash / e-transfer or record a card payment as manual POS.",
      };
    }

    if (input.amountCents <= 0) {
      return {
        ok: false,
        provider: "stripe",
        status: "failed",
        providerReference: null,
        providerPaymentIntentId: null,
        message: "Amount must be greater than zero.",
      };
    }

    const params: Record<string, string> = {
      amount: String(input.amountCents),
      currency: input.currency.toLowerCase(),
      "automatic_payment_methods[enabled]": "true",
      description: input.description ?? "Chasum booking payment",
      "metadata[business_id]": input.businessId,
      "metadata[customer_id]": input.customerId,
    };

    if (input.providerCustomerId) {
      params.customer = input.providerCustomerId;
    }

    for (const [k, v] of Object.entries(input.metadata ?? {})) {
      params[`metadata[${k}]`] = v;
    }

    const result = await stripeForm("payment_intents", params);
    if (!result.ok) {
      return {
        ok: false,
        provider: "stripe",
        status: "failed",
        providerReference: null,
        providerPaymentIntentId: null,
        message: result.error,
      };
    }

    const intentId = String(result.data.id ?? "");
    const status = String(result.data.status ?? "requires_payment_method");
    const clientSecret =
      typeof result.data.client_secret === "string"
        ? result.data.client_secret
        : null;

    if (status === "succeeded") {
      return {
        ok: true,
        provider: "stripe",
        status: "succeeded",
        providerReference: intentId,
        providerPaymentIntentId: intentId,
        clientSecret,
      };
    }

    return {
      ok: true,
      provider: "stripe",
      status: "requires_action",
      providerReference: intentId,
      providerPaymentIntentId: intentId,
      clientSecret,
      message:
        "PaymentIntent created. Complete card collection with Stripe Elements (client secret).",
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    if (!isStripeConfigured()) {
      return {
        ok: false,
        provider: "stripe",
        status: "failed",
        providerReference: null,
        message: "Stripe is not configured for refunds.",
      };
    }

    const paymentIntent =
      input.providerPaymentIntentId ?? input.providerReference;
    if (!paymentIntent) {
      return {
        ok: false,
        provider: "stripe",
        status: "failed",
        providerReference: null,
        message: "Missing Stripe payment intent reference.",
      };
    }

    const params: Record<string, string> = {
      payment_intent: paymentIntent,
      amount: String(input.amountCents),
      reason: "requested_by_customer",
      "metadata[reason]": input.reason.slice(0, 400),
    };

    const result = await stripeForm("refunds", params);
    if (!result.ok) {
      return {
        ok: false,
        provider: "stripe",
        status: "failed",
        providerReference: null,
        message: result.error,
      };
    }

    return {
      ok: true,
      provider: "stripe",
      status: "succeeded",
      providerReference: String(result.data.id ?? ""),
    };
  }
}
