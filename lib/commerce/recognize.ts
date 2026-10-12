/** Operational completed service value (E1-B). Never collected money, accounting revenue or commission. Legacy export names remain for read-side compatibility. */

export type RecognizableAppointment = {
  status?: string | null;
  price_cents?: number | null;
  amount_paid_cents?: number | null;
  deposit_cents?: number | null;
  payment_status?: string | null;
  service?: { price?: number | null } | null;
};


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

/** Derived appointment cache only; configured requirements are not paid money. */
export function appointmentPaidCents(row: RecognizableAppointment): number {
  const paid = Number(row.amount_paid_cents ?? 0);
  if (paid > 0) return Math.round(paid);
  return 0;
}

/** Operational completed service value only, never collected money or commission. */
export function recognizesAppointmentRevenue(appt: RecognizableAppointment): boolean { return appt.status === "completed"; }
export function appointmentRecognizedCents(appt: RecognizableAppointment): number {
  return recognizesAppointmentRevenue(appt) ? appointmentPriceCents(appt) : 0;
}
export function sumRecognizedRevenueCents(appts: RecognizableAppointment[]): number { return appts.reduce((sum, appt) => sum + appointmentRecognizedCents(appt), 0); }
export function sumRecognizedRevenueDollars(appts: RecognizableAppointment[]): number { return sumRecognizedRevenueCents(appts) / 100; }
