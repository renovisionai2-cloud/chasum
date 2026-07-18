"use client";

import { Button } from "@/components/ui/button";
import type { BookingSheetAvailability } from "@/lib/actions/booking-sheet";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Loader2, UserRound, CalendarDays } from "lucide-react";

type AvailabilitySectionProps = {
  loading: boolean;
  availability: BookingSheetAvailability | null;
  selectedSlot: string | null;
  onSelectSlot: (iso: string) => void;
  onPickStaff: (staffId: string) => void;
  onPickDay: (date: string) => void;
};

export function AvailabilitySection({
  loading,
  availability,
  selectedSlot,
  onSelectSlot,
  onPickStaff,
  onPickDay,
}: AvailabilitySectionProps) {
  const slots = availability?.slots ?? [];
  const suggested = [...slots].sort((a, b) => b.score - a.score).slice(0, 8);

  return (
    <section className="space-y-4" aria-labelledby="bs-avail-heading">
      <div>
        <h3
          id="bs-avail-heading"
          className="text-sm font-semibold tracking-tight"
        >
          Availability
        </h3>
        <p className="text-xs text-muted-foreground">
          Suggested times from the Availability Engine — never invented locally
        </p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Checking real openings…
        </p>
      ) : null}

      {!loading && availability?.emptyReason ? (
        <div
          role="status"
          className="flex gap-2 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Why this time is blocked</p>
            <p className="mt-0.5 text-xs opacity-90">{availability.emptyReason}</p>
          </div>
        </div>
      ) : null}

      {!loading && suggested.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Suggested times
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {suggested.map((slot) => {
              const active = selectedSlot === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => onSelectSlot(slot.start)}
                  className={cn(
                    "rounded-[var(--radius-md)] border px-2 py-2 text-sm font-medium transition-colors",
                    "hover:border-primary hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-accent"
                      : "border-border bg-card",
                  )}
                  title={
                    slot.warnings.length
                      ? slot.warnings.join(" · ")
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3 opacity-70" aria-hidden />
                    {formatTime(parseISO(slot.start))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {!loading && (availability?.alternativeStaff.length ?? 0) > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Alternative employees
          </p>
          <ul className="space-y-1.5">
            {availability!.alternativeStaff.slice(0, 4).map((alt) => (
              <li key={alt.staffId}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto w-full justify-start gap-2 py-2"
                  onClick={() => onPickStaff(alt.staffId)}
                >
                  <UserRound className="size-3.5" aria-hidden />
                  <span className="flex-1 text-left">
                    {alt.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {alt.slotCount} openings
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && (availability?.alternativeDays.length ?? 0) > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Alternative days
          </p>
          <div className="flex flex-wrap gap-2">
            {availability!.alternativeDays.map((day) => (
              <Button
                key={day.date}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onPickDay(day.date)}
              >
                <CalendarDays className="size-3.5" aria-hidden />
                {day.label}
                <span className="text-muted-foreground">({day.slotCount})</span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {!loading &&
      !availability?.emptyReason &&
      suggested.length === 0 &&
      !(availability?.alternativeStaff.length ||
        availability?.alternativeDays.length) ? (
        <p className="text-sm text-muted-foreground">
          Choose service, employee, and date to load openings.
        </p>
      ) : null}
    </section>
  );
}
