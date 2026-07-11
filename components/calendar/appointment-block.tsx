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
import { useEffect, useState } from "react";

type AppointmentBlockProps = {
  appointment: AppointmentWithRelations;
  onSelect: (appointment: AppointmentWithRelations) => void;
  draggable?: boolean;
  compact?: boolean;
};

export function AppointmentBlock({
  appointment,
  onSelect,
  draggable = false,
  compact = false,
}: AppointmentBlockProps) {
  const { top, height } = getAppointmentPosition(
    appointment.start_time,
    appointment.end_time,
  );

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("appointmentId", appointment.id);
    e.dataTransfer.setData("duration", String(
      (parseISO(appointment.end_time).getTime() - parseISO(appointment.start_time).getTime()) / 60000,
    ));
  }

  return (
    <button
      type="button"
      draggable={draggable && appointment.status !== "cancelled"}
      onDragStart={handleDragStart}
      className={cn(
        "pointer-events-auto absolute overflow-hidden rounded-lg px-2 py-1 text-left text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "inset-x-0.5 text-[10px]" : "inset-x-2 text-xs",
      )}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        minHeight: compact ? "20px" : "28px",
        ...getAppointmentBlockStyle(appointment.status, appointment.service.color),
      }}
      onClick={() => onSelect(appointment)}
      aria-label={`${appointment.customer.name}, ${appointment.service.name}, ${formatTime(parseISO(appointment.start_time))}`}
    >
      <p className="truncate font-medium">{appointment.customer.name}</p>
      {!compact && (
        <p className="truncate opacity-90">{appointment.service.name}</p>
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
  onDrop: (date: Date) => void;
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
    e.currentTarget.classList.add("bg-primary/10");
  }

  function handleDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove("bg-primary/10");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-primary/10");
    const appointmentId = e.dataTransfer.getData("appointmentId");
    if (!appointmentId) return;

    const slot = new Date(date);
    slot.setHours(hour, 0, 0, 0);
    onDrop(slot);
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
