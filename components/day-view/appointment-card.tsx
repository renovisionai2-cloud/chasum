"use client";

import { operationalPosition, resizeOperationalEnd } from "@/lib/calendar/operational-time";
import { formatBusinessTime } from "@/lib/locale";

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
import { FileText, Wallet, ChevronRight } from "lucide-react";
import { useState, type CSSProperties } from "react";
import styles from "./appointment-card.module.css";

export type CalendarColorMode = "service" | "staff";

type DayAppointmentCardProps = {
  timezone?: string;
  day?: Date;
  appointment: AppointmentWithRelations;
  onSelect: (appointment: AppointmentWithRelations) => void;
  onResize?: (appointment: AppointmentWithRelations, newEnd: Date) => void;
  colorMode?: CalendarColorMode;
  draggable?: boolean;
  column?: number;
  columns?: number;
};

export function DayAppointmentCard({
  appointment,
  timezone,
  day,
  onSelect,
  onResize,
  colorMode = "service",
  draggable = false,
  column = 0,
  columns = 1,
}: DayAppointmentCardProps) {
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
  const duration = Math.round((Date.parse(appointment.end_time) - Date.parse(appointment.start_time)) / 60000);
  const statusLabel = appointment.status.replaceAll("_", " ");
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
    e.dataTransfer.setData("staffId", appointment.staff_id ?? "");
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
      onDragEnd={() => setDragging(false)}
      data-interacting={dragging || previewHeight !== null || undefined}
      title={`${appointment.customer.name} · ${appointment.service.name} · ${startLabel}–${endLabel} · ${duration} min · ${statusLabel}`}
      className={cn(
        styles.card,
        "pointer-events-auto absolute rounded-lg border border-border px-2 py-1 text-left text-foreground shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "text-xs leading-4",
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
        minHeight: "40px",
        "--card-time-height": `${previewHeight ?? height}%`,
        ...getAppointmentBlockStyle(appointment.status, fillColor),
        backgroundColor: `color-mix(in oklab, ${fillColor} 9%, var(--card))`,
      } as CSSProperties}
      onClick={() => onSelect(appointment)}
      aria-label={`${appointment.customer.name}, ${appointment.service.name}, ${startLabel} to ${endLabel}, ${duration} minutes, ${statusLabel}. Open appointment details`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="min-w-0 break-words font-semibold">{appointment.customer.name}</span>
        {duration < 45 && <span className="shrink-0 text-[10px] capitalize">{statusLabel}</span>}
        <ChevronRight className="size-3.5 shrink-0" aria-hidden />
      </div>
      <p className="flex flex-wrap gap-x-1 text-[11px] leading-4">
        <span>{startLabel}–{endLabel}</span><span>· {duration} min</span>
      </p>
      <p className="flex flex-wrap items-center gap-x-2 text-[11px] leading-4">
        {duration >= 45 && <span className="font-medium capitalize">{statusLabel}</span>}
        {paymentDue && <span className="inline-flex items-center gap-0.5"><Wallet className="size-3" aria-hidden />Due</span>}
        {hasNotes && <span className="inline-flex items-center gap-0.5"><FileText className="size-3" aria-hidden />Note</span>}
      </p>
      <p className={styles.service}>{appointment.service.name}</p>
      {invalidResize && <span role="status">Unavailable or ambiguous local end time.</span>}
      {onResize && appointment.status !== "cancelled" ? (
        <span
          role="separator"
          aria-label="Resize duration"
          className="absolute inset-x-0 bottom-0 flex h-3 cursor-ns-resize items-end justify-center rounded-b"
          onPointerDown={handleResizePointerDown}
          onClick={(ev) => ev.stopPropagation()}
        >
          <span className="mb-0.5 h-0.5 w-8 rounded-full bg-foreground/30" />
        </span>
      ) : null}
    </button>
  );
}

/** Re-export for drawer consumers */
export { StatusBadge };
