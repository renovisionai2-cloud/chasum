/**
 * Business-day boundaries in the business (or location) timezone.
 * Dashboards and reports must not use server-local midnight.
 */

import { getBusinessTimezone, type BusinessLocaleInput } from "@/lib/locale";

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

export function startOfBusinessMonth(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): Date {
  const timeZone = resolveBusinessTimezone(input);
  const p = partsInZone(date, timeZone);
  return zonedTimeToUtc(p.year, p.month, 1, 0, 0, 0, timeZone);
}

export function startOfBusinessYear(
  date: Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): Date {
  const timeZone = resolveBusinessTimezone(input);
  const p = partsInZone(date, timeZone);
  return zonedTimeToUtc(p.year, 1, 1, 0, 0, 0, timeZone);
}

/** Civil dates are strings, never instants. UTC is used only for Gregorian arithmetic. */
export function addCalendarDays(value: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("Invalid calendar date");
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(y, m - 1, d);
  date.setUTCHours(12, 0, 0, 0);
  if (date.toISOString().slice(0, 10) !== value) throw new RangeError("Invalid calendar date");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Format a civil date without interpreting it in the viewer's timezone. */
export function formatCalendarDay(value: string, options: Intl.DateTimeFormatOptions): string {
  addCalendarDays(value, 0); // Validate before formatting.
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

export function businessDateChips(now: string | Date, timezone: string, count = 14) {
  const today = calendarDateInTimezone(now, timezone);
  return Array.from({ length: count }, (_, i) => {
    const value = addCalendarDays(today, i);
    return {
      value,
      label: formatCalendarDay(value, { weekday: "short" }),
      day: formatCalendarDay(value, { day: "numeric" }),
      month: formatCalendarDay(value, { month: "short" }),
    };
  });
}

/** Convert a civil boundary to an instant only at the database query boundary. */
export function calendarDayStart(value: string, timezone: string): Date {
  addCalendarDays(value, 0);
  const [y, m, d] = value.split("-").map(Number);
  // Locate the first instant belonging to the civil date. Unlike a single
  // offset guess, this also handles DST changes at (or before) midnight.
  const anchor = new Date(0);
  anchor.setUTCFullYear(y, m - 1, d);
  anchor.setUTCHours(12, 0, 0, 0);
  let low = anchor.getTime() - 48 * 60 * 60 * 1000;
  let high = anchor.getTime() + 48 * 60 * 60 * 1000;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (calendarDateInTimezone(new Date(mid), timezone) < value) low = mid + 1;
    else high = mid;
  }
  const start = new Date(low);
  if (calendarDateInTimezone(start, timezone) !== value) {
    throw new RangeError("Calendar date does not exist in this timezone");
  }
  return start;
}
