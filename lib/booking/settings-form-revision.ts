/**
 * Revision token for remounting uncontrolled booking settings forms.
 *
 * React 19 resets native form controls to their mount-time defaultValue after a
 * successful form action. router.refresh() then delivers new server props, but
 * defaultValue does not update an already-mounted uncontrolled input. Keying
 * the <form> on this token remounts the controls once persisted values change.
 *
 * Built from the editable persisted fields themselves so a remount happens
 * even when a table's updated_at is missing or not bumped (location_settings
 * has the column but no set_updated_at trigger).
 */
export function persistedBookingFormRevision(
  parts: Array<string | number | boolean | null | undefined>,
): string {
  return parts.map((part) => (part == null ? "" : String(part))).join("|");
}

export function businessBookingFormRevision(input: {
  updatedAt?: string | null;
  appointmentIntervalMinutes?: number | null;
  bookingLimitDays?: number | null;
  minNoticeMinutes?: number | null;
  cancellationWindowHours?: number | null;
  confirmationMode?: string | null;
  reschedulePolicy?: string | null;
  cancellationPolicy?: string | null;
  onlineBookingEnabled?: boolean | null;
  waitlistEnabled?: boolean | null;
}): string {
  return persistedBookingFormRevision([
    input.updatedAt,
    input.appointmentIntervalMinutes,
    input.bookingLimitDays,
    input.minNoticeMinutes,
    input.cancellationWindowHours,
    input.confirmationMode,
    input.reschedulePolicy,
    input.cancellationPolicy,
    input.onlineBookingEnabled,
    input.waitlistEnabled,
  ]);
}

export function locationSchedulingFormRevision(input: {
  appointmentIntervalMinutes?: number | null;
  bookingLimitDays?: number | null;
  maxDailyBookings?: number | null;
  cancellationPolicy?: string | null;
}): string {
  return persistedBookingFormRevision([
    input.appointmentIntervalMinutes,
    input.bookingLimitDays,
    input.maxDailyBookings,
    input.cancellationPolicy,
  ]);
}
