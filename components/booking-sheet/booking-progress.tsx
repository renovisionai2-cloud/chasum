"use client";

import {
  BOOKING_PROGRESS_STEPS,
  bookingDecisionAccess,
  bookingDecisionLabel,
  type BookingDecision,
  type BookingDecisionAccess,
  type BookingFacts,
} from "@/components/booking-sheet/booking-workflow";
import { cn } from "@/lib/utils";

/**
 * Compact progress for the adaptive workspace.
 * Completed / prefilled stages are real controls; unavailable stages are
 * visibly disabled (never silent dead clicks).
 */
export function BookingProgressIndicator({
  active,
  known,
  facts,
  onNavigate,
}: {
  active: BookingDecision;
  /** Decisions already satisfied by context or user choice. */
  known: Partial<Record<BookingDecision, boolean>>;
  facts: BookingFacts;
  onNavigate: (decision: Exclude<BookingDecision, "success">) => void;
}) {
  return (
    <nav
      aria-label="Booking progress"
      className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground"
    >
      {BOOKING_PROGRESS_STEPS.map((step, index) => {
        const isActive = step === active;
        const done = Boolean(known[step]) && !isActive;
        const access: BookingDecisionAccess = bookingDecisionAccess(
          step,
          facts,
        );
        const disabled = !access.accessible;

        return (
          <span key={step} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <span className="text-border" aria-hidden>
                →
              </span>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              title={disabled ? access.reason : undefined}
              aria-label={
                disabled && access.reason
                  ? `${bookingDecisionLabel(step)} — ${access.reason}`
                  : bookingDecisionLabel(step)
              }
              aria-current={isActive ? "step" : undefined}
              aria-disabled={disabled || undefined}
              onClick={() => {
                if (disabled) return;
                onNavigate(step);
              }}
              className={cn(
                "rounded-md px-1.5 py-0.5 font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isActive && "bg-primary/10 text-primary",
                done && !disabled && "text-foreground hover:bg-muted/60",
                !isActive &&
                  !done &&
                  !disabled &&
                  "hover:bg-muted/40 hover:text-foreground",
                disabled &&
                  "cursor-not-allowed opacity-45 text-muted-foreground",
                !disabled && "cursor-pointer",
              )}
            >
              {done ? "✓ " : ""}
              {bookingDecisionLabel(step)}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
