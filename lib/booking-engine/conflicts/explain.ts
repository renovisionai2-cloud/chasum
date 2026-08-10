/**
 * Human-readable conflict explanations for Calendar, Reception,
 * Booking Workspace, and Summer.
 *
 * Only explain codes that were actually produced.
 * Never invent a more specific reason than the structured code provides.
 */

import type {
  BookingConflictCode,
  BookingConflictReport,
} from "@/lib/booking-engine/types";

const EXPLANATIONS: Partial<Record<BookingConflictCode, string>> = {
  STAFF_BUSY: "This employee is already booked at that time.",
  RESOURCE_BUSY: "A required resource is not available at that time.",
  OUTSIDE_BUSINESS_HOURS: "This time is outside the available working hours.",
  OUTSIDE_EMPLOYEE_HOURS: "This time is outside the available working hours.",
  OUTSIDE_HOURS: "This time is outside the available working hours.",
  VACATION: "This employee is on vacation or time off.",
  LUNCH_BREAK: "That time conflicts with a lunch or break.",
  LUNCH_BLOCK: "That time conflicts with a lunch or break.",
  SERVICE_BLACKOUT: "This service is blacked out for that time.",
  SERVICE_INACTIVE: "This service is not available for booking.",
  BUSINESS_CLOSURE: "This location is closed at that time.",
  CLOSURE: "This location is closed at that time.",
  MIN_NOTICE:
    "This appointment is too soon to book under the current booking rules.",
  MAX_BOOKING_WINDOW: "This time is outside the maximum booking window.",
  MAX_AHEAD: "This time is outside the maximum booking window.",
  MAX_APPOINTMENTS: "The daily appointment limit has been reached.",
  DAILY_CAP: "The daily appointment limit has been reached.",
  INVALID_RANGE: "The requested time range is not valid.",
  DOUBLE_BOOKING: "This employee is already booked at that time.",
  NOT_AUTHORIZED: "You are not authorized to book this slot.",
  NOT_QUALIFIED: "This employee is not qualified for the selected service.",
  CHANNEL_FORBIDDEN: "This channel is not allowed to create that booking.",
  UNKNOWN: "This time could not be booked.",
  UNMAPPED: "This time could not be booked.",
};

/**
 * Prefer the report’s grounded message when present; otherwise use the
 * canonical explanation for the code. Never upgrades UNKNOWN to a guess.
 */
export function explainConflict(report: BookingConflictReport): string {
  const trimmed = report.message?.trim();
  if (trimmed) return trimmed;
  return (
    EXPLANATIONS[report.code] ??
    "This time could not be booked."
  );
}

export function explainConflicts(
  reports: BookingConflictReport[] | undefined | null,
): string | null {
  if (!reports?.length) return null;
  return explainConflict(reports[0]);
}

export function explanationForCode(code: BookingConflictCode): string {
  return EXPLANATIONS[code] ?? "This time could not be booked.";
}

export function isUnmappedConflict(
  report: Pick<BookingConflictReport, "code">,
): boolean {
  return report.code === "UNKNOWN" || report.code === "UNMAPPED";
}
