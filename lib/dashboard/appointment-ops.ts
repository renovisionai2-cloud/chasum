/**
 * Shared Reception / Calendar / Command Centre appointment operations helpers.
 * Status and payment readiness must not drift between surfaces.
 */

import { isActiveBooking, isCancelledOrNoShow } from "@/lib/commerce/recognize";
import type { AppointmentStatus } from "@/lib/types/booking";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";

export const APPOINTMENT_STATUS_MEANING: Record<AppointmentStatus, string> = {
  pending: "Awaiting confirmation — not yet confirmed with the customer",
  confirmed: "Confirmed and expected",
  arrived: "Customer has checked in",
  waiting: "Checked in and waiting for service",
  in_progress: "Service is underway",
  completed: "Service finished — payment may still be due",
  cancelled: "Cancelled — not an active appointment",
  no_show: "Customer did not attend — not an active daily appointment",
};

export function appointmentStatusLabel(status: string | null | undefined): string {
  if (status && status in APPOINTMENT_STATUS_LABELS) {
    return APPOINTMENT_STATUS_LABELS[status as AppointmentStatus];
  }
  return status?.replace(/_/g, " ") ?? "Unknown";
}

export function isPendingAppointment(status: string | null | undefined): boolean {
  return status === "pending";
}

export function isConfirmedAppointment(status: string | null | undefined): boolean {
  return status === "confirmed";
}

export function isCheckedInAppointment(status: string | null | undefined): boolean {
  return status === "arrived" || status === "waiting";
}

export function isInProgressAppointment(status: string | null | undefined): boolean {
  return status === "in_progress";
}

export function isCompletedAppointment(status: string | null | undefined): boolean {
  return status === "completed";
}

export function isCancelledAppointment(status: string | null | undefined): boolean {
  return status === "cancelled";
}

export function isNoShowAppointment(status: string | null | undefined): boolean {
  return status === "no_show";
}

export function isUnassignedAppointment(staffId: string | null | undefined): boolean {
  return !staffId;
}

/** Active for daily ops counts — same as Command Centre / Reports. */
export { isActiveBooking, isCancelledOrNoShow };

/**
 * Operational payment readiness from appointment.payment_status (commerce-stamped).
 * Do not infer solely from deposit_cents vs price.
 */
export type PaymentReadiness =
  | "paid"
  | "balance_due"
  | "payment_due"
  | "refunded"
  | "none";

export function paymentReadinessFromStatus(
  paymentStatus: string | null | undefined,
): PaymentReadiness {
  if (!paymentStatus) return "none";
  if (paymentStatus === "fully_paid") return "paid";
  if (paymentStatus === "refunded") return "refunded";
  if (
    paymentStatus === "deposit_paid" ||
    paymentStatus === "partially_paid"
  ) {
    return "balance_due";
  }
  if (
    paymentStatus === "unpaid" ||
    paymentStatus === "deposit_required"
  ) {
    return "payment_due";
  }
  return "none";
}

export function paymentReadinessLabel(readiness: PaymentReadiness): string | null {
  switch (readiness) {
    case "paid":
      return "Paid";
    case "balance_due":
      return "Balance due";
    case "payment_due":
      return "Payment due";
    case "refunded":
      return "Refunded";
    default:
      return null;
  }
}

export type DailyStatusCounts = {
  scheduled: number;
  pending: number;
  checkedIn: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  unassigned: number;
  paymentAttention: number;
};

export function countDailyStatuses(
  rows: Array<{
    status?: string | null;
    staff_id?: string | null;
    payment_status?: string | null;
  }>,
): DailyStatusCounts {
  const counts: DailyStatusCounts = {
    scheduled: 0,
    pending: 0,
    checkedIn: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    unassigned: 0,
    paymentAttention: 0,
  };

  for (const row of rows) {
    if (isCancelledAppointment(row.status)) {
      counts.cancelled += 1;
      continue;
    }
    if (isNoShowAppointment(row.status)) {
      counts.noShow += 1;
      continue;
    }
    if (!isActiveBooking(row.status)) continue;

    counts.scheduled += 1;
    if (isPendingAppointment(row.status)) counts.pending += 1;
    if (isCheckedInAppointment(row.status)) counts.checkedIn += 1;
    if (isInProgressAppointment(row.status)) counts.inProgress += 1;
    if (isCompletedAppointment(row.status)) counts.completed += 1;
    if (isUnassignedAppointment(row.staff_id)) counts.unassigned += 1;

    const ready = paymentReadinessFromStatus(row.payment_status);
    if (ready === "payment_due" || ready === "balance_due") {
      counts.paymentAttention += 1;
    }
  }

  return counts;
}

export function sortAppointmentsChronologically<
  T extends { start_time: string },
>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
}

/** Calendar board filters — employee + status (location via LocationScope cookie). */
export type CalendarBoardStaffFilter = "all" | "unassigned" | (string & {});
export type CalendarBoardStatusFilter = "all" | "active" | AppointmentStatus;

export type CalendarBoardFilters = {
  staffId: CalendarBoardStaffFilter;
  status: CalendarBoardStatusFilter;
};

export const DEFAULT_CALENDAR_BOARD_FILTERS: CalendarBoardFilters = {
  staffId: "all",
  status: "all",
};

export function calendarBoardFiltersAreActive(
  filters: CalendarBoardFilters,
): boolean {
  return (
    filters.staffId !== DEFAULT_CALENDAR_BOARD_FILTERS.staffId ||
    filters.status !== DEFAULT_CALENDAR_BOARD_FILTERS.status
  );
}

export function filterAppointmentsForBoard<
  T extends { staff_id?: string | null; status?: string | null },
>(rows: T[], filters: CalendarBoardFilters): T[] {
  return rows.filter((row) => {
    if (filters.staffId === "unassigned") {
      if (!isUnassignedAppointment(row.staff_id)) return false;
    } else if (filters.staffId !== "all") {
      if (row.staff_id !== filters.staffId) return false;
    }

    if (filters.status === "active") {
      return isActiveBooking(row.status);
    }
    if (filters.status !== "all") {
      return row.status === filters.status;
    }
    return true;
  });
}
