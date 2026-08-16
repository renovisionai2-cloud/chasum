/**
 * Reports → Appointments “Rescheduled” must mean a real start/end change.
 * Do not use appointments.updated_at vs created_at (payments and note saves bump that).
 */

export type ScheduleChangeLogRow = {
  appointment_id: string;
  action: string;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
};

function instantMs(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function fieldMoved(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  key: string,
): boolean {
  const a = instantMs(before?.[key]);
  const b = instantMs(after?.[key]);
  if (a == null || b == null) return false;
  return a !== b;
}

/** True when a change-log row moved start_time and/or end_time. */
export function logRecordsScheduleMove(log: ScheduleChangeLogRow): boolean {
  const action = log.action;
  if (action !== "reschedule" && action !== "resize" && action !== "update") {
    return false;
  }
  const before = log.before_state ?? null;
  const after = log.after_state ?? null;
  return (
    fieldMoved(before, after, "start_time") ||
    fieldMoved(before, after, "end_time")
  );
}

export function appointmentHadScheduleMove(
  appointmentId: string,
  logs: ScheduleChangeLogRow[],
): boolean {
  return logs.some(
    (log) =>
      log.appointment_id === appointmentId && logRecordsScheduleMove(log),
  );
}

/**
 * Count month-window appointments that have evidence of a real slot move.
 * Employee-only / notes / payment / unchanged saves do not count.
 */
export function countRescheduledAppointments(
  monthAppointments: Array<{ id: string; status: string }>,
  logs: ScheduleChangeLogRow[],
): number {
  return monthAppointments.filter(
    (a) => a.status !== "cancelled" && appointmentHadScheduleMove(a.id, logs),
  ).length;
}
