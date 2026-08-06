/**
 * Shared calendar query ranges for Reception / Calendar views.
 * Day, week, and month use business-timezone boundaries (not browser local).
 */

import {
  endOfBusinessDay,
  endOfBusinessMonth,
  endOfBusinessWeek,
  startOfBusinessDay,
  startOfBusinessMonth,
  startOfBusinessWeek,
} from "@/lib/business/datetime";
import type { BusinessLocaleInput } from "@/lib/locale";
import type { CalendarView } from "@/lib/types/booking";

export type CalendarViewRange = {
  start: Date;
  end: Date;
};

/**
 * Appointment fetch window for a calendar view.
 * Week = Sunday–Saturday in business TZ (matches startOfBusinessWeek).
 * Month = first through last instant of the business-local month.
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
      return {
        start: startOfBusinessMonth(date, locale),
        end: endOfBusinessMonth(date, locale),
      };
    default:
      return {
        start: startOfBusinessDay(date, locale),
        end: endOfBusinessDay(date, locale),
      };
  }
}
