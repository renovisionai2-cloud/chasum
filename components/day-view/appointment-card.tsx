"use client";

import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  parseISO,
} from "@/lib/calendar/utils";
import { getAppointmentBlockStyle } from "@/lib/calendar/status-colors";
import {
  formatTimeInTimezone,
  getAppointmentPositionInTimezone,
} from "@/lib/calendar/day-geometry";
import { appointmentStatusTone } from "@/lib/calendar/appointment-status-ui";
import {
  paymentReadinessFromStatus,
  paymentReadinessLabel,
} from "@/lib/dashboard/appointment-ops";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { addMinutes } from "date-fns";
import { Wallet } from "lucide-react";
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
  /** Business/location IANA timezone for geometry + labels. */
  timeZone?: string | null;
  /** When true, lane already shows employee — omit staff echo. */
  inStaffLane?: boolean;
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
  timeZone = null,
  inStaffLane = true,
}: DayAppointmentCardProps) {
  const [dragging, setDragging] = useState(false);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const { top, height } = getAppointmentPositionInTimezone(
    appointment.start_time,
    appointment.end_time,
    timeZone,
  );
  const fillColor =
    colorMode === "staff"
      ? appointment.staff?.color ?? appointment.service.color
      : appointment.service.color;

  const widthPct = 100 / columns;
  const leftPct = column * widthPct;
  const startLabel = formatTimeInTimezone(appointment.start_time, timeZone);
  const endLabel = formatTimeInTimezone(appointment.end_time, timeZone);
  const durationMin =
    (parseISO(appointment.end_time).getTime() -
      parseISO(appointment.start_time).getTime()) /
    60000;
  const compact = durationMin < 30;
  const rich = durationMin >= 45;
  const statusTone = appointmentStatusTone(appointment.status);
  const readiness = paymentReadinessFromStatus(appointment.payment_status);
  const paymentLabel = paymentReadinessLabel(readiness);
  const paymentDue =
    appointment.status !== "cancelled" &&
    (readiness === "payment_due" || readiness === "balance_due");
  const showPayment = paymentDue;
  const showStatus =
    !compact &&
    (statusTone.attention === "action" ||
      statusTone.attention === "risk" ||
      appointment.status === "completed");

  function handleDragStart(e: React.DragEvent) {
    setDragging(true);
    e.dataTransfer.setData("appointmentId", appointment.id);
    e.dataTransfer.setData("staffId", appointment.staff_id ?? "");
    e.dataTransfer.setData("duration", String(durationMin));
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
      title={`${appointment.customer.name} · ${appointment.service.name} · ${startLabel}–${endLabel} · ${statusTone.label}${showPayment && paymentLabel ? ` · ${paymentLabel}` : ""}`}
      className={cn(
        "pointer-events-auto absolute overflow-hidden rounded-[0.55rem] border border-white/15 px-2 py-1.5 text-left text-white shadow-sm transition-[box-shadow,opacity] hover:z-20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "leading-snug",
        draggable &&
          appointment.status !== "cancelled" &&
          "cursor-grab active:cursor-grabbing",
        dragging && "opacity-55 ring-2 ring-white/70",
        statusTone.attention === "risk" && "ring-1 ring-white/40",
      )}
      style={{
        top: `${top}%`,
        height: `${previewHeight ?? height}%`,
        left: `calc(${leftPct}% + 3px)`,
        width: `calc(${widthPct}% - 6px)`,
        minHeight: compact ? "36px" : "48px",
        ...getAppointmentBlockStyle(appointment.status, fillColor),
      }}
      onClick={() => onSelect(appointment)}
      aria-label={`${appointment.customer.name}, ${appointment.service.name}, ${startLabel}, ${statusTone.label}${showPayment && paymentLabel ? `, ${paymentLabel}` : ""}`}
    >
      <div className="flex items-start gap-1.5">
        {rich ? (
          <span
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-black/25 text-[10px] font-semibold"
            aria-hidden
          >
            {initials(appointment.customer.name || "?")}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold tracking-tight">
            {appointment.customer.name}
          </p>
          {compact ? (
            <p className="truncate text-[11px] tabular-nums opacity-90">
              {startLabel} · {appointment.service.name}
            </p>
          ) : (
            <>
              <p className="truncate text-[12px] opacity-95">
                {appointment.service.name}
              </p>
              <p className="truncate text-[11px] tabular-nums opacity-90">
                {startLabel}–{endLabel}
                {!inStaffLane && appointment.staff?.name
                  ? ` · ${appointment.staff.name}`
                  : ""}
              </p>
            </>
          )}
        </div>
      </div>
      {(showStatus || showPayment) && (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {showStatus ? (
            <span className="rounded bg-black/20 px-1 py-px text-[9px] font-medium">
              {statusTone.label}
            </span>
          ) : null}
          {showPayment && paymentLabel ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-black/25 px-1 py-px text-[9px] font-medium">
              <Wallet className="size-2.5" aria-hidden />
              {paymentLabel}
            </span>
          ) : null}
        </div>
      )}
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

export { StatusBadge } from "@/components/ui/badge";
