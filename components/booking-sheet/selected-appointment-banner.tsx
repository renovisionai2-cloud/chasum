"use client";

import { formatTime, parseISO } from "@/lib/calendar/utils";
import { timezoneLabel } from "@/lib/constants/timezones";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { format } from "date-fns";

type SelectedAppointmentBannerProps = {
  startIso: string | null;
  durationMinutes: number;
  locationName: string | null;
  employeeName: string | null;
  timezone: string | null;
  slotConflict: string | null;
};

export function SelectedAppointmentBanner({
  startIso,
  durationMinutes,
  locationName,
  employeeName,
  timezone,
  slotConflict,
}: SelectedAppointmentBannerProps) {
  if (!startIso) {
    return (
      <section
        className="rounded-[var(--radius-md)] border border-dashed border-border bg-muted/20 px-3 py-3"
        aria-labelledby="bs-selected-heading"
      >
        <h3
          id="bs-selected-heading"
          className="text-sm font-semibold tracking-tight"
        >
          Selected Appointment
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Click a calendar slot or choose a time below. The selected time stays
          authoritative until you change it.
        </p>
      </section>
    );
  }

  const start = parseISO(startIso);
  const end = new Date(start.getTime() + Math.max(5, durationMinutes) * 60_000);

  return (
    <section
      className="rounded-[var(--radius-md)] border border-primary/25 bg-accent/30 px-3 py-3"
      aria-labelledby="bs-selected-heading"
    >
      <div className="flex items-start gap-2">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3
            id="bs-selected-heading"
            className="text-sm font-semibold tracking-tight"
          >
            Selected Appointment
          </h3>
          <p className="mt-1 text-sm font-medium">
            {format(start, "EEEE, MMMM d, yyyy")}
          </p>
          <p className="text-sm tabular-nums">
            {formatTime(start)}–{formatTime(end)}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {durationMinutes}m
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {locationName || "Location"}
            {" · "}
            {employeeName?.trim() ? employeeName : "Unassigned"}
            {timezone ? ` · ${timezoneLabel(timezone)}` : null}
          </p>
        </div>
      </div>
      {slotConflict ? (
        <div
          role="alert"
          className="mt-2 flex gap-2 rounded-[var(--radius-sm)] border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-950 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Selected time is no longer available</p>
            <p className="mt-0.5 opacity-90">{slotConflict}</p>
            <p className="mt-1 opacity-90">
              Choose another valid time below. The original selection stays
              visible until you pick a replacement.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
