"use client";

import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatTime,
  isSameDay,
  parseISO,
} from "@/lib/calendar/utils";
import type {
  AppointmentWithRelations,
  Location,
  StaffWithServices,
} from "@/lib/types/booking";
import { format, startOfWeek, addDays } from "date-fns";
import { Calendar } from "lucide-react";

type BaseProps = {
  date: Date;
  appointments: AppointmentWithRelations[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onSelectSlot?: (date: Date) => void;
};

export function AgendaView({
  date,
  appointments,
  onSelectAppointment,
}: BaseProps) {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = addDays(start, 14);
  const items = appointments
    .filter((a) => {
      const t = parseISO(a.start_time).getTime();
      return t >= start.getTime() && t < end.getTime() && a.status !== "cancelled";
    })
    .sort(
      (a, b) =>
        parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime(),
    );

  if (items.length === 0) {
    return (
      <EmptyState
        variant="panel"
        glyph={Calendar}
        title="Nothing on the agenda"
        description="Appointments for the next two weeks appear here."
      />
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
      <ul className="divide-y divide-border/80">
        {items.map((appt) => (
          <li key={appt.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
              onClick={() => onSelectAppointment(appt)}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {format(parseISO(appt.start_time), "EEE, MMM d")} ·{" "}
                  {formatTime(parseISO(appt.start_time))}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {appt.customer.name} · {appt.service.name}
                  {appt.staff?.name ? ` · ${appt.staff.name}` : ""}
                  {appt.location?.name ? ` · ${appt.location.name}` : ""}
                </p>
              </div>
              <StatusBadge status={appt.status} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TimelineView({
  date,
  appointments,
  onSelectAppointment,
}: BaseProps) {
  const dayItems = appointments
    .filter((a) => isSameDay(parseISO(a.start_time), date) && a.status !== "cancelled")
    .sort(
      (a, b) =>
        parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime(),
    );

  return (
    <div className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold">
        Timeline · {format(date, "EEEE, MMM d")}
      </p>
      {dayItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No appointments today.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-4">
          {dayItems.map((appt) => (
            <li key={appt.id} className="relative">
              <span className="absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <button
                type="button"
                className="w-full rounded-[var(--radius-md)] border border-border/80 px-3 py-2 text-left hover:bg-muted/40"
                onClick={() => onSelectAppointment(appt)}
              >
                <p className="text-sm font-medium">
                  {formatTime(parseISO(appt.start_time))} –{" "}
                  {formatTime(parseISO(appt.end_time))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {appt.customer.name} · {appt.service.name} · {appt.staff.name}
                </p>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function ResourceView({
  date,
  appointments,
  staff,
  onSelectAppointment,
  mode = "employees",
  locations = [],
}: BaseProps & {
  staff: StaffWithServices[];
  mode?: "employees" | "locations" | "resource";
  locations?: Location[];
}) {
  const columns =
    mode === "locations"
      ? locations.map((l) => ({ id: l.id, name: l.name, color: "#64748b" }))
      : staff.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
        }));

  const dayAppts = appointments.filter(
    (a) => isSameDay(parseISO(a.start_time), date) && a.status !== "cancelled",
  );

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
      <div
        className="grid min-w-[640px] gap-px bg-border"
        style={{
          gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(160px, 1fr))`,
        }}
      >
        {columns.map((col) => {
          const items = dayAppts.filter((a) =>
            mode === "locations"
              ? a.location_id === col.id || a.location?.id === col.id
              : a.staff_id === col.id,
          );
          return (
            <div key={col.id} className="min-h-[280px] bg-card">
              <div
                className="border-b border-border px-3 py-2 text-sm font-semibold"
                style={{ boxShadow: `inset 0 -2px 0 ${col.color}` }}
              >
                {col.name}
              </div>
              <ul className="space-y-2 p-2">
                {items.length === 0 ? (
                  <li className="px-1 py-6 text-center text-xs text-muted-foreground">
                    Free
                  </li>
                ) : (
                  items.map((appt) => (
                    <li key={appt.id}>
                      <button
                        type="button"
                        className="w-full rounded-[var(--radius-sm)] border border-border px-2 py-1.5 text-left text-xs hover:bg-muted/50"
                        onClick={() => onSelectAppointment(appt)}
                      >
                        <p className="font-medium">
                          {formatTime(parseISO(appt.start_time))}{" "}
                          {appt.customer.name}
                        </p>
                        <p className="truncate text-muted-foreground">
                          {appt.service.name}
                        </p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
