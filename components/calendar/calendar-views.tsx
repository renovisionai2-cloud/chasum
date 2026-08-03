"use client";

import {
  AppointmentBlock,
  CurrentTimeIndicator,
  TimeSlotDropZone,
  type CalendarColorMode,
} from "@/components/calendar/appointment-block";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  assignOverlapLayout,
  formatTime,
  getHourSlots,
  isSameDay,
  parseISO,
} from "@/lib/calendar/utils";
import { getAppointmentBlockStyle } from "@/lib/calendar/status-colors";
import { DEFAULT_BOOKING_INTERVAL_MINUTES } from "@/lib/booking/interval";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

type ViewProps = {
  date: Date;
  appointments: AppointmentWithRelations[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onSelectSlot: (date: Date) => void;
  onReschedule?: (appointment: AppointmentWithRelations, newStart: Date) => void;
  onResize?: (appointment: AppointmentWithRelations, newEnd: Date) => void;
  colorMode?: CalendarColorMode;
  /** Booking start-time interval from business/location settings. */
  intervalMinutes?: number;
};

const TIME_COL = "w-16 shrink-0 sm:w-[4.25rem]";

export function DayView({
  date,
  appointments,
  onSelectAppointment,
  onSelectSlot,
  onReschedule,
  onResize,
  colorMode = "service",
  intervalMinutes = DEFAULT_BOOKING_INTERVAL_MINUTES,
}: ViewProps) {
  const hours = getHourSlots();
  const dayAppointments = appointments.filter((appt) =>
    isSameDay(parseISO(appt.start_time), date),
  );
  const layout = assignOverlapLayout(dayAppointments);
  const showNow = isSameDay(date, new Date());
  const isToday = showNow;

  return (
    <div className="max-h-[min(70vh,52rem)] scroll-smooth overflow-auto rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
      <div
        className={cn(
          "sticky top-0 z-20 border-b border-border px-3 py-2.5 backdrop-blur-sm",
          isToday ? "bg-accent/50" : "bg-card/95",
        )}
      >
        <p className="text-sm font-semibold">
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
          {isToday ? (
            <span className="ml-2 text-xs font-medium text-primary">Today</span>
          ) : null}
        </p>
        {dayAppointments.length === 0 ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Nothing scheduled — click a slot or use Quick Actions to book.
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {dayAppointments.length} appointment
            {dayAppointments.length === 1 ? "" : "s"}
          </p>
        )}
      </div>
      <div className="relative min-w-0">
        {hours.map((hour) => (
          <div
            key={hour}
            className="flex border-b border-border/80 last:border-b-0"
          >
            <div
              className={cn(
                "sticky left-0 z-10 border-r border-border bg-card px-2 py-5 text-right text-[11px] tabular-nums text-muted-foreground sm:text-xs",
                TIME_COL,
              )}
            >
              {formatTime(new Date(2024, 0, 1, hour))}
            </div>
            <TimeSlotDropZone
              date={date}
              hour={hour}
              intervalMinutes={intervalMinutes}
              className="relative min-h-[68px] w-full border-l border-transparent"
              onClick={onSelectSlot}
              onDrop={(slot, appointmentId) => {
                if (appointmentId && onReschedule) {
                  const appointment = dayAppointments.find(
                    (appt) => appt.id === appointmentId,
                  );
                  if (appointment) onReschedule(appointment, slot);
                  return;
                }
                onSelectSlot(slot);
              }}
            />
          </div>
        ))}

        <div className={cn("pointer-events-none absolute inset-0", "pl-16 sm:pl-[4.25rem]")}>
          <CurrentTimeIndicator show={showNow} />
          {dayAppointments.map((appt) => {
            const pack = layout.get(appt.id);
            return (
              <AppointmentBlock
                key={appt.id}
                appointment={appt}
                onSelect={onSelectAppointment}
                onResize={onResize}
                colorMode={colorMode}
                draggable={!!onReschedule}
                column={pack?.column ?? 0}
                columns={pack?.columns ?? 1}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function WeekView({
  date,
  appointments,
  onSelectAppointment,
  onSelectSlot,
  onReschedule,
  onResize,
  colorMode = "service",
  intervalMinutes = DEFAULT_BOOKING_INTERVAL_MINUTES,
}: ViewProps) {
  const hours = getHourSlots();
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const todayInWeek = days.some((d) => isSameDay(d, new Date()));

  return (
    <div className="max-h-[min(70vh,52rem)] scroll-smooth overflow-auto rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
      <div className="min-w-[780px]">
        <div className="sticky top-0 z-20 flex border-b border-border bg-card/95 backdrop-blur-sm">
          <div
            className={cn(
              "sticky left-0 z-30 border-r border-border bg-card",
              TIME_COL,
            )}
          />
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 border-l border-border px-1 py-2.5 text-center sm:px-2",
                  isToday && "bg-accent/50",
                )}
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p
                  className={cn(
                    "mx-auto flex h-7 w-7 items-center justify-center text-sm font-semibold tabular-nums",
                    isToday &&
                      "rounded-full bg-primary text-primary-foreground",
                  )}
                >
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="flex border-b border-border/80 last:border-b-0">
              <div
                className={cn(
                  "sticky left-0 z-10 border-r border-border bg-card px-2 py-4 text-right text-[11px] tabular-nums text-muted-foreground sm:text-xs",
                  TIME_COL,
                )}
              >
                {formatTime(new Date(2024, 0, 1, hour))}
              </div>
              {days.map((day) => (
                <TimeSlotDropZone
                  key={`${day.toISOString()}-${hour}`}
                  date={day}
                  hour={hour}
                  intervalMinutes={intervalMinutes}
                  className={cn(
                    "min-h-[56px] flex-1 border-l border-border/60",
                    isSameDay(day, new Date()) && "bg-accent/10",
                  )}
                  onClick={onSelectSlot}
                  onDrop={(slot, appointmentId) => {
                    if (appointmentId && onReschedule) {
                      const appointment = appointments.find(
                        (appt) => appt.id === appointmentId,
                      );
                      if (appointment) onReschedule(appointment, slot);
                      return;
                    }
                    onSelectSlot(slot);
                  }}
                />
              ))}
            </div>
          ))}

          <div
            className={cn(
              "pointer-events-none absolute inset-0 grid grid-cols-7",
              "pl-16 sm:pl-[4.25rem]",
            )}
          >
            {days.map((day) => {
              const dayAppts = appointments.filter((appt) =>
                isSameDay(parseISO(appt.start_time), day),
              );
              const layout = assignOverlapLayout(dayAppts);
              return (
                <div
                  key={day.toISOString()}
                  className="relative border-l border-border/40"
                >
                  {isSameDay(day, new Date()) && (
                    <CurrentTimeIndicator show={todayInWeek} />
                  )}
                  {dayAppts.map((appt) => {
                    const pack = layout.get(appt.id);
                    return (
                      <AppointmentBlock
                        key={appt.id}
                        appointment={appt}
                        onSelect={onSelectAppointment}
                        onResize={onResize}
                        colorMode={colorMode}
                        compact
                        draggable={!!onReschedule}
                        column={pack?.column ?? 0}
                        columns={pack?.columns ?? 1}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

type MonthViewProps = {
  date: Date;
  appointments: AppointmentWithRelations[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onSelectDay: (date: Date) => void;
  colorMode?: CalendarColorMode;
};

export function MonthView({
  date,
  appointments,
  onSelectAppointment,
  onSelectDay,
  colorMode = "service",
}: MonthViewProps) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const [agendaDay, setAgendaDay] = useState<Date | null>(null);

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const agendaAppointments = agendaDay
    ? appointments
        .filter((appt) => isSameDay(parseISO(appt.start_time), agendaDay))
        .sort(
          (a, b) =>
            parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime(),
        )
    : [];
  const visibleLimit = 3;

  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
        <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-border bg-card">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="px-1 py-3 text-center text-[11px] font-medium text-muted-foreground sm:px-2 sm:text-xs"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayAppts = appointments
              .filter((appt) => isSameDay(parseISO(appt.start_time), day))
              .sort(
                (a, b) =>
                  parseISO(a.start_time).getTime() -
                  parseISO(b.start_time).getTime(),
              );
            const isCurrentMonth = day.getMonth() === date.getMonth();
            const isToday = isSameDay(day, new Date());
            const overflowCount = Math.max(0, dayAppts.length - visibleLimit);
            const dateLabel = format(day, "MMMM d");

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex min-h-[112px] flex-col border-b border-r border-border p-1.5 sm:min-h-[120px] sm:p-2",
                  !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                  isToday && "bg-accent/30",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isToday && "bg-primary font-semibold text-primary-foreground",
                  )}
                  aria-label={`Open ${dateLabel}`}
                  onClick={() => onSelectDay(day)}
                >
                  {day.getDate()}
                </button>
                <div className="mt-1 flex min-h-0 flex-1 flex-col gap-1">
                  {dayAppts.slice(0, visibleLimit).map((appt) => {
                    const fill =
                      colorMode === "staff"
                        ? appt.staff?.color ?? appt.service.color
                        : appt.service.color;
                    const start = parseISO(appt.start_time);
                    const label = `${formatTime(start)} ${appt.customer.name} · ${appt.service.name}`;
                    return (
                      <button
                        key={appt.id}
                        type="button"
                        className="min-h-8 w-full truncate rounded-md border-l-2 px-1.5 py-1 text-left text-[12px] leading-tight text-white sm:min-h-0 sm:text-xs"
                        style={getAppointmentBlockStyle(appt.status, fill)}
                        aria-label={label}
                        title={label}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAppointment(appt);
                        }}
                      >
                        <span className="font-medium tabular-nums">
                          {formatTime(start)}
                        </span>{" "}
                        <span>{appt.customer.name}</span>
                      </button>
                    );
                  })}
                  {overflowCount > 0 ? (
                    <button
                      type="button"
                      className={cn(
                        "mt-auto flex min-h-11 w-full items-center justify-center rounded-[var(--radius-sm)] border border-border bg-muted/60 px-2 text-center text-base font-semibold text-foreground shadow-xs",
                        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-muted/80",
                        "sm:min-h-9 sm:text-sm",
                      )}
                      aria-label={`View ${overflowCount} more appointments on ${dateLabel}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAgendaDay(day);
                      }}
                    >
                      <span className="sm:hidden">
                        View {overflowCount} more
                      </span>
                      <span className="hidden sm:inline">
                        {overflowCount} more appointments
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Sheet
        open={Boolean(agendaDay)}
        onClose={() => setAgendaDay(null)}
        title={
          agendaDay
            ? format(agendaDay, "EEEE, MMMM d, yyyy")
            : "Day appointments"
        }
        description={
          agendaDay
            ? `${agendaAppointments.length} appointment${agendaAppointments.length === 1 ? "" : "s"}`
            : undefined
        }
      >
        <div className="space-y-2">
          {agendaAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No appointments on this day.
            </p>
          ) : (
            agendaAppointments.map((appt) => {
              const start = parseISO(appt.start_time);
              const end = parseISO(appt.end_time);
              return (
                <button
                  key={appt.id}
                  type="button"
                  className="flex min-h-14 w-full flex-col gap-0.5 rounded-[var(--radius-md)] border border-border bg-card px-3 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    setAgendaDay(null);
                    onSelectAppointment(appt);
                  }}
                >
                  <span className="text-sm font-semibold tabular-nums">
                    {formatTime(start)}–{formatTime(end)}
                  </span>
                  <span className="text-sm font-medium">
                    {appt.customer.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {appt.service.name}
                    {appt.staff?.name ? ` · ${appt.staff.name}` : ""}
                    {" · "}
                    {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (!agendaDay) return;
              const day = agendaDay;
              setAgendaDay(null);
              onSelectDay(day);
            }}
          >
            Add appointment
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setAgendaDay(null)}
          >
            Close
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export { CALENDAR_START_HOUR, CALENDAR_END_HOUR };
