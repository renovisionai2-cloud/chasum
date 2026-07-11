"use client";

import {
  AppointmentBlock,
  CurrentTimeIndicator,
  TimeSlotDropZone,
} from "@/components/calendar/appointment-block";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
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
};

export function DayView({
  date,
  appointments,
  onSelectAppointment,
  onSelectSlot,
  onReschedule,
}: ViewProps) {
  const hours = getHourSlots();
  const dayAppointments = appointments.filter((appt) =>
    isSameDay(parseISO(appt.start_time), date),
  );
  const showNow = isSameDay(date, new Date());

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative">
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[60px_1fr] border-b border-border last:border-b-0"
          >
            <div className="border-r border-border px-2 py-4 text-xs text-muted-foreground">
              {formatTime(new Date(2024, 0, 1, hour))}
            </div>
            <TimeSlotDropZone
              date={date}
              hour={hour}
              className="relative min-h-[60px] w-full"
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

        <div className="pointer-events-none absolute inset-0 ml-[60px]">
          <CurrentTimeIndicator show={showNow} />
          {dayAppointments.map((appt) => (
            <AppointmentBlock
              key={appt.id}
              appointment={appt}
              onSelect={onSelectAppointment}
              draggable={!!onReschedule}
            />
          ))}
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
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "border-l border-border px-2 py-3 text-center",
                isSameDay(day, new Date()) && "bg-accent/30",
              )}
            >
              <p className="text-xs text-muted-foreground">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <p className="text-sm font-semibold">{day.getDate()}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0"
            >
              <div className="px-2 py-4 text-xs text-muted-foreground">
                {formatTime(new Date(2024, 0, 1, hour))}
              </div>
              {days.map((day) => (
                <TimeSlotDropZone
                  key={`${day.toISOString()}-${hour}`}
                  date={day}
                  hour={hour}
                  className="min-h-[48px] border-l border-border"
                  onClick={onSelectSlot}
                  onDrop={onSelectSlot}
                />
              ))}
            </div>
          ))}

          <div className="pointer-events-none absolute inset-0 ml-[60px] grid grid-cols-7">
            {days.map((day) => {
              const dayAppts = appointments.filter((appt) =>
                isSameDay(parseISO(appt.start_time), day),
              );
              return (
                <div key={day.toISOString()} className="relative border-l border-border">
                  {isSameDay(day, new Date()) && (
                    <CurrentTimeIndicator show={todayInWeek} />
                  )}
                  {dayAppts.map((appt) => (
                    <AppointmentBlock
                      key={appt.id}
                      appointment={appt}
                      onSelect={onSelectAppointment}
                      compact
                      draggable={false}
                    />
                  ))}
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
};

export function MonthView({
  date,
  appointments,
  onSelectAppointment,
  onSelectDay,
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
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

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={cn(
                "min-h-[100px] border-b border-r border-border p-2 text-left hover:bg-muted/30 sm:min-h-[120px]",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                isSameDay(day, new Date()) && "bg-accent/20",
              )}
              onClick={() => onSelectDay(day)}
            >
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                  isSameDay(day, new Date()) &&
                    "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayAppts.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    role="button"
                    tabIndex={0}
                    className="truncate rounded-md border-l-2 px-1.5 py-0.5 text-[10px] text-white sm:text-xs"
                    style={getAppointmentBlockStyle(appt.status, appt.service.color)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppointment(appt);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        onSelectAppointment(appt);
                      }
                    }}
                  >
                    {formatTime(parseISO(appt.start_time))} {appt.customer.name}
                  </div>
                ))}
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
