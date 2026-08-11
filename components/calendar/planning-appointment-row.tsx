"use client";

import { formatTimeInTimezone } from "@/lib/calendar/day-geometry";
import { planningAttentionLabel } from "@/lib/calendar/planning-density";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

type PlanningAppointmentRowProps = {
  appointment: AppointmentWithRelations;
  timeZone: string | null | undefined;
  compact?: boolean;
  onSelect: (appointment: AppointmentWithRelations) => void;
};

export function PlanningAppointmentRow({
  appointment,
  timeZone,
  compact = false,
  onSelect,
}: PlanningAppointmentRowProps) {
  const time = formatTimeInTimezone(appointment.start_time, timeZone);
  const attention = planningAttentionLabel({
    status: appointment.status,
    paymentStatus: appointment.payment_status,
  });
  const employee = appointment.staff?.name ?? "Unassigned";
  const location = appointment.location?.name;
  const label = [
    time,
    appointment.customer.name,
    appointment.service.name,
    employee,
    location,
    attention,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      className={cn(
        "flex w-full min-w-0 flex-col rounded-md border border-border/70 bg-card px-2 py-1.5 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "gap-0" : "gap-0.5",
      )}
      aria-label={label}
      onClick={() => onSelect(appointment)}
    >
      <span className="truncate text-[13px] font-medium leading-tight text-foreground">
        {appointment.customer.name}
      </span>
      <span className="truncate text-[12px] leading-tight text-muted-foreground">
        {appointment.service.name}
        <span className="tabular-nums text-foreground/80"> · {time}</span>
      </span>
      {!compact ? (
        <span className="truncate text-[11px] text-muted-foreground">
          {employee}
          {location ? ` · ${location}` : ""}
          {attention ? ` · ${attention}` : ""}
        </span>
      ) : attention ? (
        <span className="text-[11px] font-medium text-foreground/80">
          {attention}
        </span>
      ) : null}
    </button>
  );
}
