"use client";

import { Button } from "@/components/ui/button";
import type { BookingStageVisualState } from "@/components/booking-sheet/booking-workflow";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BookingStageProps = {
  title: string;
  state: BookingStageVisualState;
  summary?: ReactNode;
  onChange?: () => void;
  children?: ReactNode;
  className?: string;
};

/**
 * Progressive workspace stage: only active content expands;
 * completed stages collapse to a compact editable summary.
 */
export function BookingStage({
  title,
  state,
  summary,
  onChange,
  children,
  className,
}: BookingStageProps) {
  if (state === "locked" || state === "upcoming") {
    return (
      <section
        className={cn(
          "rounded-[var(--radius-md)] border border-dashed border-border/70 px-3 py-2.5",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {state === "upcoming" ? "Next" : "Upcoming"}
          </span>
        </div>
      </section>
    );
  }

  if (state === "complete") {
    return (
      <section
        className={cn(
          "rounded-[var(--radius-md)] border border-border/80 bg-muted/20 px-3 py-2.5",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              ✓ {title}
            </p>
            <div className="text-sm text-foreground">{summary}</div>
          </div>
          {onChange ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-10 shrink-0 px-2 text-xs"
              onClick={onChange}
            >
              Change
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-primary/25 bg-card px-3 py-3 space-y-3",
        className,
      )}
      aria-current="step"
    >
      <p className="text-sm font-semibold tracking-tight">{title}</p>
      {children}
    </section>
  );
}
