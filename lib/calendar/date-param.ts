import { addCalendarDays, calendarDateInTimezone } from "@/lib/business/datetime";

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

/** Prefer YYYY-MM-DD in calendar URLs for stable round-trips. */
export function formatCalendarDateParam(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    return formatCalendarDateParam(new Date());
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Resolve a URL/default day in the operational timezone before RSC serialization. */
export function resolveCalendarDateValue(
  raw: string | null | undefined,
  timezone: string,
  now: Date = new Date(),
): string {
  const fallback = calendarDateInTimezone(now, timezone);
  const value = raw?.trim();
  if (!value) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    try {
      return addCalendarDays(value, 0);
    } catch {
      return fallback;
    }
  }
  // Only explicit instants are accepted as the legacy URL format.
  if (!/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return fallback;
  return calendarDateInTimezone(value, timezone) || fallback;
}
