/**
 * Calendar ?date= identity — LOCK (Phase 6.0B)
 *
 * `?date=` is ALWAYS the selected business civil anchor (YYYY-MM-DD preferred).
 * It must NEVER represent:
 * - Month padded grid start
 * - Week fetch-window start
 * - Any other getCalendarViewRange().start / .end bound
 *
 * Derive fetch windows with getCalendarViewRange(view, anchor) only.
 * Parse tolerates legacy full-ISO values for deep links; writers must emit civil dates.
 */

import { calendarDateInTimezone } from "@/lib/business/datetime";

export function parseCalendarDateParam(
  raw: string | null | undefined,
  fallback: Date = new Date(),
): Date {
  if (!raw || !raw.trim()) return fallback;
  const value = raw.trim();

  // Date-only: local noon avoids UTC midnight day drift.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const localNoon = new Date(`${value}T12:00:00`);
    return Number.isFinite(localNoon.getTime()) ? localNoon : fallback;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : fallback;
}

/**
 * Encode the selected civil anchor for calendar URLs / client initialDate.
 * When `timeZone` is provided, use business civil date (not browser local).
 */
export function formatCalendarDateParam(
  date: Date,
  timeZone?: string | null,
): string {
  if (!Number.isFinite(date.getTime())) {
    return formatCalendarDateParam(new Date(), timeZone);
  }
  if (timeZone) {
    const civil = calendarDateInTimezone(date, timeZone);
    if (civil) return civil;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
