/**
 * Shared appointment status presentation for Calendar / Reception / Management.
 * Only real AppointmentStatus values — no invented lifecycle states.
 */

import type { AppointmentStatus } from "@/lib/types/booking";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/types/booking";

export type AppointmentStatusTone = {
  label: string;
  color: string;
  /** Short operational emphasis for day cards (color alone is not enough). */
  attention: "none" | "action" | "done" | "risk";
};

const ATTENTION: Record<AppointmentStatus, AppointmentStatusTone["attention"]> =
  {
    pending: "action",
    confirmed: "none",
    arrived: "action",
    waiting: "action",
    in_progress: "action",
    completed: "done",
    cancelled: "risk",
    no_show: "risk",
  };

export function appointmentStatusTone(
  status: AppointmentStatus,
): AppointmentStatusTone {
  return {
    label: APPOINTMENT_STATUS_LABELS[status] ?? status,
    color: APPOINTMENT_STATUS_COLORS[status] ?? APPOINTMENT_STATUS_COLORS.pending,
    attention: ATTENTION[status] ?? "none",
  };
}

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status;
}
