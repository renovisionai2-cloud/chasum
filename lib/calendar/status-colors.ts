import type { AppointmentStatus } from "@/lib/types/booking";
import { APPOINTMENT_STATUS_COLORS } from "@/lib/types/booking";

export function getStatusColor(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_COLORS[status] ?? APPOINTMENT_STATUS_COLORS.pending;
}

export function getAppointmentBlockStyle(
  status: AppointmentStatus,
  color: string,
): { backgroundColor: string; borderLeft: string; opacity: number } {
  const statusColor = getStatusColor(status);
  return {
    backgroundColor: color,
    borderLeft: `4px solid ${statusColor}`,
    opacity: status === "cancelled" ? 0.5 : 1,
  };
}

/**
 * Browser-local current-time position (Week/Month legacy).
 * Day View must use getCurrentTimePositionInTimezone from day-geometry.
 */
export function getCurrentTimePosition(
  startHour: number,
  endHour: number,
  now: Date = new Date(),
): number | null {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60;
  const totalMinutes = (endHour - startHour) * 60;

  if (minutes < startMinutes || minutes > startMinutes + totalMinutes) {
    return null;
  }

  return ((minutes - startMinutes) / totalMinutes) * 100;
}
