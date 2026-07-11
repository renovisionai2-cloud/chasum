"use client";

import { StatusBadge } from "@/components/ui/badge";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  formatTime,
  getAppointmentPosition,
  getHourSlots,
  isSameDay,
  parseISO,
} from "@/lib/calendar/utils";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

type DayViewProps = {
  date: Date;
  appointments: AppointmentWithRelations[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onSelectSlot: (date: Date) => void;
};

export function DayView({
  date,
  appointments,
  onSelectAppointment,
  onSelectSlot,
}: DayViewProps) {
  const hours = getHourSlots();
  const dayAppointments = appointments.filter((appt) =>
    isSameDay(parseISO(appt.start_time), date),
  );

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
            <button
              type="button"
              className="relative min-h-[60px] hover:bg-muted/30"
              onClick={() => {
                const slot = new Date(date);
                slot.setHours(hour, 0, 0, 0);
                onSelectSlot(slot);
              }}
            />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 ml-[60px]">
          {dayAppointments.map((appt) => {
            const { top, height } = getAppointmentPosition(
              appt.start_time,
              appt.end_time,
            );
            return (
              <button
                key={appt.id}
                type="button"
                className="pointer-events-auto absolute inset-x-2 overflow-hidden rounded-lg border border-white/20 px-2 py-1 text-left text-xs text-white shadow-sm transition-opacity hover:opacity-90"
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  backgroundColor: appt.service.color,
                  minHeight: "28px",
                }}
                onClick={() => onSelectAppointment(appt)}
              >
                <p className="truncate font-medium">{appt.customer.name}</p>
                <p className="truncate opacity-90">{appt.service.name}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type WeekViewProps = DayViewProps;

export function WeekView({
  date,
  appointments,
  onSelectAppointment,
  onSelectSlot,
}: WeekViewProps) {
  const hours = getHourSlots();
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

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
                <button
                  key={`${day.toISOString()}-${hour}`}
                  type="button"
                  className="min-h-[48px] border-l border-border hover:bg-muted/30"
                  onClick={() => {
                    const slot = new Date(day);
                    slot.setHours(hour, 0, 0, 0);
                    onSelectSlot(slot);
                  }}
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
                  {dayAppts.map((appt) => {
                    const { top, height } = getAppointmentPosition(
                      appt.start_time,
                      appt.end_time,
                    );
                    return (
                      <button
                        key={appt.id}
                        type="button"
                        className="pointer-events-auto absolute inset-x-0.5 overflow-hidden rounded-md px-1 py-0.5 text-left text-[10px] text-white shadow-sm"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          backgroundColor: appt.service.color,
                          minHeight: "20px",
                        }}
                        onClick={() => onSelectAppointment(appt)}
                      >
                        <p className="truncate font-medium">{appt.customer.name}</p>
                      </button>
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
                    className="truncate rounded-md px-1.5 py-0.5 text-[10px] text-white sm:text-xs"
                    style={{ backgroundColor: appt.service.color }}
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

export { StatusBadge, CALENDAR_START_HOUR, CALENDAR_END_HOUR };
