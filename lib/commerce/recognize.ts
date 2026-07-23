/**
 * Single source of truth for appointment revenue recognition.
 * Dashboards, reports, CRM, employees, and AI snapshots must use this.
 *
 * Rule: count revenue when the visit is completed OR money was collected.
 * Collected money is stamped onto appointments from `commerce_transactions`
 * (amount_paid_cents / payment_status) — never invent parallel formulas.
 * Cancelled / no-show visits never recognize revenue.
 */

export type RecognizableAppointment = {
  status?: string | null;
  price_cents?: number | null;
  amount_paid_cents?: number | null;
  deposit_cents?: number | null;
  payment_status?: string | null;
  service?: { price?: number | null } | null;
};

const PAID_STATUSES = new Set([
  "deposit_paid",
  "partially_paid",
  "fully_paid",
]);

export function isCancelledOrNoShow(
  status: string | null | undefined,
): boolean {
  return status === "cancelled" || status === "no_show";
}

/** Active booked work (volume KPIs) — excludes cancelled / no-show. */
export function isActiveBooking(status: string | null | undefined): boolean {
  return !isCancelledOrNoShow(status);
}

export function appointmentPriceCents(row: RecognizableAppointment): number {
  if (row.price_cents != null && Number(row.price_cents) > 0) {
    return Math.round(Number(row.price_cents));
  }
  const dollars = Number(row.service?.price ?? 0);
  return Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
}

export function appointmentPaidCents(row: RecognizableAppointment): number {
  const paid = Number(row.amount_paid_cents ?? 0);
  if (paid > 0) return Math.round(paid);
  const deposit = Number(row.deposit_cents ?? 0);
  return deposit > 0 ? Math.round(deposit) : 0;
}

/**
 * Whether this appointment should contribute to recognized revenue.
 */
export function recognizesAppointmentRevenue(
  row: RecognizableAppointment,
): boolean {
  if (isCancelledOrNoShow(row.status)) return false;
  if (row.status === "completed") return true;
  if (appointmentPaidCents(row) > 0) return true;
  return PAID_STATUSES.has(String(row.payment_status ?? ""));
}

/**
 * Recognized revenue in cents for one appointment.
 * Prefer amount collected when present; otherwise full price for completed/paid-status rows.
 */
export function appointmentRecognizedCents(
  row: RecognizableAppointment,
): number {
  if (!recognizesAppointmentRevenue(row)) return 0;
  const paid = appointmentPaidCents(row);
  if (paid > 0) return paid;
  return appointmentPriceCents(row);
}

export function sumRecognizedRevenueCents(
  rows: RecognizableAppointment[],
): number {
  return rows.reduce((sum, row) => sum + appointmentRecognizedCents(row), 0);
}

export function sumRecognizedRevenueDollars(
  rows: RecognizableAppointment[],
): number {
  return sumRecognizedRevenueCents(rows) / 100;
}
