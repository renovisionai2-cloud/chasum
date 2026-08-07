"use client";

import {
  bookingDecisionLabel,
  type BookingDecision,
} from "@/components/booking-sheet/booking-workflow";
import { cn } from "@/lib/utils";

/**
 * Compact progress for the adaptive workspace — current decision only emphasized.
 */
export function BookingProgressIndicator({
  active,
  known,
}: {
  active: BookingDecision;
  /** Decisions already satisfied by context or user choice. */
  known: Partial<Record<BookingDecision, boolean>>;
}) {
  const steps: BookingDecision[] = [
    "customer",
    "service",
    "employee",
    "datetime",
    "payment",
    "review",
  ];

  return (
    <nav
      aria-label="Booking progress"
      className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground"
    >
      {steps.map((step, index) => {
        const isActive = step === active;
        const done = Boolean(known[step]) && !isActive;
        return (
          <span key={step} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <span className="text-border" aria-hidden>
                →
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 font-medium",
                isActive && "bg-primary/10 text-primary",
                done && "text-foreground",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {done ? "✓ " : ""}
              {bookingDecisionLabel(step)}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
