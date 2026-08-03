"use client";

import { formatTime, parseISO } from "@/lib/calendar/utils";
import { timezoneLabel } from "@/lib/constants/timezones";
import { cn } from "@/lib/utils";
import { CalendarClock } from "lucide-react";
import { format } from "date-fns";

export type BookingSummaryCardProps = {
  startIso: string | null;
  durationMinutes?: number | null;
  serviceName?: string | null;
  locationName?: string | null;
  employeeName?: string | null;
  customerName?: string | null;
  timezone?: string | null;
  conflictMessage?: string | null;
  emptyHint?: string;
  className?: string;
  compact?: boolean;
};

export function BookingSummaryCard({
  startIso,
  durationMinutes = null,
  serviceName = null,
  locationName = null,
  employeeName = null,
  customerName = null,
  timezone = null,
  conflictMessage = null,
  emptyHint = "Choose a date and time to continue.",
  className,
  compact = false,
}: BookingSummaryCardProps) {
  if (!startIso) {
    return (
      <section
        className={cn(
          "rounded-[var(--radius-md)] border border-dashed border-border/80 bg-muted/15 px-3 py-3",
          className,
        )}
        aria-label="Selected appointment"
      >
        <p className="text-sm font-medium text-foreground">Selected appointment</p>
        <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p>
      </section>
    );
  }

  const start = parseISO(startIso);
  const mins =
    durationMinutes != null && durationMinutes >= 5
      ? Math.round(durationMinutes)
      : null;
  const end =
    mins != null ? new Date(start.getTime() + mins * 60_000) : null;
  const employeeLabel =
    employeeName?.trim() || "To be assigned";

  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-primary/20 bg-primary/[0.04] px-3 py-3 shadow-sm",
        conflictMessage && "border-amber-500/35 bg-amber-500/5",
        className,
      )}
      aria-label="Selected appointment"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarClock className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Selected appointment
          </p>
          {serviceName ? (
            <p className="mt-0.5 truncate text-sm font-semibold">{serviceName}</p>
          ) : null}
          <p className="mt-0.5 text-sm font-medium">
            {format(start, "EEEE, MMMM d, yyyy")}
          </p>
          <p className="text-sm tabular-nums text-foreground">
            {formatTime(start)}
            {end ? `–${formatTime(end)}` : null}
            {mins != null && !compact ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {mins} min
              </span>
            ) : null}
          </p>
          <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
            {customerName ? <p>Customer · {customerName}</p> : null}
            {locationName ? <p>{locationName}</p> : null}
            <p>
              Employee · {employeeLabel}
              {timezone ? ` · ${timezoneLabel(timezone)}` : null}
            </p>
          </div>
        </div>
      </div>
      {conflictMessage ? (
        <p className="mt-2 text-[11px] font-medium text-amber-800 dark:text-amber-200">
          Needs update
        </p>
      ) : null}
    </section>
  );
}
