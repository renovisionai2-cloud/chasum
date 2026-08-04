/**
 * Shared appointment date/time formatting for all communication emails.
 * Always converts stored UTC instants into location → business → fallback TZ.
 * Never format with the server/deployment local timezone.
 */

import { getBusinessTimezone } from "@/lib/locale";

export type AppointmentEmailTimezoneInput = {
  locationTimezone?: string | null;
  businessTimezone?: string | null;
  /** Alias already present on some contexts. */
  timezone?: string | null;
};

/** location → business → America/Toronto (validated IANA). */
export function resolveAppointmentEmailTimezone(
  input: AppointmentEmailTimezoneInput | null | undefined,
): string {
  return getBusinessTimezone({
    locationTimezone: input?.locationTimezone,
    timezone: input?.businessTimezone ?? input?.timezone,
  });
}

function partsInZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Record<string, string> {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    ...options,
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return map;
}

function parseInstant(iso: string | Date): Date | null {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Prefer region-neutral ET for Eastern; otherwise Intl short name. */
export function appointmentTimezoneAbbreviation(
  iso: string | Date,
  timeZone: string,
): string {
  if (timeZone === "America/Toronto" || timeZone === "America/New_York") {
    return "ET";
  }
  const date = parseInstant(iso);
  if (!date) return "";
  const map = partsInZone(date, timeZone, { timeZoneName: "short", hour: "numeric" });
  return map.timeZoneName ?? "";
}

/** Tuesday, August 4, 2026 */
export function formatAppointmentEmailDate(
  iso: string | Date,
  timeZoneInput?: AppointmentEmailTimezoneInput | string | null,
): string {
  const date = parseInstant(iso);
  if (!date) return "";
  const timeZone =
    typeof timeZoneInput === "string"
      ? getBusinessTimezone({ timezone: timeZoneInput })
      : resolveAppointmentEmailTimezone(timeZoneInput);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** 11:10 AM */
export function formatAppointmentEmailClock(
  iso: string | Date,
  timeZoneInput?: AppointmentEmailTimezoneInput | string | null,
): string {
  const date = parseInstant(iso);
  if (!date) return "";
  const timeZone =
    typeof timeZoneInput === "string"
      ? getBusinessTimezone({ timezone: timeZoneInput })
      : resolveAppointmentEmailTimezone(timeZoneInput);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** 11:10 AM–11:40 AM ET */
export function formatAppointmentEmailTimeRange(
  startIso: string | Date,
  endIso: string | Date | null | undefined,
  timeZoneInput?: AppointmentEmailTimezoneInput | string | null,
): string {
  const start = parseInstant(startIso);
  if (!start) return "";
  const timeZone =
    typeof timeZoneInput === "string"
      ? getBusinessTimezone({ timezone: timeZoneInput })
      : resolveAppointmentEmailTimezone(timeZoneInput);
  const startClock = formatAppointmentEmailClock(start, timeZone);
  const end = endIso ? parseInstant(endIso) : null;
  const abbrev = appointmentTimezoneAbbreviation(start, timeZone);
  const range = end
    ? `${startClock}–${formatAppointmentEmailClock(end, timeZone)}`
    : startClock;
  return abbrev ? `${range} ${abbrev}` : range;
}

/**
 * Single-line “when” used in subjects/text:
 * Tuesday, August 4, 2026 at 11:10 AM ET
 */
export function formatAppointmentEmailWhen(
  startIso: string | Date,
  timeZoneInput?: AppointmentEmailTimezoneInput | string | null,
  endIso?: string | Date | null,
): string {
  const start = parseInstant(startIso);
  if (!start) return "";
  const timeZone =
    typeof timeZoneInput === "string"
      ? getBusinessTimezone({ timezone: timeZoneInput })
      : resolveAppointmentEmailTimezone(timeZoneInput);
  const dateLine = formatAppointmentEmailDate(start, timeZone);
  if (endIso) {
    return `${dateLine} · ${formatAppointmentEmailTimeRange(start, endIso, timeZone)}`;
  }
  const clock = formatAppointmentEmailClock(start, timeZone);
  const abbrev = appointmentTimezoneAbbreviation(start, timeZone);
  return abbrev
    ? `${dateLine} at ${clock} ${abbrev}`
    : `${dateLine} at ${clock}`;
}

/** Compact subject fragment: Aug 4 */
export function formatAppointmentEmailMonthDay(
  iso: string | Date,
  timeZoneInput?: AppointmentEmailTimezoneInput | string | null,
): string {
  const date = parseInstant(iso);
  if (!date) return "";
  const timeZone =
    typeof timeZoneInput === "string"
      ? getBusinessTimezone({ timezone: timeZoneInput })
      : resolveAppointmentEmailTimezone(timeZoneInput);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
  }).format(date);
}
