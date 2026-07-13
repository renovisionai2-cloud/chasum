"use client";

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
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { addMinutes } from "date-fns";
import { useEffect, useRef, useState } from "react";

export type CalendarColorMode = "service" | "staff";

type AppointmentBlockProps = {
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
  onSelect,
  onResize,
  colorMode = "service",
  draggable = false,
  compact = false,
  column = 0,
  columns = 1,
}: AppointmentBlockProps) {
  const [dragging, setDragging] = useState(false);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const { top, height } = getAppointmentPosition(
    appointment.start_time,
    appointment.end_time,
  );
  const fillColor =
    colorMode === "staff"
      ? appointment.staff?.color ?? appointment.service.color
      : appointment.service.color;

  const widthPct = 100 / columns;
  const leftPct = column * widthPct;
  const startLabel = formatTime(parseISO(appointment.start_time));
  const endLabel = formatTime(parseISO(appointment.end_time));

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
      const next = addMinutes(originalEnd, deltaMinutes);
      const minEnd = addMinutes(startEnd, 5);
      if (next.getTime() >= minEnd.getTime()) {
        const nextHeight =
          ((next.getTime() - parseISO(appointment.start_time).getTime()) /
            60000 /
            totalMinutes) *
          100;
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
      const next = addMinutes(originalEnd, deltaMinutes);
      const minEnd = addMinutes(startEnd, 5);
      if (next.getTime() >= minEnd.getTime() && deltaMinutes !== 0) {
        onResize?.(appointment, next);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

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

export function CurrentTimeIndicator({ show }: { show: boolean }) {
  const [position, setPosition] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const didScroll = useRef(false);

  useEffect(() => {
    if (!show) {
      didScroll.current = false;
      return;
    }

    function update() {
      setPosition(getCurrentTimePosition(CALENDAR_START_HOUR, CALENDAR_END_HOUR));
    }

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [show]);

  useEffect(() => {
    if (!show || position === null || !ref.current || didScroll.current) return;
    didScroll.current = true;
    const el = ref.current;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [show, position]);

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
        <div className="h-0.5 bg-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]" />
      </div>
    </div>
  );
}

type DropZoneProps = {
  date: Date;
  hour: number;
  onDrop: (date: Date, appointmentId?: string) => void;
  onClick: (date: Date) => void;
  className?: string;
};

export function TimeSlotDropZone({
  date,
  hour,
  onDrop,
  onClick,
  className,
}: DropZoneProps) {
  const [overHalf, setOverHalf] = useState<0 | 30 | null>(null);

  function minutesFromEvent(e: React.DragEvent | React.MouseEvent): 0 | 30 {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    return snapMinutesInHour(offsetY, rect.height) as 0 | 30;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverHalf(minutesFromEvent(e));
  }

  function handleDragLeave() {
    setOverHalf(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const minutes = minutesFromEvent(e);
    setOverHalf(null);
    const appointmentId = e.dataTransfer.getData("appointmentId");
    if (!appointmentId) return;

    const slot = new Date(date);
    slot.setHours(hour, minutes, 0, 0);
    onDrop(slot, appointmentId);
  }

  return (
    <button
      type="button"
      className={cn(
        "relative transition-colors hover:bg-muted/35",
        overHalf !== null && "bg-primary/12 ring-1 ring-inset ring-primary/35",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        const minutes = minutesFromEvent(e);
        const slot = new Date(date);
        slot.setHours(hour, minutes, 0, 0);
        onClick(slot);
      }}
    >
      {overHalf !== null && (
        <span
          className="pointer-events-none absolute inset-x-1 rounded-sm border border-dashed border-primary/50 bg-primary/10"
          style={{
            top: overHalf === 0 ? "4%" : "52%",
            height: "44%",
          }}
          aria-hidden
        />
      )}
      <span
        className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border/50"
        aria-hidden
      />
    </button>
  );
}

export function useShowCurrentTime(date: Date): boolean {
  return isSameDay(date, new Date());
}

export { formatTime, parseISO, isSameDay };
