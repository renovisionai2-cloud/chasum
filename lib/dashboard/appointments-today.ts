/**
 * Authoritative operational count: appointments today.
 * Shared by Command Centre, Reception Morning Brief, and Reports.
 *
 * Definition (APPOINTMENTS TODAY):
 * - Count appointments whose `start_time` falls on the current business-local day
 * - Business timezone via startOfBusinessDay / endOfBusinessDay
 * - Status: active bookings only (`isActiveBooking` — excludes cancelled + no_show)
 * - Includes pending, confirmed, arrived, waiting, in_progress, completed, unassigned
 * - Visits that start today and end later are included (start_time drives the day)
 * - Location: caller applies getLocationScope / location filter
 */

import {
  endOfBusinessDay,
  startOfBusinessDay,
} from "@/lib/business/datetime";
import { isActiveBooking } from "@/lib/commerce/recognize";
import type { BusinessLocaleInput } from "@/lib/locale";

export type AppointmentTodayCandidate = {
  start_time: string;
  status?: string | null;
};

export function businessDayBounds(
  now: Date,
  locale: BusinessLocaleInput,
): { dayStart: Date; dayEnd: Date } {
  return {
    dayStart: startOfBusinessDay(now, locale),
    dayEnd: endOfBusinessDay(now, locale),
  };
}

export function isAppointmentStartOnBusinessDay(
  startTimeIso: string,
  dayStart: Date,
  dayEnd: Date,
): boolean {
  const t = new Date(startTimeIso).getTime();
  return t >= dayStart.getTime() && t <= dayEnd.getTime();
}

/** Pure filter for appointments today (active bookings only). */
export function filterAppointmentsToday<T extends AppointmentTodayCandidate>(
  rows: T[],
  now: Date,
  locale: BusinessLocaleInput,
): T[] {
  const { dayStart, dayEnd } = businessDayBounds(now, locale);
  return rows.filter(
    (row) =>
      isActiveBooking(row.status) &&
      isAppointmentStartOnBusinessDay(row.start_time, dayStart, dayEnd),
  );
}

export function countAppointmentsToday(
  rows: AppointmentTodayCandidate[],
  now: Date,
  locale: BusinessLocaleInput,
): number {
  return filterAppointmentsToday(rows, now, locale).length;
}
