"use client";

import {
  CurrentTimeIndicator,
  TimeSlotDropZone,
} from "@/components/calendar/appointment-block";
import {
  DayAppointmentCard,
  type CalendarColorMode,
} from "@/components/day-view/appointment-card";
import type { StaffDayOverlay } from "@/lib/actions/day-overlays";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  assignOverlapLayout,
  formatTime,
  getHourSlots,
  isSameDay,
  parseISO,
} from "@/lib/calendar/utils";
import type {
  AppointmentWithRelations,
  StaffWithServices,
} from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMemo } from "react";

type DayControlCenterProps = {
  date: Date;
  appointments: AppointmentWithRelations[];
  staff: StaffWithServices[];
  overlays?: StaffDayOverlay[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onSelectSlot: (date: Date, staffId?: string) => void;
  onReschedule?: (
    appointment: AppointmentWithRelations,
    newStart: Date,
    targetStaffId?: string,
  ) => void;
  onResize?: (appointment: AppointmentWithRelations, newEnd: Date) => void;
  colorMode?: CalendarColorMode;
};

function minutesToPct(minutes: number | null | undefined): number | null {
  if (minutes == null) return null;
  const start = CALENDAR_START_HOUR * 60;
  const total = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
  if (minutes < start || minutes > start + total) return null;
  return ((minutes - start) / total) * 100;
}

function OverlayBand({
  top,
  bottom,
  className,
  label,
}: {
  top: number | null;
  bottom: number | null;
  className: string;
  label: string;
}) {
  if (top == null || bottom == null || bottom <= top) return null;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 z-[1]",
        className,
      )}
      style={{ top: `${top}%`, height: `${bottom - top}%` }}
      aria-hidden
      title={label}
    />
  );
}

function StaffColumn({
  member,
  overlay,
  date,
  appointments,
  hours,
  showNow,
  onSelectAppointment,
  onSelectSlot,
  onReschedule,
  onResize,
  colorMode,
}: {
  member: StaffWithServices;
  overlay?: StaffDayOverlay;
  date: Date;
  appointments: AppointmentWithRelations[];
  hours: number[];
  showNow: boolean;
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onSelectSlot: (date: Date, staffId?: string) => void;
  onReschedule?: DayControlCenterProps["onReschedule"];
  onResize?: DayControlCenterProps["onResize"];
  colorMode: CalendarColorMode;
}) {
  const dayAppts = appointments.filter(
    (a) =>
      a.staff_id === member.id &&
      isSameDay(parseISO(a.start_time), date) &&
      a.status !== "cancelled",
  );
  const layout = assignOverlapLayout(dayAppts);

  const workStart = minutesToPct(overlay?.startMinutes);
  const workEnd = minutesToPct(overlay?.endMinutes);
  const lunchStart = minutesToPct(overlay?.lunchStartMinutes);
  const lunchEnd = minutesToPct(overlay?.lunchEndMinutes);
  const offDuty = overlay && !overlay.isWorking;
  const vacation = overlay?.onVacation;

  return (
    <div
      className="relative min-w-[9.5rem] flex-1 border-l border-border/80 first:border-l-0 sm:min-w-[11rem]"
      data-staff-column={member.id}
    >
      <div
        className="sticky top-0 z-20 border-b border-border px-2 py-2 backdrop-blur-sm"
        style={{
          background:
            "color-mix(in oklab, var(--card) 92%, transparent)",
          boxShadow: `inset 0 -2px 0 ${member.color}`,
        }}
      >
        <p className="truncate text-xs font-semibold sm:text-sm">
          {member.name}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {vacation
            ? "Vacation"
            : offDuty
              ? "Off today"
              : overlay?.hasSplitShifts
                ? "Split shift"
                : dayAppts.length === 0
                  ? "Open"
                  : `${dayAppts.length} booked`}
        </p>
      </div>

      <div className="relative">
        {(vacation || offDuty) && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-[2]",
              vacation
                ? "bg-amber-500/10 bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,rgba(245,158,11,0.12)_6px,rgba(245,158,11,0.12)_12px)]"
                : "bg-muted/40",
            )}
            aria-hidden
          />
        )}

        <OverlayBand
          top={0}
          bottom={workStart}
          className="bg-muted/35"
          label="Before shift"
        />
        <OverlayBand
          top={workEnd}
          bottom={100}
          className="bg-muted/35"
          label="After shift"
        />
        <OverlayBand
          top={lunchStart}
          bottom={lunchEnd}
          className="bg-sky-500/10"
          label="Lunch"
        />

        {hours.map((hour) => (
          <TimeSlotDropZone
            key={`${member.id}-${hour}`}
            date={date}
            hour={hour}
            className="relative min-h-[64px] w-full border-b border-border/60 last:border-b-0 sm:min-h-[68px]"
            onClick={(slot) => onSelectSlot(slot, member.id)}
            onDrop={(slot, appointmentId) => {
              if (!appointmentId || !onReschedule) return;
              const appt = appointments.find((a) => a.id === appointmentId);
              if (appt) onReschedule(appt, slot, member.id);
            }}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 z-[5]">
          {dayAppts.map((appt) => {
            const pack = layout.get(appt.id);
            return (
              <DayAppointmentCard
                key={appt.id}
                appointment={appt}
                onSelect={onSelectAppointment}
                onResize={onResize}
                colorMode={colorMode}
                draggable={Boolean(onReschedule)}
                column={pack?.column ?? 0}
                columns={pack?.columns ?? 1}
              />
            );
          })}
        </div>

        <CurrentTimeIndicator show={showNow} autoScroll={false} />
      </div>
    </div>
  );
}

/**
 * Multi-employee Day View — primary Chasum workspace floor.
 * Virtualization-ready column structure; Booking Engine handles mutations.
 */
export function DayControlCenter({
  date,
  appointments,
  staff,
  overlays = [],
  onSelectAppointment,
  onSelectSlot,
  onReschedule,
  onResize,
  colorMode = "service",
}: DayControlCenterProps) {
  const hours = useMemo(() => getHourSlots(), []);
  const activeStaff = useMemo(
    () => staff.filter((s) => s.is_active),
    [staff],
  );
  const overlayByStaff = useMemo(() => {
    const map = new Map<string, StaffDayOverlay>();
    for (const row of overlays) map.set(row.staffId, row);
    return map;
  }, [overlays]);

  const showNow = isSameDay(date, new Date());
  const dayCount = appointments.filter(
    (a) =>
      isSameDay(parseISO(a.start_time), date) && a.status !== "cancelled",
  ).length;

  if (activeStaff.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm"
        role="status"
      >
        <p className="text-sm font-semibold">No employees on the floor</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add active staff to open Day View columns.
        </p>
      </div>
    );
  }

  return (
    <div
      className="max-h-[min(72vh,54rem)] scroll-smooth overflow-auto rounded-[var(--radius-lg)] border border-border bg-card shadow-sm"
      role="region"
      aria-label={`Day view for ${format(date, "EEEE, MMMM d")}`}
    >
      <div
        className={cn(
          "sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 backdrop-blur-sm",
          showNow ? "bg-accent/45" : "bg-card/95",
        )}
      >
        <div>
          <p className="text-sm font-semibold">
            {format(date, "EEEE, MMM d")}
            {showNow ? (
              <span className="ml-2 text-xs font-medium text-primary">
                Today
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {dayCount === 0
              ? "Nothing scheduled — click a slot to book"
              : `${dayCount} appointment${dayCount === 1 ? "" : "s"} · ${activeStaff.length} columns`}
          </p>
        </div>
      </div>

      <div className="flex min-w-0">
        <div
          className="sticky left-0 z-20 w-14 shrink-0 border-r border-border bg-card sm:w-16"
          aria-hidden
        >
          <div className="h-[52px] border-b border-border" />
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex min-h-[64px] items-start justify-end border-b border-border/60 px-1.5 pt-1.5 text-[10px] tabular-nums text-muted-foreground sm:min-h-[68px] sm:px-2 sm:text-[11px]"
            >
              {formatTime(new Date(2024, 0, 1, hour))}
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 overflow-x-auto">
          {activeStaff.map((member) => (
            <StaffColumn
              key={member.id}
              member={member}
              overlay={overlayByStaff.get(member.id)}
              date={date}
              appointments={appointments}
              hours={hours}
              showNow={showNow}
              onSelectAppointment={onSelectAppointment}
              onSelectSlot={onSelectSlot}
              onReschedule={onReschedule}
              onResize={onResize}
              colorMode={colorMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mobile agenda list for narrow viewports */
export function DayAgendaList({
  date,
  appointments,
  onSelectAppointment,
}: {
  date: Date;
  appointments: AppointmentWithRelations[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
}) {
  const items = appointments
    .filter(
      (a) =>
        isSameDay(parseISO(a.start_time), date) && a.status !== "cancelled",
    )
    .sort(
      (a, b) =>
        parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime(),
    );

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        Nothing on the agenda for {format(date, "MMM d")}.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
      {items.map((appt) => (
        <li key={appt.id}>
          <button
            type="button"
            className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            onClick={() => onSelectAppointment(appt)}
          >
            <span
              className="mt-0.5 size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: appt.service.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                {formatTime(parseISO(appt.start_time))} · {appt.customer.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {appt.service.name}
                {appt.staff?.name ? ` · ${appt.staff.name}` : ""}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
