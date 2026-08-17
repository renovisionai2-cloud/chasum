/**
 * Commerce document civil dates.
 *
 * `commerce_invoices.issue_date` / `due_date` are PostgreSQL `date` values.
 * They are authoritative calendar days as stored — not timestamps.
 *
 * Never format them with `new Date("YYYY-MM-DD")` (UTC midnight) or
 * `format(new Date(iso), …)` in a local timezone. That shifts the civil
 * day in America/Toronto (INV-0033 Billing Aug 14 vs document Aug 15).
 */

const CIVIL = /^(\d{4})-(\d{2})-(\d{2})/;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type CivilDateParts = { year: number; month: number; day: number };

/** Leading YYYY-MM-DD from a date-only column (optionally ISO-suffixed). */
export function parseCommerceCivilDate(
  value: string | null | undefined,
): CivilDateParts | null {
  if (!value) return null;
  const match = CIVIL.exec(String(value).trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Timezone-independent display: "Aug 15, 2026". */
export function formatCommerceCivilDate(
  value: string | null | undefined,
): string | null {
  const parts = parseCommerceCivilDate(value);
  if (!parts) return value?.trim() ? String(value).trim() : null;
  return `${MONTH_SHORT[parts.month - 1]} ${parts.day}, ${parts.year}`;
}

export function addCommerceCivilDays(
  value: string,
  days: number,
): string {
  const parts = parseCommerceCivilDate(value);
  if (!parts) return value;
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day + days);
  const d = new Date(utc);
  const y = String(d.getUTCFullYear()).padStart(4, "0");
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
