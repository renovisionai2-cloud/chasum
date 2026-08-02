"use client";

import { formatMoneyCents } from "@/lib/commerce/money";
import { cn } from "@/lib/utils";

export type BookingPriceSummaryProps = {
  subtotalCents: number;
  taxCents?: number | null;
  depositCents?: number | null;
  discountCents?: number | null;
  currency?: string | null;
  loading?: boolean;
  className?: string;
};

export function BookingPriceSummary({
  subtotalCents,
  taxCents = 0,
  depositCents = null,
  discountCents = null,
  currency = "usd",
  loading = false,
  className,
}: BookingPriceSummaryProps) {
  const tax = Math.max(0, Math.round(taxCents ?? 0));
  const discount = Math.max(0, Math.round(discountCents ?? 0));
  const total = Math.max(0, subtotalCents - discount + tax);
  const showDeposit =
    depositCents != null && Number.isFinite(depositCents) && depositCents > 0;

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
          <dd className="tabular-nums">
            {formatMoneyCents(subtotalCents, currency)}
          </dd>
        </div>
        {discount > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="tabular-nums text-success">
              −{formatMoneyCents(discount, currency)}
            </dd>
          </div>
        ) : null}
        {tax > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="tabular-nums">{formatMoneyCents(tax, currency)}</dd>
          </div>
        ) : null}
        {showDeposit ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Deposit due</dt>
            <dd className="tabular-nums">
              {formatMoneyCents(depositCents!, currency)}
            </dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-semibold">Total</dt>
          <dd className="text-base font-semibold tabular-nums">
            {formatMoneyCents(total, currency)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
