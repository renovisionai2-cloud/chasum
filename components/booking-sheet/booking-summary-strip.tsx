"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type SummaryChip = {
  id: string;
  label: string;
  value: string;
  onChange?: () => void;
};

/**
 * Compact strip of known booking facts — not full completed stage cards.
 */
export function BookingSummaryStrip({
  chips,
  className,
}: {
  chips: SummaryChip[];
  className?: string;
}) {
  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] border border-border/70 bg-muted/15 px-2.5 py-1.5",
        className,
      )}
      aria-label="Booking summary"
    >
      {chips.map((chip, i) => (
        <span key={chip.id} className="inline-flex min-w-0 items-center gap-1">
          {i > 0 ? (
            <span className="text-border" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="min-w-0 truncate text-sm">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {chip.label}
            </span>
            <span className="font-medium">{chip.value}</span>
          </span>
          {chip.onChange ? (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              className="h-7 min-h-7 shrink-0 rounded-md px-2 text-[11px]"
              onClick={chip.onChange}
            >
              Change
            </Button>
          ) : null}
        </span>
      ))}
    </div>
  );
}

export function BookingDecisionFrame({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("space-y-2.5", className)}
      aria-labelledby="bs-decision-title"
      aria-current="step"
    >
      <div>
        <h3
          id="bs-decision-title"
          className="text-base font-semibold tracking-tight"
        >
          {title}
        </h3>
        {hint ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
