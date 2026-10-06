import "server-only";

import { createHash } from "node:crypto";
import { BUSINESS_CURRENCIES } from "@/lib/commerce/money";
import {
  PAYMENT_ATTEMPT_METHODS,
  PAYMENT_ATTEMPT_SOURCES,
  type ManualPaymentAttemptRequest,
  type NormalizedPaymentIntentV1,
  type PaymentIntentV1Input,
} from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function normalizeUuid(value: string, field: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new Error(`${field} must be a canonical UUID.`);
  }
  return normalized;
}

export function normalizePaymentIntentV1(
  input: PaymentIntentV1Input,
): NormalizedPaymentIntentV1 {
  if (!["customer", "appointment", "booking_operation"].includes(input.target)) {
    throw new Error("target is not supported by payment fingerprint v1.");
  }
  if (!["payment", "deposit", "none"].includes(input.paymentKind)) {
    throw new Error("paymentKind is not supported by payment fingerprint v1.");
  }
  if (
    input.providerRoute !== null &&
    !["manual", "stripe"].includes(input.providerRoute)
  ) {
    throw new Error("providerRoute is not supported by payment fingerprint v1.");
  }
  const businessId = normalizeUuid(input.businessId, "businessId");
  const customerId = normalizeUuid(input.customerId, "customerId");
  const targetId =
    input.target === "customer"
      ? null
      : normalizeUuid(input.targetId ?? "", "targetId");
  const currency = input.currency.trim().toLowerCase();
  const instrumentId = input.instrumentId
    ? normalizeUuid(input.instrumentId, "instrumentId")
    : null;

  if (!/^[a-z]{3}$/.test(currency)) {
    throw new Error("currency must be a three-letter lowercase ISO code.");
  }
  if (
    !Number.isSafeInteger(input.amountCents) ||
    input.amountCents < 0 ||
    (input.paymentKind === "none" && input.amountCents !== 0) ||
    (input.paymentKind !== "none" && input.amountCents <= 0)
  ) {
    throw new Error("amountCents is invalid for the payment kind.");
  }
  if (
    input.method !== null &&
    !PAYMENT_ATTEMPT_METHODS.includes(input.method)
  ) {
    throw new Error("method is not supported by payment fingerprint v1.");
  }
  if (
    (input.paymentKind === "none" &&
      (input.method !== null || input.providerRoute !== null)) ||
    (input.paymentKind !== "none" &&
      (input.method === null || input.providerRoute === null))
  ) {
    throw new Error("method/provider do not match the payment kind.");
  }
  if ((input.method === "gift_card") !== (instrumentId !== null)) {
    throw new Error("gift-card identity must be present only for gift_card.");
  }

  const tuple = [
    "chasum.payment-attempt",
    1,
    businessId,
    customerId,
    input.target,
    targetId,
    input.amountCents,
    currency,
    input.method,
    input.paymentKind,
    input.providerRoute,
    instrumentId,
  ] as const;
  const canonicalUtf8 = JSON.stringify(tuple);
  const digest = createHash("sha256").update(canonicalUtf8, "utf8").digest("hex");

  return {
    businessId,
    customerId,
    target: input.target,
    targetId,
    amountCents: input.amountCents,
    currency,
    method: input.method,
    paymentKind: input.paymentKind,
    providerRoute: input.providerRoute,
    instrumentId,
    tuple,
    canonicalUtf8,
    fingerprint: `v1:${digest}`,
  };
}

export function normalizeR1aManualIntent(
  authority: { businessId: string; currency: string },
  request: ManualPaymentAttemptRequest,
): NormalizedPaymentIntentV1 {
  const currency = assertSupportedBusinessCurrency(authority.currency);
  if (request.target !== "customer" && request.target !== "appointment") {
    throw new Error("R1a target must be an existing customer or appointment.");
  }
  if (!PAYMENT_ATTEMPT_SOURCES.includes(request.source)) {
    throw new Error("Payment source is outside R1a.");
  }
  if (request.invoiceId || request.explicitInvoiceIntent) {
    throw new Error("Explicit invoice intent is outside R1a.");
  }
  if ((request.providerRoute ?? "manual") !== "manual") {
    throw new Error("Provider collection is outside R1a.");
  }
  if (
    !["cash", "debit_card", "credit_card", "e_transfer", "other"].includes(
      request.method,
    ) ||
    !["payment", "deposit"].includes(request.paymentKind)
  ) {
    throw new Error("The requested payment mode is outside R1a.");
  }
  if (
    (request.target === "appointment" && !request.appointmentId) ||
    (request.target === "customer" && request.appointmentId)
  ) {
    throw new Error("The target discriminator and appointment identity disagree.");
  }

  return normalizePaymentIntentV1({
    businessId: authority.businessId,
    customerId: request.customerId,
    target: request.target,
    targetId:
      request.target === "appointment" ? request.appointmentId ?? null : null,
    amountCents: request.amountCents,
    currency,
    method: request.method,
    paymentKind: request.paymentKind,
    providerRoute: "manual",
    instrumentId: null,
  });
}

export function assertCanonicalUuid(value: string, field: string): string {
  return normalizeUuid(value, field);
}

export function assertSupportedBusinessCurrency(value: string): string {
  const currency = value.trim().toLowerCase();
  if (
    !BUSINESS_CURRENCIES.some(
      ({ value: supported }) => supported === currency,
    )
  ) {
    throw new Error(
      "Business currency is unavailable. Payment cannot be recorded until it is verified.",
    );
  }
  return currency;
}

export function isCanonicalUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
