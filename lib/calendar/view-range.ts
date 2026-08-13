/**
 * Shared calendar query ranges for Reception / Calendar views.
 * Day, week, and month use business-timezone boundaries (not browser local).
 *
 * LOCK: `date` here is the selected civil **anchor**, not a fetch-window edge.
 * Callers must never write `range.start` / `range.end` back into `?date=`.
 */

import {
  endOfBusinessDay,
  endOfBusinessWeek,
  startOfBusinessDay,
  startOfBusinessWeek,
} from "@/lib/business/datetime";
import { businessMonthGridRange } from "@/lib/calendar/planning-geometry";
import type { BusinessLocaleInput } from "@/lib/locale";
import type { CalendarView } from "@/lib/types/booking";

export type CalendarViewRange = {
  start: Date;
  end: Date;
};

/**
 * Appointment fetch window for a calendar view from a civil anchor.
 * Week = Sunday–Saturday in business TZ (matches startOfBusinessWeek).
 * Month = Sunday–Saturday grid covering the business-local month (outside-month cells included).
 * The returned start/end are fetch bounds only — not URL identity.
 */
export function getCalendarViewRange(
  view: CalendarView,
  date: Date,
  locale: BusinessLocaleInput & { locationTimezone?: string | null },
): CalendarViewRange {
  switch (view) {
    case "day":
    case "timeline":
    case "employees":
    case "locations":
    case "resource":
      return {
        start: startOfBusinessDay(date, locale),
        end: endOfBusinessDay(date, locale),
      };
    case "week":
    case "agenda":
      return {
        start: startOfBusinessWeek(date, locale),
        end: endOfBusinessWeek(date, locale),
      };
    case "month":
      return businessMonthGridRange(
        date,
        locale.locationTimezone ?? locale.timezone,
      );
    default:
      return {
        start: startOfBusinessDay(date, locale),
        end: endOfBusinessDay(date, locale),
      };
  }
}
