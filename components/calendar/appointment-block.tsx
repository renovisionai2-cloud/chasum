"use client";

import { operationalPosition, operationalSlot, resizeOperationalEnd } from "@/lib/calendar/operational-time";
import { formatBusinessTime } from "@/lib/locale";

import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  formatTime,
  getAppointmentPosition,
  isSameDay,
  parseISO,
  snapMinutesInHour,
} from "@/lib/calendar/utils";
import { getAppointmentBlockStyle, getCurrentTimePosition } from "@/lib/calendar/status-colors";
import { DEFAULT_BOOKING_INTERVAL_MINUTES } from "@/lib/booking/interval";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { addMinutes } from "date-fns";
import { useEffect, useRef, useState } from "react";

export type CalendarColorMode = "service" | "staff";

type AppointmentBlockProps = {
  timezone?: string;
  day?: Date;
  appointment: AppointmentWithRelations;
  onSelect: (appointment: AppointmentWithRelations) => void;
  onResize?: (appointment: AppointmentWithRelations, newEnd: Date) => void;
  colorMode?: CalendarColorMode;
  draggable?: boolean;
  compact?: boolean;
  column?: number;
  columns?: number;
};

export function AppointmentBlock({
  appointment,
  timezone,
  day,
  onSelect,
  onResize,
  colorMode = "service",
  draggable = false,
  compact = false,
  column = 0,
  columns = 1,
}: AppointmentBlockProps) {
  const [invalidResize, setInvalidResize] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const { top, height } = timezone && day ? operationalPosition(appointment.start_time, appointment.end_time, day, timezone) : getAppointmentPosition(
    appointment.start_time,
    appointment.end_time,
  );
  const fillColor =
    colorMode === "staff"
      ? appointment.staff?.color ?? appointment.service.color
      : appointment.service.color;

  const widthPct = 100 / columns;
  const leftPct = column * widthPct;
  const startLabel = timezone ? formatBusinessTime(appointment.start_time, { timezone }) : formatTime(parseISO(appointment.start_time));
  const endLabel = timezone ? formatBusinessTime(appointment.end_time, { timezone }) : formatTime(parseISO(appointment.end_time));

  function handleDragStart(e: React.DragEvent) {
    setDragging(true);
    e.dataTransfer.setData("appointmentId", appointment.id);
    e.dataTransfer.setData(
      "duration",
      String(
        (parseISO(appointment.end_time).getTime() -
          parseISO(appointment.start_time).getTime()) /
          60000,
      ),
    );
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDragging(false);
  }

  function handleResizePointerDown(e: React.PointerEvent) {
    if (!onResize || appointment.status === "cancelled") return;
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startEnd = parseISO(appointment.start_time);
    const originalEnd = parseISO(appointment.end_time);
    const totalMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
    const parent = (e.currentTarget.parentElement?.parentElement ??
      null) as HTMLElement | null;
    const columnHeight = parent?.clientHeight || 600;

    function onMove(ev: PointerEvent) {
      const deltaPx = ev.clientY - startY;
      const deltaMinutes =
        Math.round(((deltaPx / columnHeight) * totalMinutes) / 5) * 5;
      const next = timezone ? resizeOperationalEnd(originalEnd, deltaMinutes, timezone) : addMinutes(originalEnd, deltaMinutes);
      const minEnd = addMinutes(startEnd, 5);
      if (next && next.getTime() >= minEnd.getTime()) {
        const nextHeight = timezone && day
          ? operationalPosition(appointment.start_time, next.toISOString(), day, timezone).height
          : ((next.getTime() - startEnd.getTime()) / 60000 / totalMinutes) * 100;
        setPreviewHeight(Math.max(nextHeight, 3));
      }
    }

    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setPreviewHeight(null);
      const deltaPx = ev.clientY - startY;
      const deltaMinutes =
        Math.round(((deltaPx / columnHeight) * totalMinutes) / 5) * 5;
      const next = timezone ? resizeOperationalEnd(originalEnd, deltaMinutes, timezone) : addMinutes(originalEnd, deltaMinutes);
      const minEnd = addMinutes(startEnd, 5);
      setInvalidResize(!next);
      if (next && next.getTime() >= minEnd.getTime() && deltaMinutes !== 0) {
        onResize?.(appointment, next);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  if (timezone && day && height <= 0) return null;

  return (
    <button
      type="button"
      draggable={draggable && appointment.status !== "cancelled"}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      title={`${appointment.customer.name} · ${appointment.service.name} · ${startLabel}–${endLabel}${appointment.staff?.name ? ` · ${appointment.staff.name}` : ""}`}
      className={cn(
        "pointer-events-auto absolute overflow-hidden rounded-[0.55rem] border border-white/20 px-1.5 py-1 text-left text-white shadow-sm transition-[box-shadow,opacity,transform] hover:z-20 hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "text-[10px] leading-tight" : "text-xs",
        draggable &&
          appointment.status !== "cancelled" &&
          "cursor-grab active:cursor-grabbing",
        dragging && "opacity-55 ring-2 ring-white/70",
      )}
      style={{
        top: `${top}%`,
        height: `${previewHeight ?? height}%`,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        minHeight: compact ? "24px" : "34px",
        ...getAppointmentBlockStyle(appointment.status, fillColor),
      }}
      onClick={() => onSelect(appointment)}
      aria-label={`${appointment.customer.name}, ${appointment.service.name}, ${startLabel}`}
    >
      <p className="truncate font-semibold tracking-tight">
        {appointment.customer.name}
      </p>
      {compact ? (
        <p className="truncate opacity-90">
          {startLabel}
          {appointment.service?.name ? ` · ${appointment.service.name}` : ""}
        </p>
      ) : (
        <>
          <p className="truncate opacity-95">{appointment.service.name}</p>
          <p className="truncate text-[10px] opacity-80">
            {startLabel}–{endLabel}
            {appointment.staff?.name ? ` · ${appointment.staff.name}` : ""}
          </p>
        </>
      )}
      {invalidResize && <span role="status">Unavailable or ambiguous local end time.</span>}
      {onResize && !compact && appointment.status !== "cancelled" && (
        <span
          role="separator"
          aria-label="Resize duration"
          className="absolute inset-x-0 bottom-0 flex h-3 cursor-ns-resize items-end justify-center rounded-b bg-gradient-to-t from-black/30 to-transparent"
          onPointerDown={handleResizePointerDown}
          onClick={(ev) => ev.stopPropagation()}
        >
          <span className="mb-0.5 h-0.5 w-8 rounded-full bg-white/85" />
        </span>
      )}
    </button>
  );
}

export function CurrentTimeIndicator({
  show,
  autoScroll = true,
  timezone,
}: {
  show: boolean;
  timezone?: string;
  /** When false, skip scrollIntoView (multi-column day grids). */
  autoScroll?: boolean;
}) {
  const [position, setPosition] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const didScroll = useRef(false);

  useEffect(() => {
    if (!show) {
      didScroll.current = false;
      return;
    }

    function update() {
      const next = getCurrentTimePosition(
        CALENDAR_START_HOUR,
        CALENDAR_END_HOUR,
        timezone,
      );
      setPosition((prev) => (prev === next ? prev : next));
    }

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [show, timezone]);

  useEffect(() => {
    if (
      !autoScroll ||
      !show ||
      position === null ||
      !ref.current ||
      didScroll.current
    ) {
      return;
    }
    didScroll.current = true;
    const el = ref.current;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [show, position, autoScroll]);

  if (!show || position === null) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-x-0 z-10"
      style={{ top: `${position}%` }}
      aria-hidden="true"
    >
      <div className="relative">
        <div className="absolute -left-1.5 h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow-sm" />
        <div className="h-0.5 w-full bg-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]" />
      </div>
    </div>
  );
}

type DropZoneProps = {
  timezone?: string;
  date: Date;
  hour: number;
  /** Business/location booking start-time interval (minutes). */
  intervalMinutes?: number;
  onDrop: (date: Date, appointmentId?: string) => void;
  onClick: (date: Date) => void;
  className?: string;
};

export function TimeSlotDropZone({
  date,
  timezone,
  hour,
  intervalMinutes = DEFAULT_BOOKING_INTERVAL_MINUTES,
  onDrop,
  onClick,
  className,
}: DropZoneProps) {
  const [invalidTime, setInvalidTime] = useState(false);
  function slotAt(minutes: number) {
    if (timezone) return operationalSlot(date, hour * 60 + minutes, timezone);
    const slot = new Date(date);
    slot.setHours(hour, minutes, 0, 0);
    return slot;
  }
  const [hoverMinutes, setHoverMinutes] = useState<number | null>(null);

  function minutesFromEvent(e: React.DragEvent | React.MouseEvent): number {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    return snapMinutesInHour(offsetY, rect.height, intervalMinutes);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setHoverMinutes(minutesFromEvent(e));
  }

  function handleDragLeave() {
    setHoverMinutes(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const minutes = minutesFromEvent(e);
    setHoverMinutes(null);
    const appointmentId = e.dataTransfer.getData("appointmentId");
    if (!appointmentId) return;

    const slot = slotAt(minutes);
    setInvalidTime(!slot);
    if (slot) onDrop(slot, appointmentId);
  }

  const ghostTop =
    hoverMinutes == null
      ? null
      : Math.min(92, Math.max(2, (hoverMinutes / 60) * 100));
  const ghostHeight = Math.max(6, (intervalMinutes / 60) * 100);

  return (
    <button
      type="button"
      className={cn(
        "relative transition-colors hover:bg-muted/35",
        hoverMinutes !== null && "bg-primary/12 ring-1 ring-inset ring-primary/35",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        const minutes = minutesFromEvent(e);
        const slot = slotAt(minutes);
        setInvalidTime(!slot);
        if (slot) onClick(slot);
      }}
    >
      {invalidTime && <span role="status">Unavailable or ambiguous local time. Choose another time.</span>}
      {ghostTop != null && (
        <span
          className="pointer-events-none absolute inset-x-1 rounded-sm border border-dashed border-primary/50 bg-primary/10"
          style={{
            top: `${ghostTop}%`,
            height: `${ghostHeight}%`,
          }}
          aria-hidden
        />
      )}
      {/* Subtle mid-hour mark only when interval divides the hour evenly into halves */}
      {60 % intervalMinutes === 0 && intervalMinutes < 60 ? (
        <span
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/40"
          style={{ top: "50%" }}
          aria-hidden
        />
      ) : null}
    </button>
  );
}

export function useShowCurrentTime(date: Date): boolean {
  return isSameDay(date, new Date());
}

export { formatTime, parseISO, isSameDay };
