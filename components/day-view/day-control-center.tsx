"use client";

import {
  CurrentTimeIndicator,
  TimeSlotDropZone,
} from "@/components/calendar/appointment-block";
import {
  DayAppointmentCard,
  type CalendarColorMode,
} from "@/components/day-view/appointment-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import type { StaffDayOverlay } from "@/lib/actions/day-overlays";
import {
  paymentReadinessFromStatus,
  paymentReadinessLabel,
} from "@/lib/dashboard/appointment-ops";
import {
  assignOverlapLayout,
  getHourSlots,
  parseISO,
} from "@/lib/calendar/utils";
import {
  formatDayHeaderInTimezone,
  formatTimeInTimezone,
  initialScrollMinutes,
  isSameBusinessCalendarDay,
  minutesToGridPercent,
} from "@/lib/calendar/day-geometry";
import {
  dayLaneFlexStyle,
  hasUnassignedAppointmentsOnDay,
  shouldShowUnassignedLane,
  staffIdsForDayLanes,
} from "@/lib/calendar/day-surface";
import { appointmentStatusTone } from "@/lib/calendar/appointment-status-ui";
import { DEFAULT_BOOKING_INTERVAL_MINUTES } from "@/lib/booking/interval";
import type {
  AppointmentWithRelations,
  StaffWithServices,
} from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  /** Booking start-time interval from business/location settings. */
  intervalMinutes?: number;
  /** Business/location IANA timezone. */
  timeZone?: string | null;
  /** Optional New Appointment from empty-day chrome. */
  onNewAppointment?: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  staffFilter?: string | null;
};

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

function hourBlocked(
  hour: number,
  overlay?: StaffDayOverlay,
): { blocked: boolean; reason?: string } {
  if (!overlay) return { blocked: false };
  if (overlay.onVacation) {
    return { blocked: true, reason: "Employee is on vacation" };
  }
  if (!overlay.isWorking) {
    return { blocked: true, reason: "Employee is off today" };
  }
  const hourStart = hour * 60;
  const hourEnd = hourStart + 60;
  if (
    overlay.startMinutes != null &&
    overlay.endMinutes != null &&
    (hourEnd <= overlay.startMinutes || hourStart >= overlay.endMinutes)
  ) {
    return { blocked: true, reason: "Outside working hours" };
  }
  if (
    overlay.lunchStartMinutes != null &&
    overlay.lunchEndMinutes != null &&
    hourStart >= overlay.lunchStartMinutes &&
    hourEnd <= overlay.lunchEndMinutes
  ) {
    return { blocked: true, reason: "Lunch / break" };
  }
  return { blocked: false };
}

function StaffColumn({
  member,
  overlay,
  date,
  appointments,
  hours,
  showNow,
  timeZone,
  onSelectAppointment,
  onSelectSlot,
  onReschedule,
  onResize,
  colorMode,
  intervalMinutes = DEFAULT_BOOKING_INTERVAL_MINUTES,
  laneCount,
}: {
  member: StaffWithServices;
  overlay?: StaffDayOverlay;
  date: Date;
  appointments: AppointmentWithRelations[];
  hours: number[];
  showNow: boolean;
  timeZone: string | null;
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  onSelectSlot: (date: Date, staffId?: string) => void;
  onReschedule?: DayControlCenterProps["onReschedule"];
  onResize?: DayControlCenterProps["onResize"];
  colorMode: CalendarColorMode;
  intervalMinutes?: number;
  laneCount: number;
}) {
  const dayAppts = appointments.filter(
    (a) =>
      (member.id === "__unassigned__"
        ? !a.staff_id
        : a.staff_id === member.id) &&
      isSameBusinessCalendarDay(a.start_time, date, timeZone) &&
      a.status !== "cancelled",
  );
  const layout = assignOverlapLayout(dayAppts);

  const offDuty = overlay && !overlay.isWorking;
  const vacation = overlay?.onVacation;
  const initials = member.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const laneStyle = dayLaneFlexStyle(laneCount);

  return (
    <div
      className="relative border-l border-border/50 first:border-l-0"
      data-staff-column={member.id}
      data-lane-sizing={laneCount <= 1 ? "solo" : "fill"}
      style={{
        minWidth: laneStyle.minWidth,
        maxWidth: laneStyle.maxWidth ?? undefined,
        flexGrow: laneStyle.flexGrow,
        flexShrink: laneStyle.flexShrink,
        flexBasis: laneStyle.flexBasis,
      }}
    >
      <div
        className="sticky top-0 z-20 border-b border-border/80 px-2.5 py-2.5 backdrop-blur-sm"
        style={{
          background:
            "color-mix(in oklab, var(--card) 92%, transparent)",
          boxShadow: `inset 0 -2px 0 ${member.color}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: member.color }}
            aria-hidden
          >
            {initials || "?"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
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
        </div>
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
          bottom={
            overlay?.startMinutes != null
              ? minutesToGridPercent(overlay.startMinutes)
              : null
          }
          className="bg-muted/35"
          label="Before shift"
        />
        <OverlayBand
          top={
            overlay?.endMinutes != null
              ? minutesToGridPercent(overlay.endMinutes)
              : null
          }
          bottom={100}
          className="bg-muted/35"
          label="After shift"
        />
        <OverlayBand
          top={
            overlay?.lunchStartMinutes != null
              ? minutesToGridPercent(overlay.lunchStartMinutes)
              : null
          }
          bottom={
            overlay?.lunchEndMinutes != null
              ? minutesToGridPercent(overlay.lunchEndMinutes)
              : null
          }
          className="bg-sky-500/10"
          label="Lunch"
        />

        {hours.map((hour) => {
          const block = hourBlocked(hour, overlay);
          return (
            <TimeSlotDropZone
              key={`${member.id}-${hour}`}
              date={date}
              hour={hour}
              intervalMinutes={intervalMinutes}
              timeZone={timeZone}
              blocked={block.blocked}
              blockedReason={block.reason}
              className="relative min-h-[64px] w-full border-b border-border/60 last:border-b-0 sm:min-h-[68px]"
              onClick={(slot) => {
                if (member.id === "__unassigned__") return;
                onSelectSlot(slot, member.id);
              }}
              onDrop={(slot, appointmentId) => {
                if (!appointmentId || !onReschedule) return;
                if (member.id === "__unassigned__") return;
                const appt = appointments.find((a) => a.id === appointmentId);
                if (appt) onReschedule(appt, slot, member.id);
              }}
            />
          );
        })}

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
                timeZone={timeZone}
                inStaffLane
              />
            );
          })}
        </div>

        <CurrentTimeIndicator
          show={showNow}
          autoScroll={false}
          timeZone={timeZone}
          viewDate={date}
        />
      </div>
    </div>
  );
}

/**
 * Multi-employee Day View — primary Chasum operating floor.
 * Geometry uses business timezone; BookingFacade validates mutations.
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
  intervalMinutes = DEFAULT_BOOKING_INTERVAL_MINUTES,
  timeZone = null,
  onNewAppointment,
  loading = false,
  error = null,
  onRetry,
  staffFilter = "all",
}: DayControlCenterProps) {
  const hours = useMemo(() => getHourSlots(), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  const activeStaff = useMemo(() => {
    const ordered = [...staff.filter((s) => s.is_active)].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    const ids = staffIdsForDayLanes({
      activeStaffIds: ordered.map((s) => s.id),
      staffFilter,
    });
    return ordered.filter((s) => ids.includes(s.id));
  }, [staff, staffFilter]);

  const overlayByStaff = useMemo(() => {
    const map = new Map<string, StaffDayOverlay>();
    for (const row of overlays) map.set(row.staffId, row);
    return map;
  }, [overlays]);

  const showNow = isSameBusinessCalendarDay(date, new Date(), timeZone);
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!showNow) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [showNow]);

  const dayAppts = useMemo(
    () =>
      appointments.filter(
        (a) =>
          isSameBusinessCalendarDay(a.start_time, date, timeZone) &&
          a.status !== "cancelled",
      ),
    [appointments, date, timeZone],
  );
  const dayCount = dayAppts.length;
  const showUnassigned = shouldShowUnassignedLane({
    hasUnassignedAppointments: hasUnassignedAppointmentsOnDay(
      appointments,
      date,
      timeZone,
    ),
    staffFilter,
  });
  const laneCount = activeStaff.length + (showUnassigned ? 1 : 0);

  const nowNext = useMemo(() => {
    if (!showNow) {
      return {
        now: null as AppointmentWithRelations | null,
        next: null as AppointmentWithRelations | null,
      };
    }
    const sorted = [...dayAppts].sort(
      (a, b) =>
        parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime(),
    );
    const current =
      sorted.find(
        (a) =>
          parseISO(a.start_time).getTime() <= nowMs &&
          parseISO(a.end_time).getTime() > nowMs,
      ) ?? null;
    const next =
      sorted.find((a) => parseISO(a.start_time).getTime() > nowMs) ?? null;
    return { now: current, next };
  }, [dayAppts, showNow, nowMs]);

  useEffect(() => {
    didInitialScroll.current = false;
  }, [date, timeZone]);

  useEffect(() => {
    if (didInitialScroll.current || loading || !scrollRef.current) return;
    const earliestOpen = overlays.reduce<number | null>((min, row) => {
      if (row.startMinutes == null) return min;
      if (min == null) return row.startMinutes;
      return Math.min(min, row.startMinutes);
    }, null);
    const targetMin = initialScrollMinutes(date, timeZone, {
      openMinutes: earliestOpen,
    });
    const pct = minutesToGridPercent(targetMin);
    if (pct == null) return;
    const el = scrollRef.current;
    // Header (~52) + staff sticky; scroll body toward target.
    const bodyTop = 52;
    const gridHeight = hours.length * 68;
    const y = bodyTop + (pct / 100) * gridHeight - el.clientHeight * 0.35;
    el.scrollTop = Math.max(0, y);
    didInitialScroll.current = true;
  }, [date, timeZone, loading, overlays, hours.length]);

  if (error) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-8 text-center shadow-sm"
        role="alert"
      >
        <p className="text-sm font-semibold">Couldn’t load the schedule</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onRetry}
          >
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

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
      ref={scrollRef}
      className={cn(
        "w-full max-w-none max-h-[calc(100dvh-10.5rem)] scroll-smooth overflow-auto rounded-[var(--radius-lg)] border border-border bg-card shadow-sm",
        loading && "opacity-90",
      )}
      data-day-canvas="fluid"
      data-lane-count={laneCount}
      data-unassigned-lane={showUnassigned ? "visible" : "hidden"}
      role="region"
      aria-busy={loading || undefined}
      aria-label={`Day view for ${formatDayHeaderInTimezone(date, timeZone)}`}
    >
      <div
        className={cn(
          "sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-1.5 backdrop-blur-sm",
          showNow ? "bg-accent/30" : "bg-card/95",
        )}
      >
        <p className="min-w-0 text-xs text-muted-foreground">
          {loading
            ? "Loading appointments…"
            : dayCount === 0
              ? "No appointments scheduled for this day."
              : `${dayCount} appointment${dayCount === 1 ? "" : "s"}`}
          {showNow && nowNext.now ? (
            <>
              {" "}
              · Now {nowNext.now.customer.name}
            </>
          ) : null}
          {showNow && !nowNext.now && nowNext.next ? (
            <>
              {" "}
              · Next {formatTimeInTimezone(nowNext.next.start_time, timeZone)}{" "}
              {nowNext.next.customer.name}
            </>
          ) : null}
        </p>
        {dayCount === 0 && onNewAppointment ? (
          <Button
            type="button"
            size="sm"
            className="shrink-0 font-semibold shadow-sm"
            onClick={onNewAppointment}
          >
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex min-w-0" aria-hidden>
          <div className="w-14 shrink-0 border-r border-border sm:w-16">
            <div className="h-[52px] border-b border-border" />
            {hours.map((hour) => (
              <div
                key={hour}
                className="min-h-[64px] border-b border-border/40 sm:min-h-[68px]"
              />
            ))}
          </div>
          <div className="flex flex-1 gap-0">
            {activeStaff.slice(0, 4).map((m) => (
              <div key={m.id} className="min-w-[9.5rem] flex-1 animate-pulse border-l border-border/60 bg-muted/20" />
            ))}
          </div>
        </div>
      ) : null}

      <div className={cn("flex w-full min-w-0", loading && "sr-only")}>
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
              {formatTimeInTimezone(
                new Date(Date.UTC(2024, 0, 1, hour, 0)),
                "UTC",
              )}
            </div>
          ))}
        </div>

        <div className="flex min-w-0 w-full flex-1 overflow-x-auto">
          {activeStaff.map((member) => (
            <StaffColumn
              key={member.id}
              member={member}
              overlay={overlayByStaff.get(member.id)}
              date={date}
              appointments={appointments}
              hours={hours}
              showNow={showNow}
              timeZone={timeZone}
              onSelectAppointment={onSelectAppointment}
              onSelectSlot={onSelectSlot}
              onReschedule={onReschedule}
              onResize={onResize}
              colorMode={colorMode}
              intervalMinutes={intervalMinutes}
              laneCount={laneCount}
            />
          ))}
          {showUnassigned ? (
            <StaffColumn
              key="__unassigned__"
              member={
                {
                  id: "__unassigned__",
                  name: "Unassigned",
                  color: "#94a3b8",
                  is_active: true,
                  location_id: null,
                  photo_url: null,
                  staff_services: [],
                } as unknown as StaffWithServices
              }
              date={date}
              appointments={appointments}
              hours={hours}
              showNow={showNow}
              timeZone={timeZone}
              onSelectAppointment={onSelectAppointment}
              onSelectSlot={(slot) => onSelectSlot(slot, "")}
              onReschedule={undefined}
              onResize={onResize}
              colorMode={colorMode}
              intervalMinutes={intervalMinutes}
              laneCount={laneCount}
            />
          ) : null}
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
  timeZone = null,
  onNewAppointment,
  staff,
  selectedStaffId,
  onStaffChange,
}: {
  date: Date;
  appointments: AppointmentWithRelations[];
  onSelectAppointment: (appointment: AppointmentWithRelations) => void;
  timeZone?: string | null;
  onNewAppointment?: () => void;
  staff?: StaffWithServices[];
  selectedStaffId?: string | null;
  onStaffChange?: (staffId: string | null) => void;
}) {
  const showNow = isSameBusinessCalendarDay(date, new Date(), timeZone);
  const [nowMs] = useState(() => Date.now());
  const items = appointments
    .filter(
      (a) =>
        isSameBusinessCalendarDay(a.start_time, date, timeZone) &&
        a.status !== "cancelled" &&
        (!selectedStaffId || a.staff_id === selectedStaffId),
    )
    .sort(
      (a, b) =>
        parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime(),
    );

  const nextId =
    showNow
      ? items.find((a) => parseISO(a.start_time).getTime() > nowMs)?.id
      : null;
  const nowId =
    showNow
      ? items.find(
          (a) =>
            parseISO(a.start_time).getTime() <= nowMs &&
            parseISO(a.end_time).getTime() > nowMs,
        )?.id
      : null;

  return (
    <div className="space-y-3">
      {staff && staff.length > 0 && onStaffChange ? (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Employee filter"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!selectedStaffId}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-2 text-xs font-medium min-h-[var(--touch-min)]",
              !selectedStaffId
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
            onClick={() => onStaffChange(null)}
          >
            All
          </button>
          {[...staff]
            .filter((s) => s.is_active)
            .sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
            )
            .map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={selectedStaffId === s.id}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-2 text-xs font-medium min-h-[var(--touch-min)]",
                  selectedStaffId === s.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
                onClick={() => onStaffChange(s.id)}
              >
                {s.name}
              </button>
            ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div
          className="rounded-[var(--radius-lg)] border border-dashed border-border bg-card px-4 py-10 text-center"
          role="status"
        >
          <p className="text-sm font-medium text-foreground">
            No appointments scheduled for this day.
          </p>
          {onNewAppointment ? (
            <Button
              type="button"
              size="sm"
              className="mt-4 font-semibold shadow-sm"
              onClick={onNewAppointment}
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
          {items.map((appt) => {
            const readiness = paymentReadinessFromStatus(appt.payment_status);
            const paymentLabel = paymentReadinessLabel(readiness);
            const paymentDue =
              readiness === "payment_due" || readiness === "balance_due";
            const staffLabel = appt.staff?.name?.trim()
              ? appt.staff.name
              : "Unassigned";
            const tone = appointmentStatusTone(appt.status);
            const isNow = appt.id === nowId;
            const isNext = appt.id === nextId;
            return (
              <li key={appt.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full min-h-[var(--touch-min)] items-start gap-3 px-3 py-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    isNow && "bg-accent/40",
                    isNext && !isNow && "bg-muted/25",
                  )}
                  onClick={() => onSelectAppointment(appt)}
                  aria-label={`${formatTimeInTimezone(appt.start_time, timeZone)}, ${appt.customer.name}, ${appt.service.name}, ${staffLabel}, ${tone.label}${paymentDue && paymentLabel ? `, ${paymentLabel}` : ""}${isNow ? ", happening now" : ""}${isNext ? ", next" : ""}`}
                >
                  <span
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: appt.service.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        {formatTimeInTimezone(appt.start_time, timeZone)} ·{" "}
                        {appt.customer.name}
                      </span>
                      {isNow ? (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          Now
                        </span>
                      ) : null}
                      {isNext ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Next
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {appt.service.name}
                      {` · ${staffLabel}`}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <StatusBadge status={appt.status} />
                      {paymentDue && paymentLabel ? (
                        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {paymentLabel}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
