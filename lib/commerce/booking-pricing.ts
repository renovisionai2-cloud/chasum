/**
 * Booking form pricing — subtotal / tax / total from service or package
 * plus business tax catalog (never hardcoded regional rates).
 */

import { formatMoneyCents } from "@/lib/commerce/money";
import type { TaxRate } from "@/lib/business/types";

export type BookingPricingInput = {
  /** Subtotal before tax, in cents */
  subtotalCents: number;
  /** Service-level override in basis points (100 = 1%) */
  serviceTaxRateBps?: number | null;
  /** Active tax rates for the business */
  taxRates?: TaxRate[] | null;
  /** Prefer this rate id when set */
  taxRateId?: string | null;
  currency?: string | null;
};

export type BookingPricingSummary = {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  taxRateBps: number;
  taxInclusive: boolean;
  taxLabel: string | null;
  formatted: {
    subtotal: string;
    taxes: string;
    total: string;
  };
};

function resolveTaxRate(input: BookingPricingInput): {
  rateBps: number;
  inclusive: boolean;
  label: string | null;
} {
  const catalog = (input.taxRates ?? []).filter((r) => r.is_active);
  const byId = input.taxRateId
    ? catalog.find((r) => r.id === input.taxRateId)
    : undefined;
  const defaultRate =
    byId ??
    catalog.find((r) => r.is_default) ??
    catalog[0] ??
    null;

  const serviceBps =
    input.serviceTaxRateBps != null && Number.isFinite(input.serviceTaxRateBps)
      ? Math.max(0, Math.round(Number(input.serviceTaxRateBps)))
      : null;

  if (serviceBps != null && serviceBps > 0) {
    return {
      rateBps: serviceBps,
      inclusive: defaultRate?.inclusive ?? false,
      label: defaultRate?.name ?? "Tax",
    };
  }

  if (defaultRate) {
    return {
      rateBps: Math.max(0, Math.round(defaultRate.rate_bps)),
      inclusive: defaultRate.inclusive,
      label: defaultRate.name,
    };
  }

  return { rateBps: 0, inclusive: false, label: null };
}

/** Compute stampable pricing for a booking draft or saved snapshot display. */
export function computeBookingPricing(
  input: BookingPricingInput,
): BookingPricingSummary {
  const subtotalCents = Math.max(0, Math.round(input.subtotalCents || 0));
  const { rateBps, inclusive, label } = resolveTaxRate(input);

  let taxCents = 0;
  let totalCents = subtotalCents;

  if (rateBps > 0) {
    if (inclusive) {
      // price already includes tax — extract tax portion for display
      taxCents = Math.round(
        (subtotalCents * rateBps) / (10_000 + rateBps),
      );
      totalCents = subtotalCents;
    } else {
      taxCents = Math.round((subtotalCents * rateBps) / 10_000);
      totalCents = subtotalCents + taxCents;
    }
  }

  const currency = input.currency;
  return {
    subtotalCents,
    taxCents,
    totalCents,
    taxRateBps: rateBps,
    taxInclusive: inclusive,
    taxLabel: label,
    formatted: {
      subtotal: formatMoneyCents(subtotalCents, currency),
      taxes: formatMoneyCents(taxCents, currency),
      total: formatMoneyCents(totalCents, currency),
    },
  };
}
