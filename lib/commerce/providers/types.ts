/**
 * Payment provider abstraction.
 * Business logic must never import Stripe SDK directly — only this interface.
 */

import type { PaymentMethod, PaymentProviderName } from "@/lib/commerce/types";

export type ChargeInput = {
  businessId: string;
  customerId: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  description?: string;
  /** Existing provider customer id (cus_…) — never a PAN */
  providerCustomerId?: string | null;
  metadata?: Record<string, string>;
};

export type ChargeResult = {
  ok: boolean;
  provider: PaymentProviderName;
  status: "succeeded" | "pending" | "requires_action" | "failed";
  providerReference: string | null;
  providerPaymentIntentId: string | null;
  clientSecret?: string | null;
  message?: string;
};

export type RefundInput = {
  amountCents: number;
  currency: string;
  providerReference: string | null;
  providerPaymentIntentId: string | null;
  reason: string;
};

export type RefundResult = {
  ok: boolean;
  provider: PaymentProviderName;
  status: "succeeded" | "pending" | "failed";
  providerReference: string | null;
  message?: string;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  supportsMethod(method: PaymentMethod): boolean;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(input: RefundInput): Promise<RefundResult>;
}

export function isCardMethod(method: PaymentMethod): boolean {
  return method === "credit_card" || method === "debit_card";
}
