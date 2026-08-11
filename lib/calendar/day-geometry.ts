/**
 * Day View geometry — positions and “now” use business/location timezone.
 * Visual hour grid (7–21) is independent of booking interval (often 5 min).
 */

import {
  calendarDateInTimezone,
  isSameBusinessCalendarDay,
  minutesOfDayInTimezone,
  wallTimeOnBusinessDay,
} from "@/lib/business/datetime";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
} from "@/lib/calendar/utils";

export {
  calendarDateInTimezone,
  isSameBusinessCalendarDay,
  minutesOfDayInTimezone,
  wallTimeOnBusinessDay,
};

export type DayGridBounds = {
  startHour: number;
  endHour: number;
};

export const DEFAULT_DAY_GRID: DayGridBounds = {
  startHour: CALENDAR_START_HOUR,
  endHour: CALENDAR_END_HOUR,
};

function resolveZone(timeZone: string | null | undefined): string {
  return timeZone && timeZone.trim().length > 0 ? timeZone.trim() : "UTC";
}

/** Percent position of a minute-of-day on the Day View grid. */
export function minutesToGridPercent(
  minutes: number,
  bounds: DayGridBounds = DEFAULT_DAY_GRID,
): number | null {
  const start = bounds.startHour * 60;
  const total = (bounds.endHour - bounds.startHour) * 60;
  if (total <= 0) return null;
  if (minutes < start || minutes > start + total) return null;
  return ((minutes - start) / total) * 100;
}

/**
 * Vertical placement for an appointment on the Day View grid.
 * Uses business-TZ wall clock — never browser-local getHours().
 */
export function getAppointmentPositionInTimezone(
  startTime: string,
  endTime: string,
  timeZone: string | null | undefined,
  bounds: DayGridBounds = DEFAULT_DAY_GRID,
): { top: number; height: number } {
  const zone = resolveZone(timeZone);
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startMinutes = minutesOfDayInTimezone(start, zone);
  const durationMinutes = Math.max(
    0,
    (end.getTime() - start.getTime()) / 60000,
  );
  const totalMinutes = (bounds.endHour - bounds.startHour) * 60;
  const offset = startMinutes - bounds.startHour * 60;

  return {
    top: (offset / totalMinutes) * 100,
    height: Math.max((durationMinutes / totalMinutes) * 100, 3),
  };
}

/**
 * Current-time indicator position (%) when `now` falls inside the visible grid
 * on the business calendar day of `viewDate`. Returns null when not Today
 * or when outside visible hours (do not distort the grid).
 */
export function getCurrentTimePositionInTimezone(
  viewDate: Date,
  timeZone: string | null | undefined,
  now: Date = new Date(),
  bounds: DayGridBounds = DEFAULT_DAY_GRID,
): number | null {
  const zone = resolveZone(timeZone);
  if (!isSameBusinessCalendarDay(viewDate, now, zone)) return null;
  return minutesToGridPercent(minutesOfDayInTimezone(now, zone), bounds);
}

/** Compact time label in business timezone (e.g. "9:30 AM"). */
export function formatTimeInTimezone(
  isoOrDate: string | Date,
  timeZone: string | null | undefined,
): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (!Number.isFinite(date.getTime())) return "";
  const zone = resolveZone(timeZone);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** Day header label in business timezone. */
export function formatDayHeaderInTimezone(
  date: Date,
  timeZone: string | null | undefined,
): string {
  const zone = resolveZone(timeZone);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Stable overlap packing — deterministic column assignment. */
export {
  assignOverlapLayout,
} from "@/lib/calendar/utils";

/** Scroll target: current minutes when Today, else typical open (9:00) or first work minute. */
export function initialScrollMinutes(
  viewDate: Date,
  timeZone: string | null | undefined,
  options?: {
    now?: Date;
    openMinutes?: number | null;
  },
): number {
  const zone = resolveZone(timeZone);
  const now = options?.now ?? new Date();
  if (isSameBusinessCalendarDay(viewDate, now, zone)) {
    return minutesOfDayInTimezone(now, zone);
  }
  if (options?.openMinutes != null && Number.isFinite(options.openMinutes)) {
    return options.openMinutes;
  }
  return 9 * 60;
}
