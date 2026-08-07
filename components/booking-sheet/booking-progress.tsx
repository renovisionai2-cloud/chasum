"use client";

import { cn } from "@/lib/utils";
import type { BookingWorkflowStep } from "@/components/booking-sheet/booking-workflow";
import { BOOKING_WORKFLOW_STEPS } from "@/components/booking-sheet/booking-workflow";

const LABELS: Record<BookingWorkflowStep, string> = {
  customer: "Customer",
  appointment: "Appointment",
  time: "Time",
  payment: "Payment",
  confirm: "Confirm",
};

export type BookingProgressStep = BookingWorkflowStep;

export function BookingProgressIndicator({
  active,
  completed,
}: {
  active: BookingWorkflowStep;
  completed: Partial<Record<BookingWorkflowStep, boolean>>;
}) {
  const activeIndex = BOOKING_WORKFLOW_STEPS.indexOf(active);

  return (
    <nav
      aria-label="Booking progress"
      className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground"
    >
      {BOOKING_WORKFLOW_STEPS.map((step, index) => {
        const done = Boolean(completed[step]);
        const isActive = step === active;
        return (
          <span key={step} className="inline-flex items-center gap-1.5">
            {index > 0 ? (
              <span className="text-border" aria-hidden>
                →
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 font-medium",
                isActive && "bg-primary/10 text-primary",
                done && !isActive && "text-foreground",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {done && !isActive ? "✓ " : index < activeIndex ? "✓ " : ""}
              {LABELS[step]}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
