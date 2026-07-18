/**
 * Manual payment provider — cash, e-transfer, gift card, store credit, other.
 * Records succeed immediately; no card data ever handled.
 */

import type {
  ChargeInput,
  ChargeResult,
  PaymentProvider,
  RefundInput,
  RefundResult,
} from "@/lib/commerce/providers/types";
import type { PaymentMethod } from "@/lib/commerce/types";

const MANUAL_METHODS: PaymentMethod[] = [
  "cash",
  "e_transfer",
  "gift_card",
  "store_credit",
  "other",
  // Cards may be recorded as offline/manual POS when Stripe is not used
  "credit_card",
  "debit_card",
];

export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual" as const;

  supportsMethod(method: PaymentMethod): boolean {
    return MANUAL_METHODS.includes(method);
  }

  async charge(input: ChargeInput): Promise<ChargeResult> {
    if (input.amountCents <= 0) {
      return {
        ok: false,
        provider: "manual",
        status: "failed",
        providerReference: null,
        providerPaymentIntentId: null,
        message: "Amount must be greater than zero.",
      };
    }
    const ref = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      ok: true,
      provider: "manual",
      status: "succeeded",
      providerReference: ref,
      providerPaymentIntentId: null,
      message: "Payment recorded manually.",
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    if (input.amountCents <= 0) {
      return {
        ok: false,
        provider: "manual",
        status: "failed",
        providerReference: null,
        message: "Refund amount must be greater than zero.",
      };
    }
    const ref = `manual_refund_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      ok: true,
      provider: "manual",
      status: "succeeded",
      providerReference: ref,
      message: "Refund recorded manually.",
    };
  }
}
