/**
 * Parse calendar ?date= search params safely.
 *
 * Clients historically push either:
 * - YYYY-MM-DD
 * - full ISO timestamptz (from range.start.toISOString())
 *
 * Never concatenate "T12:00:00" onto an ISO string — that yields Invalid Date
 * and crashes Server Components calling toISOString().
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
 * Prefer YYYY-MM-DD in calendar URLs for stable round-trips.
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
