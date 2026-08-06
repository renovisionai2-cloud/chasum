/**
 * Business-day boundaries in the business (or location) timezone.
 * Dashboards and reports must not use server-local midnight.
 */

import { getBusinessTimezone, type BusinessLocaleInput } from "@/lib/locale";
import { addDays } from "date-fns";

function partsInZone(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Offset (ms) of timeZone at the given instant. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - date.getTime();
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = zoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

export function resolveBusinessTimezone(
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): string {
  return getBusinessTimezone(input);
}

/**
 * Calendar date (YYYY-MM-DD) for an instant in a given IANA timezone.
 * Never use browser-local format() for booking dates — that drifts across zones.
 */
export function calendarDateInTimezone(
  isoOrDate: string | Date,
  timeZone: string | null | undefined,
): string {
  const date =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (!Number.isFinite(date.getTime())) {
    return "";
  }
  const zone =
    timeZone && timeZone.trim().length > 0 ? timeZone.trim() : "UTC";
  const p = partsInZone(date, zone);
  const y = String(p.year).padStart(4, "0");
  const m = String(p.month).padStart(2, "0");
  const d = String(p.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local hour (0–23) in the business/location timezone. */
export function hourInBusinessTimezone(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): number {
  const timeZone = resolveBusinessTimezone(input);
  return partsInZone(date, timeZone).hour;
}

export function startOfBusinessDay(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): Date {
  const timeZone = resolveBusinessTimezone(input);
  const p = partsInZone(date, timeZone);
  return zonedTimeToUtc(p.year, p.month, p.day, 0, 0, 0, timeZone);
}

export function endOfBusinessDay(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): Date {
  const timeZone = resolveBusinessTimezone(input);
  const p = partsInZone(date, timeZone);
  return zonedTimeToUtc(p.year, p.month, p.day, 23, 59, 59, timeZone);
}

export function startOfBusinessWeek(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): Date {
  const timeZone = resolveBusinessTimezone(input);
  const p = partsInZone(date, timeZone);
  // Reconstruct day-of-week via UTC weekday of zoned calendar date
  const asLocal = new Date(Date.UTC(p.year, p.month - 1, p.day, 12));
  const dow = asLocal.getUTCDay();
  const startDay = p.day - dow;
  return zonedTimeToUtc(p.year, p.month, startDay, 0, 0, 0, timeZone);
}

/** Inclusive end of the business-local week (Sunday 23:59:59). */
export function endOfBusinessWeek(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): Date {
  const weekStart = startOfBusinessWeek(date, input);
  return endOfBusinessDay(addDays(weekStart, 6), input);
}

export function startOfBusinessMonth(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): Date {
  const timeZone = resolveBusinessTimezone(input);
  const p = partsInZone(date, timeZone);
  return zonedTimeToUtc(p.year, p.month, 1, 0, 0, 0, timeZone);
}

/** Inclusive end of the business-local month (last day 23:59:59). */
export function endOfBusinessMonth(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): Date {
  const monthStart = startOfBusinessMonth(date, input);
  const nextMonthStart = startOfBusinessMonth(addDays(monthStart, 35), input);
  return new Date(nextMonthStart.getTime() - 1);
}

export function startOfBusinessYear(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): Date {
  const timeZone = resolveBusinessTimezone(input);
  const p = partsInZone(date, timeZone);
  return zonedTimeToUtc(p.year, 1, 1, 0, 0, 0, timeZone);
}
