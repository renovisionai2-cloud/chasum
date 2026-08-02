"use client";

import { AvailableTimeSelector } from "@/components/scheduling/available-time-selector";
import { Button } from "@/components/ui/button";
import type { BookingSheetAvailability } from "@/lib/actions/booking-sheet";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { AlertTriangle, CalendarDays, Loader2, UserRound } from "lucide-react";

function slotKey(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

type AvailabilitySectionProps = {
  loading: boolean;
  availability: BookingSheetAvailability | null;
  selectedSlot: string | null;
  selectedSlotValid: boolean;
  onSelectSlot: (iso: string) => void;
  onPickStaff: (staffId: string) => void;
  onPickDay: (date: string) => void;
  unassigned?: boolean;
};

export function AvailabilitySection({
  loading,
  availability,
  selectedSlot,
  selectedSlotValid,
  onSelectSlot,
  onPickStaff,
  onPickDay,
  unassigned = false,
}: AvailabilitySectionProps) {
  const slots = availability?.slots ?? [];
  const selectedInDay = Boolean(
    selectedSlot &&
      slots.some((s) => slotKey(s.start) === slotKey(selectedSlot)),
  );

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
          {unassigned
            ? "Openings across eligible employees — assign staff later if needed."
            : "Suggested times from the Availability Engine — never invented locally."}
        </p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Checking real openings…
        </p>
      ) : null}

      {!loading && selectedSlot && !selectedSlotValid ? (
        <div
          role="status"
          className="flex gap-2 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Selected calendar slot needs a new time</p>
            <p className="mt-0.5 text-xs opacity-90">
              {formatTime(parseISO(selectedSlot))} is kept as your selection but
              is not currently bookable. Pick another opening below.
            </p>
          </div>
        </div>
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

      {!loading && slots.length > 0 ? (
        <AvailableTimeSelector
          slots={slots.map((s) => ({ start: s.start }))}
          selectedStart={selectedSlot}
          onSelect={onSelectSlot}
          loading={loading}
          selectedInvalid={Boolean(selectedSlot && !selectedSlotValid)}
          forceExpanded={Boolean(selectedSlot && !selectedSlotValid)}
          selectedInvalidHint={
            selectedSlot && !selectedInDay
              ? `${formatTime(parseISO(selectedSlot))} is not in today’s open list. Choose another time.`
              : null
          }
        />
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
      slots.length === 0 &&
      !(availability?.alternativeStaff.length ||
        availability?.alternativeDays.length) ? (
        <p className="text-sm text-muted-foreground">
          Choose service and date to load openings
          {unassigned ? "" : " (employee optional)"}.
        </p>
      ) : null}
    </section>
  );
}
