"use client";

import {
  AvailableTimeSelector,
  type AvailableTimeSelectorHandle,
} from "@/components/scheduling/available-time-selector";
import { Button } from "@/components/ui/button";
import type { BookingSheetAvailability } from "@/lib/actions/booking-sheet";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { AlertTriangle, CalendarDays, Loader2, UserRound } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef } from "react";

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
  /** Progressive Time step: grid always visible. */
  workspaceMode?: boolean;
};

export type AvailabilitySectionHandle = {
  focusTimes: () => void;
};

export const AvailabilitySection = forwardRef<
  AvailabilitySectionHandle,
  AvailabilitySectionProps
>(function AvailabilitySection(
  {
    loading,
    availability,
    selectedSlot,
    selectedSlotValid,
    onSelectSlot,
    onPickStaff,
    onPickDay,
    unassigned = false,
    workspaceMode = false,
  },
  ref,
) {
  const timeRef = useRef<AvailableTimeSelectorHandle>(null);
  useImperativeHandle(ref, () => ({
    focusTimes: () => timeRef.current?.focus(),
  }));

  const slots = availability?.slots ?? [];
  const selectedInDay = Boolean(
    selectedSlot &&
      slots.some((s) => slotKey(s.start) === slotKey(selectedSlot)),
  );

  return (
    <section className="space-y-4" aria-labelledby="bs-avail-heading">
      {!workspaceMode ? (
        <div>
          <h3
            id="bs-avail-heading"
            className="text-sm font-semibold tracking-tight"
          >
            Date and time
          </h3>
          <p className="text-xs text-muted-foreground">
            {unassigned
              ? "Showing openings across your team. You can assign an employee later."
              : "Choose an open time for this appointment."}
          </p>
        </div>
      ) : (
        <h3 id="bs-avail-heading" className="sr-only">
          Available times
        </h3>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Checking availability…
        </p>
      ) : null}

      {!loading && selectedSlot && !selectedSlotValid ? (
        <div
          role="status"
          className="flex gap-2 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Selected time needs an update</p>
            <p className="mt-0.5 text-xs opacity-90">
              {formatTime(parseISO(selectedSlot))} is still selected but is not
              currently available. Choose another time below.
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
            <p className="font-medium">No openings right now</p>
            <p className="mt-0.5 text-xs opacity-90">{availability.emptyReason}</p>
          </div>
        </div>
      ) : null}

      {!loading && slots.length > 0 ? (
        <AvailableTimeSelector
          ref={timeRef}
          slots={slots.map((s) => ({ start: s.start }))}
          selectedStart={selectedSlot}
          onSelect={onSelectSlot}
          loading={loading}
          selectedInvalid={Boolean(selectedSlot && !selectedSlotValid)}
          forceExpanded={Boolean(selectedSlot && !selectedSlotValid)}
          alwaysExpanded={workspaceMode}
          intervalMinutes={availability?.intervalMinutes}
          timezone={availability?.timezone}
          selectedInvalidHint={
            selectedSlot && !selectedInDay
              ? `${formatTime(parseISO(selectedSlot))} is already booked or unavailable. Choose another time.`
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
                      {alt.slotCount <= 5
                        ? `${alt.slotCount} times available`
                        : "Available today"}
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
                <span className="text-muted-foreground">
                  {day.slotCount <= 5
                    ? ` · ${day.slotCount} times`
                    : " · Times available"}
                </span>
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
});
