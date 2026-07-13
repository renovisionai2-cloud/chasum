"use client";

import {
  AppointmentBlock,
  CurrentTimeIndicator,
  TimeSlotDropZone,
  type CalendarColorMode,
} from "@/components/calendar/appointment-block";
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
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

type ViewProps = {
  date: Date;
  appointments: AppointmentWithRelations[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onSelectSlot: (date: Date) => void;
  onReschedule?: (appointment: AppointmentWithRelations, newStart: Date) => void;
  onResize?: (appointment: AppointmentWithRelations, newEnd: Date) => void;
  colorMode?: CalendarColorMode;
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

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
      <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-border bg-card">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayAppts = appointments.filter((appt) =>
            isSameDay(parseISO(appt.start_time), day),
          );
          const isCurrentMonth = day.getMonth() === date.getMonth();
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={cn(
                "min-h-[100px] border-b border-r border-border p-2 text-left transition-colors hover:bg-muted/40 sm:min-h-[120px]",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                isToday && "bg-accent/30",
              )}
              onClick={() => onSelectDay(day)}
            >
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                  isToday && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayAppts.slice(0, 3).map((appt) => {
                  const fill =
                    colorMode === "staff"
                      ? appt.staff?.color ?? appt.service.color
                      : appt.service.color;
                  return (
                    <div
                      key={appt.id}
                      role="button"
                      tabIndex={0}
                      className="truncate rounded-md border-l-2 px-1.5 py-0.5 text-[10px] text-white sm:text-xs"
                      style={getAppointmentBlockStyle(appt.status, fill)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAppointment(appt);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelectAppointment(appt);
                        }
                      }}
                    >
                      {formatTime(parseISO(appt.start_time))} {appt.customer.name}
                    </div>
                  );
                })}
                {dayAppts.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{dayAppts.length - 3} more
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { CALENDAR_START_HOUR, CALENDAR_END_HOUR };
