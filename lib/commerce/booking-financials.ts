/**
 * Authoritative booking financials — one model for UI, emails, and ledger sync.
 * Appointment total always includes tax. Remaining balance uses tax-inclusive total.
 */

import { computeBookingPricing } from "@/lib/commerce/booking-pricing";
import { deriveAppointmentPaymentStatus } from "@/lib/commerce/mappers";
import { formatMoneyCents } from "@/lib/commerce/money";
import type { AppointmentPaymentStatus } from "@/lib/commerce/types";

export type BookingFinancialsInput = {
  /** Service/package price before tax (exclusive) or inclusive base when taxInclusive. */
  subtotalCents: number;
  taxCents?: number | null;
  /** When taxCents omitted, compute from rates. */
  serviceTaxRateBps?: number | null;
  taxRates?: Array<{
    id?: string;
    name?: string;
    rate_bps: number;
    inclusive?: boolean;
    is_default?: boolean;
    is_active?: boolean;
  }> | null;
  depositRequiredCents?: number | null;
  depositRequired?: boolean | null;
  /** Payments already on the appointment (net of refunds applied separately). */
  paidToDateCents?: number | null;
  amountRefundedCents?: number | null;
  /** Amount being collected in the current booking flow (not yet persisted). */
  paymentTodayCents?: number | null;
  currency?: string | null;
};

export type BookingFinancials = {
  subtotalCents: number;
  taxCents: number;
  appointmentTotalCents: number;
  depositRequiredCents: number;
  paymentTodayCents: number;
  paidToDateCents: number;
  amountRefundedCents: number;
  /** After applying paymentToday (preview) or paidToDate only when paymentToday is 0. */
  remainingBalanceCents: number;
  paymentStatus: AppointmentPaymentStatus;
  currency: string | null;
  formatted: {
    subtotal: string;
    tax: string;
    appointmentTotal: string;
    depositRequired: string;
    paymentToday: string;
    paidToDate: string;
    remainingBalance: string;
  };
};

/**
 * Resolve deposit required from service/package stamps.
 * Falls back to 20% of subtotal when deposit is required but cents are unset.
 */
export function resolveDepositRequiredCents(input: {
  depositCents?: number | null;
  depositRequired?: boolean | null;
  subtotalCents: number;
}): number {
  const explicit = Math.max(0, Math.round(Number(input.depositCents ?? 0)));
  if (explicit > 0) return explicit;
  if (input.depositRequired) {
    return Math.round(Math.max(0, input.subtotalCents) * 0.2);
  }
  return 0;
}

export function resolveBookingFinancials(
  input: BookingFinancialsInput,
): BookingFinancials {
  const subtotalCents = Math.max(0, Math.round(input.subtotalCents || 0));
  let taxCents =
    input.taxCents != null && Number.isFinite(input.taxCents)
      ? Math.max(0, Math.round(Number(input.taxCents)))
      : null;

  if (taxCents == null) {
    const pricing = computeBookingPricing({
      subtotalCents,
      serviceTaxRateBps: input.serviceTaxRateBps,
      taxRates: input.taxRates as Parameters<
        typeof computeBookingPricing
      >[0]["taxRates"],
      currency: input.currency,
    });
    taxCents = pricing.taxCents;
    // Inclusive tax: appointment total stays at subtotal; exclusive: subtotal + tax.
    const appointmentTotalCents = pricing.totalCents;
    return finalizeFinancials({
      ...input,
      subtotalCents: pricing.taxInclusive
        ? appointmentTotalCents - taxCents
        : subtotalCents,
      taxCents,
      appointmentTotalCents,
    });
  }

  const appointmentTotalCents = subtotalCents + taxCents;
  return finalizeFinancials({
    ...input,
    subtotalCents,
    taxCents,
    appointmentTotalCents,
  });
}

function finalizeFinancials(
  input: BookingFinancialsInput & {
    subtotalCents: number;
    taxCents: number;
    appointmentTotalCents: number;
  },
): BookingFinancials {
  const depositRequiredCents = resolveDepositRequiredCents({
    depositCents: input.depositRequiredCents,
    depositRequired: input.depositRequired,
    subtotalCents: input.subtotalCents,
  });
  const paidToDateCents = Math.max(0, Math.round(input.paidToDateCents ?? 0));
  const amountRefundedCents = Math.max(
    0,
    Math.round(input.amountRefundedCents ?? 0),
  );
  const paymentTodayCents = Math.max(
    0,
    Math.round(input.paymentTodayCents ?? 0),
  );
  const netPaid = Math.max(
    0,
    paidToDateCents + paymentTodayCents - amountRefundedCents,
  );
  const remainingBalanceCents = Math.max(
    0,
    input.appointmentTotalCents - netPaid,
  );
  const paymentStatus = deriveAppointmentPaymentStatus({
    priceCents: input.appointmentTotalCents,
    depositRequiredCents,
    amountPaidCents: paidToDateCents + paymentTodayCents,
    amountRefundedCents,
  });
  const currency = input.currency ?? null;

  return {
    subtotalCents: input.subtotalCents,
    taxCents: input.taxCents,
    appointmentTotalCents: input.appointmentTotalCents,
    depositRequiredCents,
    paymentTodayCents,
    paidToDateCents,
    amountRefundedCents,
    remainingBalanceCents,
    paymentStatus,
    currency,
    formatted: {
      subtotal: formatMoneyCents(input.subtotalCents, currency),
      tax: formatMoneyCents(input.taxCents, currency),
      appointmentTotal: formatMoneyCents(
        input.appointmentTotalCents,
        currency,
      ),
      depositRequired: formatMoneyCents(depositRequiredCents, currency),
      paymentToday: formatMoneyCents(paymentTodayCents, currency),
      paidToDate: formatMoneyCents(paidToDateCents, currency),
      remainingBalance: formatMoneyCents(remainingBalanceCents, currency),
    },
  };
}

/** Label helpers for booking payment mode. */
export type BookingPaymentMode = "none" | "deposit" | "full" | "custom";

export function suggestPaymentTodayCents(
  mode: BookingPaymentMode,
  financials: Pick<
    BookingFinancials,
    "depositRequiredCents" | "appointmentTotalCents"
  >,
  customCents?: number | null,
): number {
  if (mode === "none") return 0;
  if (mode === "deposit") {
    return financials.depositRequiredCents > 0
      ? financials.depositRequiredCents
      : Math.min(5000, financials.appointmentTotalCents);
  }
  if (mode === "full") return financials.appointmentTotalCents;
  return Math.max(0, Math.round(customCents ?? 0));
}

export function paymentKindForAmount(
  amountCents: number,
  depositRequiredCents: number,
  appointmentTotalCents: number,
): "deposit" | "payment" {
  if (
    depositRequiredCents > 0 &&
    amountCents > 0 &&
    amountCents <= depositRequiredCents
  ) {
    return "deposit";
  }
  if (amountCents >= appointmentTotalCents && appointmentTotalCents > 0) {
    return "payment";
  }
  return amountCents <= depositRequiredCents && depositRequiredCents > 0
    ? "deposit"
    : "payment";
}
