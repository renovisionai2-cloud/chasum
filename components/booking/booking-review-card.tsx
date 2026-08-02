"use client";

import { formatMoneyCents } from "@/lib/commerce/money";
import { cn } from "@/lib/utils";

export type BookingReviewCardProps = {
  customerName: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  locationName: string | null;
  employeeName: string | null;
  subtotalCents: number;
  taxCents?: number | null;
  totalCents: number;
  currency?: string | null;
  confirmationHint?: string | null;
  className?: string;
};

/**
 * Final review summary shown when a booking is ready to confirm.
 */
export function BookingReviewCard({
  customerName,
  serviceName,
  dateLabel,
  timeLabel,
  locationName,
  employeeName,
  subtotalCents,
  taxCents = 0,
  totalCents,
  currency = "usd",
  confirmationHint = "Email and SMS when enabled for this business",
  className,
}: BookingReviewCardProps) {
  const tax = Math.max(0, Math.round(taxCents ?? 0));

  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-border bg-card px-3.5 py-3.5 shadow-sm",
        className,
      )}
      aria-label="Review appointment"
    >
      <p className="text-sm font-semibold tracking-tight">Review</p>
      <div className="mt-3 space-y-2.5 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Service</p>
          <p className="font-medium">{serviceName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">When</p>
          <p className="font-medium">{dateLabel}</p>
          <p className="tabular-nums text-muted-foreground">{timeLabel}</p>
        </div>
        {locationName ? (
          <div>
            <p className="text-xs text-muted-foreground">Where</p>
            <p className="font-medium">{locationName}</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs text-muted-foreground">Employee</p>
          <p className="font-medium">
            {employeeName?.trim() || "To be assigned"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Customer</p>
          <p className="font-medium">{customerName}</p>
        </div>
        <div className="border-t border-border pt-2.5 space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">
              {formatMoneyCents(subtotalCents, currency)}
            </span>
          </div>
          {tax > 0 ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">
                {formatMoneyCents(tax, currency)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {formatMoneyCents(totalCents, currency)}
            </span>
          </div>
        </div>
        {confirmationHint ? (
          <p className="text-xs text-muted-foreground">
            Confirmation · {confirmationHint}
          </p>
        ) : null}
      </div>
    </section>
  );
}
