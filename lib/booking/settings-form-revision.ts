import { persistedFormRevision } from "@/lib/forms/persisted-form-revision";

/** @deprecated Use persistedFormRevision — kept as a typed booking wrapper. */
export function persistedBookingFormRevision(
  parts: Array<string | number | boolean | null | undefined>,
): string {
  return persistedFormRevision(parts);
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
  return persistedFormRevision({
    updatedAt: input.updatedAt ?? null,
    appointmentIntervalMinutes: input.appointmentIntervalMinutes ?? null,
    bookingLimitDays: input.bookingLimitDays ?? null,
    minNoticeMinutes: input.minNoticeMinutes ?? null,
    cancellationWindowHours: input.cancellationWindowHours ?? null,
    confirmationMode: input.confirmationMode ?? null,
    reschedulePolicy: input.reschedulePolicy ?? null,
    cancellationPolicy: input.cancellationPolicy ?? null,
    onlineBookingEnabled: input.onlineBookingEnabled ?? null,
    waitlistEnabled: input.waitlistEnabled ?? null,
  });
}

export function locationSchedulingFormRevision(input: {
  appointmentIntervalMinutes?: number | null;
  bookingLimitDays?: number | null;
  maxDailyBookings?: number | null;
  cancellationPolicy?: string | null;
}): string {
  return persistedFormRevision({
    appointmentIntervalMinutes: input.appointmentIntervalMinutes ?? null,
    bookingLimitDays: input.bookingLimitDays ?? null,
    maxDailyBookings: input.maxDailyBookings ?? null,
    cancellationPolicy: input.cancellationPolicy ?? null,
  });
}

export function locationHoursFormRevision(
  hours: ReadonlyArray<{
    day_of_week: number;
    is_open?: boolean;
    open_time?: string;
    close_time?: string;
  }>,
): string {
  return persistedFormRevision(
    hours.map((row) => ({
      day: row.day_of_week,
      open: row.is_open ?? null,
      openTime: row.open_time ?? null,
      closeTime: row.close_time ?? null,
    })),
  );
}

export function staffWorkingHoursFormRevision(
  hours: ReadonlyArray<{
    day_of_week: number;
    is_working?: boolean;
    start_time?: string;
    end_time?: string;
    lunch_start_time?: string | null;
    lunch_end_time?: string | null;
    overtime_eligible?: boolean;
  }>,
): string {
  return persistedFormRevision(
    hours.map((row) => ({
      day: row.day_of_week,
      working: row.is_working ?? null,
      start: row.start_time ?? null,
      end: row.end_time ?? null,
      lunchStart: row.lunch_start_time ?? null,
      lunchEnd: row.lunch_end_time ?? null,
      overtime: row.overtime_eligible ?? null,
    })),
  );
}
