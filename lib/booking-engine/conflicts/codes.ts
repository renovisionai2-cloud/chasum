import type {
  BookingConflictCode,
  BookingConflictReport,
} from "@/lib/booking-engine/types";

/**
 * Map RPC / PostgREST error text into structured conflict codes.
 * SQL remains authoritative; this only classifies for UI + Summer.
 */
export function mapRpcErrorToConflict(
  message: string,
  details?: Record<string, unknown>,
): BookingConflictReport {
  const m = message.toLowerCase();

  const match = (
    code: BookingConflictCode,
    recoverable: boolean,
    friendly: string,
  ): BookingConflictReport => ({
    code,
    message: friendly,
    severity: "error",
    recoverable,
    details: { ...details, raw: message },
  });

  if (m.includes("vacation") || m.includes("time off")) {
    return match("VACATION", true, "Employee is on vacation or time off.");
  }
  if (m.includes("lunch") || m.includes("break")) {
    return match("LUNCH_BLOCK", true, "Conflicts with a lunch or break.");
  }
  if (m.includes("blacked out") || m.includes("blackout")) {
    return match("SERVICE_BLACKOUT", true, "Service is blacked out for this time.");
  }
  if (
    m.includes("business is closed") ||
    m.includes("closure") ||
    m.includes("closed for")
  ) {
    return match("CLOSURE", true, "This location is closed at that time.");
  }
  if (
    m.includes("not assigned") ||
    m.includes("not qualified") ||
    m.includes("does not offer") ||
    m.includes("cannot perform")
  ) {
    return match(
      "NOT_QUALIFIED",
      true,
      "This employee is not qualified for the selected service.",
    );
  }
  if (m.includes("employee is unavailable")) {
    return match(
      "OUTSIDE_HOURS",
      true,
      "This time is outside the available working hours.",
    );
  }
  if (m.includes("working hours") || m.includes("not working")) {
    return match(
      "OUTSIDE_HOURS",
      true,
      "This time is outside the available working hours.",
    );
  }
  if (m.includes("holiday") || m.includes("closed on this date")) {
    return match(
      "OUTSIDE_HOURS",
      true,
      "This time is outside the available working hours.",
    );
  }
  if (m.includes("overlaps an existing") || m.includes("double")) {
    return match("STAFF_BUSY", true, "This employee is already booked at that time.");
  }
  if (m.includes("external calendar")) {
    return match("STAFF_BUSY", true, "Conflicts with an external calendar event.");
  }
  if (m.includes("notice") || m.includes("too soon") || m.includes("minimum")) {
    return match(
      "MIN_NOTICE",
      true,
      "This appointment is too soon to book under the current booking rules.",
    );
  }
  if (m.includes("ahead") || m.includes("too far") || m.includes("window")) {
    return match(
      "MAX_AHEAD",
      true,
      "This time is outside the maximum booking window.",
    );
  }
  if (m.includes("daily") || m.includes("max appointment") || m.includes("limit")) {
    return match(
      "DAILY_CAP",
      true,
      "The daily appointment limit has been reached.",
    );
  }
  if (m.includes("overlap") || m.includes("exclusion") || m.includes("conflict")) {
    return match("STAFF_BUSY", true, "This employee is already booked at that time.");
  }
  if (m.includes("room") || m.includes("resource")) {
    // Soft/legacy room messages only — true resource engine is FUTURE.
    return match("RESOURCE_BUSY", true, "Required resource is not available.");
  }
  if (
    m.includes("online booking") ||
    m.includes("channel") ||
    m.includes("not available for online")
  ) {
    return match(
      "CHANNEL_FORBIDDEN",
      false,
      "This channel is not allowed to create that booking.",
    );
  }
  if (
    m.includes("permission") ||
    m.includes("not authorized") ||
    m.includes("rls") ||
    m.includes("policy")
  ) {
    return match("NOT_AUTHORIZED", false, "Not authorized to book this slot.");
  }
  if (m.includes("not available") || m.includes("time slot")) {
    return match("STAFF_BUSY", true, "This employee is already booked at that time.");
  }

  return match(
    "UNMAPPED",
    true,
    message.includes("Time slot")
      ? "This time slot is not available."
      : message || "Booking could not be validated.",
  );
}

export function conflictFromCode(
  code: BookingConflictCode,
  message: string,
  options?: Partial<BookingConflictReport>,
): BookingConflictReport {
  return {
    code,
    message,
    severity: options?.severity ?? "error",
    recoverable: options?.recoverable ?? true,
    appointmentId: options?.appointmentId,
    resourceId: options?.resourceId,
    details: options?.details,
  };
}
