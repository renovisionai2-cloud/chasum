"use client";

import { PlanningAppointmentRow } from "@/components/calendar/planning-appointment-row";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import { CALENDAR_CANVAS_CLASS } from "@/lib/calendar/day-surface";
import {
  MONTH_VISIBLE_LIMIT,
  dayHasPlanningAttention,
  planningOverflow,
  truthfulAppointmentCountLabel,
} from "@/lib/calendar/planning-density";
import {
  WEEKDAY_LABELS,
  businessMonthGridCivilDates,
  civilDateToAnchor,
  civilMonthKey,
  formatCivilDateLong,
  groupAppointmentsByBusinessDay,
  isBusinessToday,
} from "@/lib/calendar/planning-geometry";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type MonthPlanningViewProps = {
  date: Date;
  appointments: AppointmentWithRelations[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onInspectDay: (day: Date) => void;
  onPlanDay: (civilDate: string) => void;
  timeZone?: string | null;
  isNarrow?: boolean;
};

export function MonthPlanningView({
  date,
  appointments,
  onSelectAppointment,
  onInspectDay,
  onPlanDay,
  timeZone = null,
  isNarrow = false,
}: MonthPlanningViewProps) {
  const cells = useMemo(
    () => businessMonthGridCivilDates(date, timeZone),
    [date, timeZone],
  );
  const grouped = useMemo(
    () => groupAppointmentsByBusinessDay(appointments, timeZone),
    [appointments, timeZone],
  );
  const selectedCivil = calendarDateInTimezone(date, timeZone);
  const currentMonth = civilMonthKey(selectedCivil);
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
        data-calendar-view="month"
        data-calendar-canvas-width="full"
        data-planning-surface="month"
      >
        <div className="sticky top-0 z-10 grid w-full grid-cols-7 border-b border-border bg-card">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-1 py-2.5 text-center text-[11px] font-medium text-muted-foreground sm:text-xs"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid w-full grid-cols-7">
          {cells.map((civil) => {
            const dayAppts = grouped.get(civil) ?? [];
            const inMonth = civilMonthKey(civil) === currentMonth;
            const today = isBusinessToday(civil, timeZone);
            const selected = civil === selectedCivil;
            const overflow = planningOverflow(
              dayAppts.length,
              isNarrow ? 0 : MONTH_VISIBLE_LIMIT,
            );
            const visible = isNarrow ? [] : dayAppts.slice(0, overflow.visible);
            const dayNumber = Number(civil.slice(8, 10));
            const dateLabel = formatCivilDateLong(civil, timeZone);
            const attention = dayHasPlanningAttention(dayAppts);

            return (
              <div
                key={civil}
                className={cn(
                  "flex min-h-[5.5rem] flex-col border-b border-r border-border p-1.5 sm:min-h-[7.5rem] sm:p-2",
                  !inMonth && "bg-muted/25 text-muted-foreground",
                  today && "bg-accent/20",
                  selected && !today && "ring-inset ring-2 ring-foreground/25",
                )}
                data-month-day={civil}
                data-today={today ? "true" : "false"}
                data-selected={selected ? "true" : "false"}
                data-outside-month={inMonth ? "false" : "true"}
              >
                <div className="flex items-start justify-between gap-1">
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm tabular-nums transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      today && "bg-primary font-semibold text-primary-foreground",
                      selected && !today && "font-semibold ring-2 ring-foreground/40",
                    )}
                    aria-label={`Open ${dateLabel} in Day View`}
                    aria-current={selected ? "date" : undefined}
                    onClick={() =>
                      onInspectDay(civilDateToAnchor(civil, timeZone))
                    }
                  >
                    {dayNumber}
                    <span className="sr-only">
                      {today ? " Today" : ""}
                      {selected ? " Selected" : ""}
                      {inMonth ? "" : " Outside month"}
                    </span>
                  </button>
                  {dayAppts.length > 0 ? (
                    <span className="pt-1 text-[10px] tabular-nums text-muted-foreground">
                      {dayAppts.length}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 flex min-h-0 flex-1 flex-col gap-1">
                  {visible.map((appointment) => (
                    <PlanningAppointmentRow
                      key={appointment.id}
                      appointment={appointment}
                      timeZone={timeZone}
                      compact
                      onSelect={onSelectAppointment}
                    />
                  ))}
                  {isNarrow && dayAppts.length > 0 ? (
                    <button
                      type="button"
                      className={cn(
                        "mt-auto h-1.5 w-full rounded-full",
                        attention ? "bg-foreground/70" : "bg-foreground/25",
                      )}
                      aria-label={`${truthfulAppointmentCountLabel(dayAppts.length)} on ${dateLabel}`}
                      onClick={() =>
                        onInspectDay(civilDateToAnchor(civil, timeZone))
                      }
                    />
                  ) : null}
                  {!isNarrow && overflow.overflow > 0 ? (
                    <button
                      type="button"
                      className="mt-auto min-h-8 rounded-[var(--radius-sm)] border border-border bg-muted/60 px-1.5 text-center text-[11px] font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`View ${overflow.overflow} more appointments on ${dateLabel}`}
                      onClick={() => setOverflowDay(civil)}
                    >
                      {overflow.label}
                    </button>
                  ) : null}
                  {!isNarrow &&
                  dayAppts.length > 0 &&
                  overflow.overflow === 0 ? (
                    <p className="mt-auto text-[10px] tabular-nums text-muted-foreground">
                      {truthfulAppointmentCountLabel(dayAppts.length)}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
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
              onClick={() => {
                if (!overflowDay) return;
                const civil = overflowDay;
                setOverflowDay(null);
                onInspectDay(civilDateToAnchor(civil, timeZone));
              }}
            >
              Open day
            </Button>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}
