import type { AppointmentStatus } from "@/lib/types/booking";
import type { CrmAppointmentBucket } from "@/lib/crm/types";

const OPEN_STATUSES = new Set<AppointmentStatus>([
  "pending",
  "confirmed",
  "arrived",
  "waiting",
  "in_progress",
]);

export function appointmentEndMs(row: {
  start_time: string;
  end_time?: string | null;
}): number {
  const end = row.end_time ? new Date(row.end_time).getTime() : NaN;
  if (Number.isFinite(end)) return end;
  return new Date(row.start_time).getTime();
}

export function isOpenAppointmentStatus(
  status: string | null | undefined,
): boolean {
  return OPEN_STATUSES.has(status as AppointmentStatus);
}

/**
 * Customer Workspace appointment groups.
 * Past open visits (Booked/pending/checked-in) are never silently Completed.
 */
export function bucketCustomerAppointments(
  appointments: CrmAppointmentBucket[],
  now = new Date(),
): {
  upcoming: CrmAppointmentBucket[];
  needsAttention: CrmAppointmentBucket[];
  completed: CrmAppointmentBucket[];
  cancelled: CrmAppointmentBucket[];
  noShows: CrmAppointmentBucket[];
  recurring: CrmAppointmentBucket[];
} {
  const nowMs = now.getTime();
  const upcoming: CrmAppointmentBucket[] = [];
  const needsAttention: CrmAppointmentBucket[] = [];

  for (const row of appointments) {
    if (!isOpenAppointmentStatus(row.status)) continue;
    if (appointmentEndMs(row) < nowMs) {
      needsAttention.push(row);
    } else if (new Date(row.start_time).getTime() >= nowMs) {
      upcoming.push(row);
    } else {
      needsAttention.push(row);
    }
  }

  upcoming.sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  needsAttention.sort(
    (a, b) =>
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
  );

  return {
    upcoming,
    needsAttention,
    completed: appointments.filter((a) => a.status === "completed"),
    cancelled: appointments.filter((a) => a.status === "cancelled"),
    noShows: appointments.filter((a) => a.status === "no_show"),
    recurring: appointments.filter((a) => Boolean(a.recurring_rule_id)),
  };
}

/** Last visit is a completed appointment only. */
export function lastCompletedVisitAt(
  appointments: Array<{ start_time: string; status: string }>,
): string | null {
  const completed = appointments
    .filter((a) => a.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );
  return completed[0]?.start_time ?? null;
}
