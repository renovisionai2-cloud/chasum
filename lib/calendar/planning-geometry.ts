/**
 * Week / Month planning geometry — business/location timezone only.
 * Do not use browser-local getDay / startOfWeek / isSameDay for civil dates.
 */

import {
  calendarDateInTimezone,
  dayOfWeekInTimezone,
  endOfBusinessDay,
  startOfBusinessDay,
  startOfBusinessMonth,
  startOfBusinessWeek,
  zonedTimeToUtc,
} from "@/lib/business/datetime";

export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

function resolveZone(timeZone: string | null | undefined): string {
  return timeZone && timeZone.trim().length > 0 ? timeZone.trim() : "UTC";
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Add whole civil days to a YYYY-MM-DD string (DST-safe). */
export function addCivilDays(civilDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  if (!match) return civilDate;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
}

/** Midday instant for a civil date in the business timezone (stable URL/state anchor). */
export function civilDateToAnchor(
  civilDate: string,
  timeZone: string | null | undefined,
): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  if (!match) return new Date();
  const zone = resolveZone(timeZone);
  return zonedTimeToUtc(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    12,
    0,
    0,
    zone,
  );
}

export function shiftBusinessCivilDate(
  date: Date,
  timeZone: string | null | undefined,
  days: number,
): Date {
  const civil = calendarDateInTimezone(date, timeZone);
  return civilDateToAnchor(addCivilDays(civil, days), timeZone);
}

export function shiftBusinessMonth(
  date: Date,
  timeZone: string | null | undefined,
  monthDelta: number,
): Date {
  const civil = calendarDateInTimezone(date, timeZone);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civil);
  if (!match) return date;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const cursor = new Date(Date.UTC(year, month - 1 + monthDelta, 1, 12));
  const last = new Date(
    Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const next = `${cursor.getUTCFullYear()}-${pad2(cursor.getUTCMonth() + 1)}-${pad2(Math.min(day, last))}`;
  return civilDateToAnchor(next, timeZone);
}

export function businessWeekCivilDates(
  anchor: Date,
  timeZone: string | null | undefined,
): string[] {
  const locale = { timezone: resolveZone(timeZone), currency: "USD" };
  const start = startOfBusinessWeek(anchor, locale);
  const startCivil = calendarDateInTimezone(start, timeZone);
  return Array.from({ length: 7 }, (_, i) => addCivilDays(startCivil, i));
}

/** 42-cell month grid (Sunday start) in business civil dates. */
export function businessMonthGridCivilDates(
  anchor: Date,
  timeZone: string | null | undefined,
): string[] {
  const locale = { timezone: resolveZone(timeZone), currency: "USD" };
  const monthStart = startOfBusinessMonth(anchor, locale);
  const monthStartCivil = calendarDateInTimezone(monthStart, timeZone);
  const dow = dayOfWeekInTimezone(monthStart, timeZone);
  const gridStart = addCivilDays(monthStartCivil, -dow);
  return Array.from({ length: 42 }, (_, i) => addCivilDays(gridStart, i));
}

export function businessMonthGridRange(
  anchor: Date,
  timeZone: string | null | undefined,
): { start: Date; end: Date } {
  const days = businessMonthGridCivilDates(anchor, timeZone);
  const locale = { timezone: resolveZone(timeZone), currency: "USD" };
  return {
    start: startOfBusinessDay(civilDateToAnchor(days[0]!, timeZone), locale),
    end: endOfBusinessDay(civilDateToAnchor(days[41]!, timeZone), locale),
  };
}

export function isBusinessToday(
  civilDate: string,
  timeZone: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return calendarDateInTimezone(now, timeZone) === civilDate;
}

export function civilMonthKey(civilDate: string): string {
  return civilDate.slice(0, 7);
}

export function formatWeekRangeInTimezone(
  anchor: Date,
  timeZone: string | null | undefined,
): string {
  const days = businessWeekCivilDates(anchor, timeZone);
  const start = civilDateToAnchor(days[0]!, timeZone);
  const end = civilDateToAnchor(days[6]!, timeZone);
  const startLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveZone(timeZone),
    month: "short",
    day: "numeric",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveZone(timeZone),
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(end);
  return `${startLabel} – ${endLabel}`;
}

export function formatMonthYearInTimezone(
  anchor: Date,
  timeZone: string | null | undefined,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: resolveZone(timeZone),
    month: "long",
    year: "numeric",
  }).format(anchor);
}

export function formatCivilDateLong(
  civilDate: string,
  timeZone: string | null | undefined,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: resolveZone(timeZone),
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(civilDateToAnchor(civilDate, timeZone));
}

export function weekdayIndexFromCivil(civilDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  if (!match) return 0;
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12),
  ).getUTCDay();
}

export function groupAppointmentsByBusinessDay<
  T extends { start_time: string; status?: string | null },
>(
  appointments: T[],
  timeZone: string | null | undefined,
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const appointment of appointments) {
    if (appointment.status === "cancelled") continue;
    const civil = calendarDateInTimezone(appointment.start_time, timeZone);
    if (!civil) continue;
    const list = grouped.get(civil);
    if (list) list.push(appointment);
    else grouped.set(civil, [appointment]);
  }
  for (const list of grouped.values()) {
    list.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }
  return grouped;
}
