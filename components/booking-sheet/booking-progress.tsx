"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { id: "customer", label: "Customer" },
  { id: "appointment", label: "Appointment" },
  { id: "time", label: "Time" },
  { id: "review", label: "Review" },
] as const;

export type BookingProgressStep = (typeof STEPS)[number]["id"];

export function BookingProgressIndicator({
  active,
  completed,
}: {
  active: BookingProgressStep;
  completed: Partial<Record<BookingProgressStep, boolean>>;
}) {
  const activeIndex = STEPS.findIndex((s) => s.id === active);

  return (
    <nav
      aria-label="Booking progress"
      className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground"
    >
      {STEPS.map((step, index) => {
        const done = Boolean(completed[step.id]);
        const isActive = step.id === active;
        return (
          <span key={step.id} className="inline-flex items-center gap-1.5">
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
              {step.label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
