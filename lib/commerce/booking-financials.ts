/**
 * Authoritative booking financials — single source for UI, stamps, emails, ledger.
 *
 * Storage convention (appointments):
 * - price_cents = exclusive subtotal (before tax)
 * - tax_cents = tax amount
 * - appointment total = price_cents + tax_cents
 * - deposit_cents = configured deposit requirement (not a % of tax)
 *
 * Catalog list price may be tax-inclusive or tax-exclusive based on the active
 * tax rate’s `inclusive` flag (or an explicit override). Never hardcode a
 * tenant’s tax mode by name.
 */

import { computeBookingPricing } from "@/lib/commerce/booking-pricing";
import { deriveAppointmentPaymentStatus } from "@/lib/commerce/mappers";
import { formatMoneyCents } from "@/lib/commerce/money";
import type { AppointmentPaymentStatus } from "@/lib/commerce/types";

export type BookingFinancialsInput = {
  /**
   * Catalog / list price in cents as stored on the service or package.
   * May be tax-inclusive or tax-exclusive depending on taxInclusive.
   */
  catalogPriceCents: number;
  /**
   * When known, whether catalogPriceCents already includes tax.
   * When omitted, derived from the active tax rate’s `inclusive` flag.
   * Default (no rates): tax-exclusive.
   */
  taxInclusive?: boolean | null;
  /** Precomputed tax override (rare). Prefer letting the resolver compute. */
  taxCents?: number | null;
  serviceTaxRateBps?: number | null;
  taxRates?: Array<{
    id?: string;
    name?: string;
    rate_bps: number;
    inclusive?: boolean;
    is_default?: boolean;
    is_active?: boolean;
  }> | null;
  /** Authoritative configured deposit requirement in cents. */
  depositRequiredCents?: number | null;
  depositRequired?: boolean | null;
  paidToDateCents?: number | null;
  amountRefundedCents?: number | null;
  paymentTodayCents?: number | null;
  currency?: string | null;
};

export type BookingFinancials = {
  /** Original catalog list price (as configured on the service/package). */
  catalogPriceCents: number;
  taxInclusive: boolean;
  taxRateBps: number;
  taxLabel: string | null;
  /** Exclusive amount before tax (stamp as appointments.price_cents). */
  subtotalCents: number;
  taxCents: number;
  /** Customer-facing appointment total (subtotal + tax). */
  appointmentTotalCents: number;
  depositRequiredCents: number;
  paymentTodayCents: number;
  paidToDateCents: number;
  amountRefundedCents: number;
  remainingBalanceCents: number;
  paymentStatus: AppointmentPaymentStatus;
  currency: string | null;
  /** How tax inclusive/exclusive was resolved — for Preview diagnostics. */
  debug: {
    storedInclusive: boolean;
    effectiveInclusive: boolean;
    source: string;
    taxRateId: string | null;
    taxable: boolean;
  };
  formatted: {
    catalogPrice: string;
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
 *
 * Explicit deposit_cents always wins. Percentage fallback only when
 * deposit_required is true and no fixed deposit cents are configured.
 * Never derive deposit from tax amount.
 */
export function resolveDepositRequiredCents(input: {
  depositCents?: number | null;
  depositRequired?: boolean | null;
  /** Appointment total (tax-aware). Used only for the optional % fallback. */
  baseCents: number;
}): number {
  const explicit = Math.max(0, Math.round(Number(input.depositCents ?? 0)));
  if (explicit > 0) return explicit;
  if (input.depositRequired) {
    return Math.round(Math.max(0, input.baseCents) * 0.2);
  }
  return 0;
}

function resolveTaxMeta(input: BookingFinancialsInput): {
  rateBps: number;
  inclusive: boolean;
  label: string | null;
  source: string;
  taxRateId: string | null;
  storedInclusive: boolean;
} {
  const catalog = (input.taxRates ?? []).filter((r) => r.is_active !== false);
  const defaultRate =
    catalog.find((r) => r.is_default) ?? catalog[0] ?? null;
  const pricing = computeBookingPricing({
    subtotalCents: Math.max(0, Math.round(input.catalogPriceCents || 0)),
    serviceTaxRateBps: input.serviceTaxRateBps,
    taxRates: input.taxRates as Parameters<
      typeof computeBookingPricing
    >[0]["taxRates"],
    currency: input.currency,
  });

  if (input.taxInclusive != null) {
    return {
      rateBps: pricing.taxRateBps,
      inclusive: Boolean(input.taxInclusive),
      label: pricing.taxLabel,
      source: "explicit override (caller taxInclusive)",
      taxRateId: defaultRate?.id ?? null,
      storedInclusive: Boolean(defaultRate?.inclusive),
    };
  }

  return {
    rateBps: pricing.taxRateBps,
    inclusive: pricing.taxInclusive,
    label: pricing.taxLabel,
    source: defaultRate
      ? `tax_rates.inclusive on "${defaultRate.name}" (${defaultRate.id ?? "no-id"})`
      : "no active tax rate (default exclusive)",
    taxRateId: defaultRate?.id ?? null,
    storedInclusive: Boolean(defaultRate?.inclusive),
  };
}

/**
 * Resolve financials from a catalog list price + tax configuration.
 * This is the only function UI and stamps should use for booking money.
 */
export function resolveBookingFinancials(
  input: BookingFinancialsInput,
): BookingFinancials {
  const catalogPriceCents = Math.max(
    0,
    Math.round(input.catalogPriceCents || 0),
  );
  const { rateBps, inclusive, label, source, taxRateId, storedInclusive } =
    resolveTaxMeta(input);

  let taxCents: number;
  let subtotalCents: number;
  let appointmentTotalCents: number;

  if (
    input.taxCents != null &&
    Number.isFinite(input.taxCents) &&
    input.taxInclusive != null
  ) {
    // Explicit path — trust caller’s inclusive flag + tax amount.
    taxCents = Math.max(0, Math.round(Number(input.taxCents)));
    if (input.taxInclusive) {
      appointmentTotalCents = catalogPriceCents;
      subtotalCents = Math.max(0, appointmentTotalCents - taxCents);
    } else {
      subtotalCents = catalogPriceCents;
      appointmentTotalCents = subtotalCents + taxCents;
    }
  } else {
    // Canonical path: compute from catalog + rate.
    if (rateBps > 0) {
      if (inclusive) {
        appointmentTotalCents = catalogPriceCents;
        taxCents = Math.round(
          (catalogPriceCents * rateBps) / (10_000 + rateBps),
        );
        subtotalCents = Math.max(0, appointmentTotalCents - taxCents);
      } else {
        subtotalCents = catalogPriceCents;
        taxCents = Math.round((catalogPriceCents * rateBps) / 10_000);
        appointmentTotalCents = subtotalCents + taxCents;
      }
    } else {
      subtotalCents = catalogPriceCents;
      taxCents = 0;
      appointmentTotalCents = catalogPriceCents;
    }
  }

  const depositRequiredCents = resolveDepositRequiredCents({
    depositCents: input.depositRequiredCents,
    depositRequired: input.depositRequired,
    baseCents: appointmentTotalCents,
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
  const remainingBalanceCents = Math.max(0, appointmentTotalCents - netPaid);
  const paymentStatus = deriveAppointmentPaymentStatus({
    priceCents: appointmentTotalCents,
    depositRequiredCents,
    amountPaidCents: paidToDateCents + paymentTodayCents,
    amountRefundedCents,
  });
  const currency = input.currency ?? null;

  return {
    catalogPriceCents,
    taxInclusive: inclusive,
    taxRateBps: rateBps,
    taxLabel: label,
    subtotalCents,
    taxCents,
    appointmentTotalCents,
    depositRequiredCents,
    paymentTodayCents,
    paidToDateCents,
    amountRefundedCents,
    remainingBalanceCents,
    paymentStatus,
    currency,
    debug: {
      storedInclusive,
      effectiveInclusive: inclusive,
      source,
      taxRateId,
      taxable: rateBps > 0,
    },
    formatted: {
      catalogPrice: formatMoneyCents(catalogPriceCents, currency),
      subtotal: formatMoneyCents(subtotalCents, currency),
      tax: formatMoneyCents(taxCents, currency),
      appointmentTotal: formatMoneyCents(appointmentTotalCents, currency),
      depositRequired: formatMoneyCents(depositRequiredCents, currency),
      paymentToday: formatMoneyCents(paymentTodayCents, currency),
      paidToDate: formatMoneyCents(paidToDateCents, currency),
      remainingBalance: formatMoneyCents(remainingBalanceCents, currency),
    },
  };
}

/**
 * Rebuild financials from persisted appointment columns.
 * price_cents is always the exclusive subtotal; tax is never re-extracted
 * from the total. Catalog mode for display is therefore tax-exclusive.
 */
export function resolveFinancialsFromAppointment(input: {
  priceCents: number | null | undefined;
  taxCents?: number | null;
  depositCents?: number | null;
  amountPaidCents?: number | null;
  amountRefundedCents?: number | null;
  currency?: string | null;
  taxLabel?: string | null;
  taxRateBps?: number | null;
}): BookingFinancials {
  const subtotalCents = Math.max(0, Math.round(Number(input.priceCents ?? 0)));
  const taxCents = Math.max(0, Math.round(Number(input.taxCents ?? 0)));
  const f = resolveBookingFinancials({
    catalogPriceCents: subtotalCents,
    taxInclusive: false,
    taxCents,
    depositRequiredCents: input.depositCents,
    paidToDateCents: input.amountPaidCents,
    amountRefundedCents: input.amountRefundedCents,
    currency: input.currency,
  });
  if (input.taxLabel != null || input.taxRateBps != null) {
    return {
      ...f,
      taxLabel: input.taxLabel ?? f.taxLabel,
      taxRateBps:
        input.taxRateBps != null
          ? Math.max(0, Math.round(input.taxRateBps))
          : f.taxRateBps,
    };
  }
  return f;
}

/**
 * Resolve deposit requirement for payment sync / summaries.
 * Explicit configured cents always win — never Math.max with a % fallback.
 */
export function resolveConfiguredDepositCents(input: {
  appointmentDepositCents?: number | null;
  serviceDepositCents?: number | null;
  serviceDepositRequired?: boolean | null;
  appointmentTotalCents: number;
}): number {
  const explicit = Math.max(
    0,
    Math.round(Number(input.appointmentDepositCents ?? 0)),
    Math.round(Number(input.serviceDepositCents ?? 0)),
  );
  return resolveDepositRequiredCents({
    depositCents: explicit,
    depositRequired: input.serviceDepositRequired,
    baseCents: input.appointmentTotalCents,
  });
}

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
