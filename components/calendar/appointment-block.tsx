"use client";

import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  formatTime,
  getAppointmentPosition,
  isSameDay,
  parseISO,
} from "@/lib/calendar/utils";
import { getAppointmentBlockStyle, getCurrentTimePosition } from "@/lib/calendar/status-colors";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { addMinutes } from "date-fns";
import { useEffect, useState } from "react";

export type CalendarColorMode = "service" | "staff";

type AppointmentBlockProps = {
  appointment: AppointmentWithRelations;
  onSelect: (appointment: AppointmentWithRelations) => void;
  onResize?: (appointment: AppointmentWithRelations, newEnd: Date) => void;
  colorMode?: CalendarColorMode;
  draggable?: boolean;
  compact?: boolean;
};

export function AppointmentBlock({
  appointment,
  onSelect,
  onResize,
  colorMode = "service",
  draggable = false,
  compact = false,
}: AppointmentBlockProps) {
  const { top, height } = getAppointmentPosition(
    appointment.start_time,
    appointment.end_time,
  );
  const fillColor =
    colorMode === "staff"
      ? appointment.staff?.color ?? appointment.service.color
      : appointment.service.color;

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("appointmentId", appointment.id);
    e.dataTransfer.setData(
      "duration",
      String(
        (parseISO(appointment.end_time).getTime() -
          parseISO(appointment.start_time).getTime()) /
          60000,
      ),
    );
  }

  function handleResizePointerDown(e: React.PointerEvent) {
    if (!onResize || appointment.status === "cancelled") return;
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startEnd = parseISO(appointment.end_time);
    const totalMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
    const parent = (e.currentTarget.parentElement?.parentElement ??
      null) as HTMLElement | null;
    const columnHeight = parent?.clientHeight || 600;

    function onMove(ev: PointerEvent) {
      const deltaPx = ev.clientY - startY;
      const deltaMinutes = Math.round((deltaPx / columnHeight) * totalMinutes / 5) * 5;
      const next = addMinutes(startEnd, deltaMinutes);
      const minEnd = addMinutes(parseISO(appointment.start_time), 5);
      if (next.getTime() >= minEnd.getTime()) {
        (e.currentTarget as HTMLElement).dataset.previewEnd = next.toISOString();
      }
    }

    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const deltaPx = ev.clientY - startY;
      const deltaMinutes = Math.round((deltaPx / columnHeight) * totalMinutes / 5) * 5;
      const next = addMinutes(startEnd, deltaMinutes);
      const minEnd = addMinutes(parseISO(appointment.start_time), 5);
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
      className={cn(
        "pointer-events-auto absolute overflow-hidden rounded-lg px-2 py-1 text-left text-white shadow-sm transition-shadow hover:shadow-md hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "inset-x-0.5 text-[10px]" : "inset-x-2 text-xs",
        draggable && appointment.status !== "cancelled" && "cursor-grab active:cursor-grabbing",
      )}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        minHeight: compact ? "22px" : "32px",
        ...getAppointmentBlockStyle(appointment.status, fillColor),
      }}
      onClick={() => onSelect(appointment)}
      aria-label={`${appointment.customer.name}, ${appointment.service.name}, ${formatTime(parseISO(appointment.start_time))}`}
    >
      <p className="truncate font-medium">{appointment.customer.name}</p>
      {!compact && (
        <p className="truncate opacity-90">{appointment.service.name}</p>
      )}
      {onResize && !compact && appointment.status !== "cancelled" && (
        <span
          role="separator"
          aria-label="Resize duration"
          className="absolute inset-x-0 bottom-0 flex h-3 cursor-ns-resize items-end justify-center rounded-b bg-gradient-to-t from-black/25 to-transparent"
          onPointerDown={handleResizePointerDown}
          onClick={(ev) => ev.stopPropagation()}
        >
          <span className="mb-0.5 h-0.5 w-8 rounded-full bg-white/80" />
        </span>
      )}
    </button>
  );
}

export function CurrentTimeIndicator({ show }: { show: boolean }) {
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!show) return;

    function update() {
      setPosition(getCurrentTimePosition(CALENDAR_START_HOUR, CALENDAR_END_HOUR));
    }

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [show]);

  if (!show || position === null) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10"
      style={{ top: `${position}%` }}
      aria-hidden="true"
    >
      <div className="relative">
        <div className="absolute -left-1 h-2.5 w-2.5 rounded-full bg-red-500" />
        <div className="h-0.5 bg-red-500" />
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
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("bg-primary/15", "ring-1", "ring-inset", "ring-primary/30");
  }

  function handleDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove(
      "bg-primary/15",
      "ring-1",
      "ring-inset",
      "ring-primary/30",
    );
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.remove(
      "bg-primary/15",
      "ring-1",
      "ring-inset",
      "ring-primary/30",
    );
    const appointmentId = e.dataTransfer.getData("appointmentId");
    if (!appointmentId) return;

    const slot = new Date(date);
    slot.setHours(hour, 0, 0, 0);
    onDrop(slot, appointmentId || undefined);
  }

  return (
    <button
      type="button"
      className={cn("hover:bg-muted/30", className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        const slot = new Date(date);
        slot.setHours(hour, 0, 0, 0);
        onClick(slot);
      }}
    />
  );
}

export function useShowCurrentTime(date: Date): boolean {
  return isSameDay(date, new Date());
}

export { formatTime, parseISO, isSameDay };
