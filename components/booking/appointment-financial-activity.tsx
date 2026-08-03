"use client";

import type { AppointmentFinancialActivity } from "@/lib/commerce/appointment-financial-activity";
import { cn } from "@/lib/utils";
import { CircleDollarSign } from "lucide-react";

type Props = {
  activity: AppointmentFinancialActivity | null;
  loading?: boolean;
  className?: string;
  /** Compact drawer styling vs fuller sheet. */
  variant?: "drawer" | "panel";
};

/**
 * Shared financial activity list for appointment drawer / timeline surfaces.
 * Renders commerce payment events only — never raw JSON.
 */
export function AppointmentFinancialActivityList({
  activity,
  loading = false,
  className,
  variant = "drawer",
}: Props) {
  if (loading) {
    return (
      <p className="text-xs text-muted-foreground">Loading payment history…</p>
    );
  }

  const items = activity?.items ?? [];

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No payment history for this appointment yet.
      </p>
    );
  }

  return (
    <ol
      className={cn(
        "space-y-3 border-l border-emerald-600/30 pl-3",
        className,
      )}
      aria-label="Financial activity"
    >
      {items.map((item) => (
        <li key={item.dedupeKey} className="relative text-xs">
          <span
            className="absolute -left-[1.05rem] top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
            aria-hidden
          >
            <CircleDollarSign className="size-2.5" />
          </span>
          <p className="font-semibold text-foreground">{item.title}</p>
          <p className="mt-0.5 tabular-nums text-foreground">
            {item.amountLabel} by {item.methodLabel}
          </p>
          <p className="text-muted-foreground">
            {item.paymentTypeLabel}
            {item.sourceLabel ? ` · ${item.sourceLabel}` : null}
          </p>
          {item.note ? (
            <p className="mt-0.5 text-muted-foreground">{item.note}</p>
          ) : null}
          {item.transactionRef && variant !== "drawer" ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Transaction: {item.transactionRef}
            </p>
          ) : item.transactionRef ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Ref {item.transactionRef}
            </p>
          ) : null}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {item.occurredAtLabel}
          </p>
        </li>
      ))}
    </ol>
  );
}
