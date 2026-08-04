"use client";

import type { BookingFinancials } from "@/lib/commerce/booking-financials";
import { cn } from "@/lib/utils";

type Props = {
  financials: BookingFinancials | null | undefined;
  className?: string;
};

/**
 * Preview-only financial truth panel. Hidden in production builds.
 */
export function BookingFinancialDebugPanel({ financials, className }: Props) {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") return null;
  if (!financials) return null;

  const d = financials.debug;
  const money = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <aside
      className={cn(
        "rounded-[var(--radius-md)] border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-950 dark:text-amber-50",
        className,
      )}
      aria-label="Financial debug"
    >
      <p className="font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
        Preview financial debug
      </p>
      <dl className="mt-1.5 space-y-0.5 tabular-nums">
        <div className="flex justify-between gap-3">
          <dt>Tax mode</dt>
          <dd className="font-semibold">
            {d.effectiveInclusive ? "Inclusive" : "Exclusive"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Stored inclusive</dt>
          <dd>{d.storedInclusive ? "true" : "false"}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt>Source</dt>
          <dd className="break-all font-mono text-[10px] opacity-90">
            {d.source}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Catalog</dt>
          <dd>{money(financials.catalogPriceCents)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Subtotal</dt>
          <dd>{money(financials.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>
            {financials.taxLabel ?? "Tax"} (
            {(financials.taxRateBps / 100).toFixed(
              financials.taxRateBps % 100 === 0 ? 0 : 2,
            )}
            %)
          </dt>
          <dd>{money(financials.taxCents)}</dd>
        </div>
        <div className="flex justify-between gap-3 font-semibold">
          <dt>Total</dt>
          <dd>{money(financials.appointmentTotalCents)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Deposit</dt>
          <dd>{money(financials.depositRequiredCents)}</dd>
        </div>
      </dl>
      {d.effectiveInclusive ? (
        <p className="mt-2 text-[10px] leading-snug opacity-90">
          Inclusive mode extracts tax from the catalog price. For tax-exclusive
          posted prices, set tax_rates.inclusive = false on the active rate.
        </p>
      ) : null}
    </aside>
  );
}
