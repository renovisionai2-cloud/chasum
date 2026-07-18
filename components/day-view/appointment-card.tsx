"use client";

import { StatusBadge } from "@/components/ui/badge";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  formatTime,
  getAppointmentPosition,
  parseISO,
} from "@/lib/calendar/utils";
import { getAppointmentBlockStyle } from "@/lib/calendar/status-colors";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { addMinutes } from "date-fns";
import { FileText, Wallet } from "lucide-react";
import { useState } from "react";

export type CalendarColorMode = "service" | "staff";

type DayAppointmentCardProps = {
  appointment: AppointmentWithRelations;
  onSelect: (appointment: AppointmentWithRelations) => void;
  onResize?: (appointment: AppointmentWithRelations, newEnd: Date) => void;
  colorMode?: CalendarColorMode;
  draggable?: boolean;
  column?: number;
  columns?: number;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function DayAppointmentCard({
  appointment,
  onSelect,
  onResize,
  colorMode = "service",
  draggable = false,
  column = 0,
  columns = 1,
}: DayAppointmentCardProps) {
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
  const hasNotes = Boolean(appointment.notes?.trim());
  const deposit = Number(appointment.deposit_cents ?? 0);
  const priceCents =
    appointment.price_cents != null
      ? Number(appointment.price_cents)
      : null;
  const paymentDue =
    appointment.status !== "cancelled" &&
    appointment.status !== "completed" &&
    priceCents != null &&
    priceCents > 0 &&
    deposit < priceCents;

  function handleDragStart(e: React.DragEvent) {
    setDragging(true);
    e.dataTransfer.setData("appointmentId", appointment.id);
    e.dataTransfer.setData("staffId", appointment.staff_id);
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
      onDragEnd={() => setDragging(false)}
      title={`${appointment.customer.name} · ${appointment.service.name} · ${startLabel}–${endLabel}`}
      className={cn(
        "pointer-events-auto absolute overflow-hidden rounded-[0.55rem] border border-white/25 px-1.5 py-1 text-left text-white shadow-sm transition-[box-shadow,opacity,transform] motion-safe:hover:z-20 motion-safe:hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "text-[10px] leading-tight sm:text-[11px]",
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
        minHeight: "36px",
        ...getAppointmentBlockStyle(appointment.status, fillColor),
      }}
      onClick={() => onSelect(appointment)}
      aria-label={`${appointment.customer.name}, ${appointment.service.name}, ${startLabel}, ${appointment.status}`}
    >
      <div className="flex items-start gap-1.5">
        <span
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-black/25 text-[9px] font-semibold"
          aria-hidden
        >
          {initials(appointment.customer.name || "?")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-tight">
            {appointment.customer.name}
          </p>
          <p className="truncate opacity-95">{appointment.service.name}</p>
          <p className="truncate text-[9px] opacity-85 sm:text-[10px]">
            {startLabel}–{endLabel}
          </p>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span className="rounded bg-black/20 px-1 py-px text-[9px] font-medium capitalize">
          {appointment.status.replace("_", " ")}
        </span>
        {paymentDue ? (
          <span className="inline-flex items-center gap-0.5 rounded bg-black/20 px-1 py-px text-[9px]">
            <Wallet className="size-2.5" aria-hidden />
            Due
          </span>
        ) : null}
        {hasNotes ? (
          <span className="inline-flex items-center gap-0.5 rounded bg-black/20 px-1 py-px text-[9px]">
            <FileText className="size-2.5" aria-hidden />
            Note
          </span>
        ) : null}
      </div>
      {onResize && appointment.status !== "cancelled" ? (
        <span
          role="separator"
          aria-label="Resize duration"
          className="absolute inset-x-0 bottom-0 flex h-3 cursor-ns-resize items-end justify-center rounded-b bg-gradient-to-t from-black/30 to-transparent"
          onPointerDown={handleResizePointerDown}
          onClick={(ev) => ev.stopPropagation()}
        >
          <span className="mb-0.5 h-0.5 w-8 rounded-full bg-white/85" />
        </span>
      ) : null}
    </button>
  );
}

/** Re-export for drawer consumers */
export { StatusBadge };
