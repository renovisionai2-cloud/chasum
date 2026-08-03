"use client";

import { formatMoneyCents } from "@/lib/commerce/money";
import type { BookingFinancials } from "@/lib/commerce/booking-financials";
import { cn } from "@/lib/utils";

export type BookingPriceSummaryProps = {
  /** Prefer passing resolved financials — single source of truth. */
  financials?: BookingFinancials | null;
  /** @deprecated Prefer `financials` */
  subtotalCents?: number;
  taxCents?: number | null;
  totalCents?: number | null;
  depositCents?: number | null;
  discountCents?: number | null;
  currency?: string | null;
  loading?: boolean;
  className?: string;
};

export function BookingPriceSummary({
  financials,
  subtotalCents,
  taxCents = 0,
  totalCents = null,
  depositCents = null,
  discountCents = null,
  currency = "usd",
  loading = false,
  className,
}: BookingPriceSummaryProps) {
  const subtotal = financials?.subtotalCents ?? Math.max(0, subtotalCents ?? 0);
  const tax = financials?.taxCents ?? Math.max(0, Math.round(taxCents ?? 0));
  const discount = Math.max(0, Math.round(discountCents ?? 0));
  const total =
    financials?.appointmentTotalCents ??
    (totalCents != null
      ? Math.max(0, totalCents)
      : Math.max(0, subtotal - discount + tax));
  const deposit =
    financials?.depositRequiredCents ??
    (depositCents != null && Number.isFinite(depositCents) ? depositCents : 0);
  const showDeposit = deposit > 0;
  const cur = financials?.currency ?? currency;

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-border bg-card px-3 py-3",
          className,
        )}
        aria-busy
      >
        <p className="text-xs text-muted-foreground">Calculating total…</p>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-border bg-card px-3 py-3",
        className,
      )}
      aria-label="Price summary"
    >
      <p className="text-sm font-medium">Price</p>
      <dl className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{formatMoneyCents(subtotal, cur)}</dd>
        </div>
        {discount > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="tabular-nums text-success">
              −{formatMoneyCents(discount, cur)}
            </dd>
          </div>
        ) : null}
        {tax > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="tabular-nums">{formatMoneyCents(tax, cur)}</dd>
          </div>
        ) : null}
        {showDeposit ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Deposit due</dt>
            <dd className="tabular-nums">{formatMoneyCents(deposit, cur)}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-semibold">Appointment total</dt>
          <dd className="text-base font-semibold tabular-nums">
            {formatMoneyCents(total, cur)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
