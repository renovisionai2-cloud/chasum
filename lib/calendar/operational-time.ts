import { addCalendarDays, calendarDateInTimezone } from "@/lib/business/datetime";
import { formatCalendarDateParam } from "@/lib/calendar/date-param";

/** Calendar Date objects are civil-date adapters, never appointment instants. */
export function isOperationalDay(instant: string | Date, day: Date, timezone?: string | null) {
  return calendarDateInTimezone(instant, timezone) === formatCalendarDateParam(day);
}

export function wallMinutes(instant: string | Date, timezone?: string | null): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "America/Toronto", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(instant));
  return Number(parts.find(p => p.type === "hour")?.value) * 60 + Number(parts.find(p => p.type === "minute")?.value);
}

/** Reject gaps and repeated wall times: the single-axis UI cannot disambiguate them. */
export function operationalSlot(day: Date, minutes: number, timezone: string): Date | null {
  if (!Number.isFinite(minutes) || !Number.isInteger(minutes)) return null;
  const civil = addCalendarDays(formatCalendarDateParam(day), Math.floor(minutes / 1440));
  const minute = ((minutes % 1440) + 1440) % 1440;
  const wall = (Date.parse(`${civil}T12:00:00Z`) - 720 * 60000) + minute * 60000;
  const offsets = new Set<number>();
  for (let h = -36; h <= 36; h += 6) {
    const sample = new Date(wall + h * 3600000);
    const sampleCivil = calendarDateInTimezone(sample, timezone);
    offsets.add((Date.parse(`${sampleCivil}T12:00:00Z`) - 720 * 60000) + wallMinutes(sample, timezone) * 60000 - sample.getTime());
  }
  const matches = [...offsets].map(offset => new Date(wall - offset)).filter(candidate =>
    calendarDateInTimezone(candidate, timezone) === civil && wallMinutes(candidate, timezone) === minute,
  );
  return matches.length === 1 ? matches[0] : null;
}

export function resizeOperationalEnd(end: Date, delta: number, timezone: string): Date | null {
  const civil = calendarDateInTimezone(end, timezone);
  const [year, month, day] = civil.split("-").map(Number);
  return operationalSlot(new Date(year, month - 1, day, 12), wallMinutes(end, timezone) + delta, timezone);
}

/** Wall-clock axis, clipped to the selected day and visible working-hour window. */
export function operationalPosition(start: string, end: string, day: Date, timezone: string, startHour = 7, endHour = 22) {
  const civil = formatCalendarDateParam(day);
  const first = calendarDateInTimezone(start, timezone);
  const last = calendarDateInTimezone(end, timezone);
  const from = first < civil ? 0 : first > civil ? 1440 : wallMinutes(start, timezone);
  const to = last > civil ? 1440 : last < civil ? 0 : wallMinutes(end, timezone);
  const low = Math.max(startHour * 60, from);
  const high = Math.min(endHour * 60, to);
  const total = (endHour - startHour) * 60;
  return { top: (low - startHour * 60) / total * 100, height: Math.max(0, high - low) / total * 100 };
}

export function overlapsOperationalDay(start: string, end: string, day: Date, timezone: string) {
  const civil = formatCalendarDateParam(day);
  return calendarDateInTimezone(start, timezone) <= civil && calendarDateInTimezone(new Date(new Date(end).getTime() - 1), timezone) >= civil;
}
