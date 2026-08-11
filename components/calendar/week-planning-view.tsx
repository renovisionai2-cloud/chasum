"use client";

import { PlanningAppointmentRow } from "@/components/calendar/planning-appointment-row";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { CALENDAR_CANVAS_CLASS } from "@/lib/calendar/day-surface";
import {
  WEEK_VISIBLE_LIMIT,
  dayHasPlanningAttention,
  planningOverflow,
  truthfulAppointmentCountLabel,
} from "@/lib/calendar/planning-density";
import {
  WEEKDAY_LABELS,
  businessWeekCivilDates,
  civilDateToAnchor,
  formatCivilDateLong,
  groupAppointmentsByBusinessDay,
  isBusinessToday,
  weekdayIndexFromCivil,
} from "@/lib/calendar/planning-geometry";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type WeekPlanningViewProps = {
  date: Date;
  appointments: AppointmentWithRelations[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onInspectDay: (day: Date) => void;
  onPlanDay: (civilDate: string) => void;
  timeZone?: string | null;
  isNarrow?: boolean;
};

export function WeekPlanningView({
  date,
  appointments,
  onSelectAppointment,
  onInspectDay,
  onPlanDay,
  timeZone = null,
  isNarrow = false,
}: WeekPlanningViewProps) {
  const civilDays = useMemo(
    () => businessWeekCivilDates(date, timeZone),
    [date, timeZone],
  );
  const grouped = useMemo(
    () => groupAppointmentsByBusinessDay(appointments, timeZone),
    [appointments, timeZone],
  );
  const selectedCivil = calendarDateInTimezone(date, timeZone);
  const [overflowDay, setOverflowDay] = useState<string | null>(null);
  const overflowAppointments = overflowDay
    ? (grouped.get(overflowDay) ?? [])
    : [];

  return (
    <>
      <div
        className={cn(
          CALENDAR_CANVAS_CLASS,
          "overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-sm",
        )}
        data-calendar-view="week"
        data-calendar-canvas-width="full"
        data-planning-surface="week"
      >
        {isNarrow ? (
          <ol className="divide-y divide-border">
            {civilDays.map((civil) => (
              <WeekDayColumn
                key={civil}
                civilDate={civil}
                appointments={grouped.get(civil) ?? []}
                selected={civil === selectedCivil}
                timeZone={timeZone}
                stacked
                onSelectAppointment={onSelectAppointment}
                onInspectDay={onInspectDay}
                onPlanDay={onPlanDay}
                onOpenOverflow={setOverflowDay}
              />
            ))}
          </ol>
        ) : (
          <div className="grid w-full grid-cols-7">
            {civilDays.map((civil) => (
              <WeekDayColumn
                key={civil}
                civilDate={civil}
                appointments={grouped.get(civil) ?? []}
                selected={civil === selectedCivil}
                timeZone={timeZone}
                onSelectAppointment={onSelectAppointment}
                onInspectDay={onInspectDay}
                onPlanDay={onPlanDay}
                onOpenOverflow={setOverflowDay}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet
        open={Boolean(overflowDay)}
        onClose={() => setOverflowDay(null)}
        title={
          overflowDay
            ? formatCivilDateLong(overflowDay, timeZone)
            : "Day appointments"
        }
        description={
          overflowDay
            ? truthfulAppointmentCountLabel(overflowAppointments.length)
            : undefined
        }
      >
        <div className="space-y-2">
          {overflowAppointments.map((appointment) => (
            <PlanningAppointmentRow
              key={appointment.id}
              appointment={appointment}
              timeZone={timeZone}
              onSelect={(next) => {
                setOverflowDay(null);
                onSelectAppointment(next);
              }}
            />
          ))}
        </div>
        {overflowDay ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const civil = overflowDay;
                setOverflowDay(null);
                onPlanDay(civil);
              }}
            >
              New Appointment
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setOverflowDay(null)}
            >
              Close
            </Button>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

function WeekDayColumn({
  civilDate,
  appointments,
  selected,
  timeZone,
  stacked = false,
  onSelectAppointment,
  onInspectDay,
  onPlanDay,
  onOpenOverflow,
}: {
  civilDate: string;
  appointments: AppointmentWithRelations[];
  selected: boolean;
  timeZone: string | null | undefined;
  stacked?: boolean;
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onInspectDay: (day: Date) => void;
  onPlanDay: (civilDate: string) => void;
  onOpenOverflow: (civilDate: string) => void;
}) {
  const today = isBusinessToday(civilDate, timeZone);
  const overflow = planningOverflow(appointments.length, WEEK_VISIBLE_LIMIT);
  const visible = appointments.slice(0, overflow.visible);
  const weekday = WEEKDAY_LABELS[weekdayIndexFromCivil(civilDate)];
  const dayNumber = Number(civilDate.slice(8, 10));
  const attention = dayHasPlanningAttention(appointments);
  const dateLabel = formatCivilDateLong(civilDate, timeZone);

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col border-border",
        stacked ? "px-3 py-3" : "min-h-[28rem] border-r last:border-r-0",
        today && "bg-accent/15",
        selected && !today && "bg-muted/30",
      )}
      data-week-day={civilDate}
      data-today={today ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
    >
      <header
        className={cn(
          "flex items-start justify-between gap-2 border-b border-border/70",
          stacked ? "pb-2" : "px-2 py-2.5",
        )}
      >
        <button
          type="button"
          className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open ${dateLabel} in Day View`}
          aria-current={selected ? "date" : undefined}
          onClick={() => onInspectDay(civilDateToAnchor(civilDate, timeZone))}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {weekday}
          </p>
          <p
            className={cn(
              "mt-0.5 inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-sm font-semibold tabular-nums",
              today && "bg-primary text-primary-foreground",
              selected && !today && "ring-2 ring-foreground/40",
            )}
          >
            {dayNumber}
            <span className="sr-only">
              {today ? " Today" : ""}
              {selected ? " Selected" : ""}
            </span>
          </p>
        </button>
        <div className="text-right">
          {today ? (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
              Today
            </p>
          ) : null}
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {truthfulAppointmentCountLabel(appointments.length)}
          </p>
          {attention ? (
            <p className="text-[11px] font-medium text-foreground">Needs attention</p>
          ) : null}
        </div>
      </header>

      <div className={cn("flex flex-1 flex-col gap-1.5", stacked ? "pt-2" : "p-2")}>
        {appointments.length === 0 ? (
          <p className="px-0.5 py-3 text-xs text-muted-foreground">
            No appointments
          </p>
        ) : (
          visible.map((appointment) => (
            <PlanningAppointmentRow
              key={appointment.id}
              appointment={appointment}
              timeZone={timeZone}
              compact={!stacked}
              onSelect={onSelectAppointment}
            />
          ))
        )}
        {overflow.overflow > 0 ? (
          <button
            type="button"
            className="min-h-9 rounded-md border border-border bg-muted/50 px-2 text-center text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`View ${overflow.overflow} more appointments on ${dateLabel}`}
            onClick={() => onOpenOverflow(civilDate)}
          >
            {overflow.label}
          </button>
        ) : null}
      </div>

      <div className={cn(stacked ? "pt-2" : "mt-auto p-2 pt-0")}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onPlanDay(civilDate)}
        >
          New Appointment
        </Button>
      </div>
    </section>
  );
}
