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

  if (m.includes("not available") || m.includes("time slot")) {
    return match("STAFF_BUSY", true, "This time slot is not available.");
  }
  if (m.includes("vacation") || m.includes("time off")) {
    return match("VACATION", true, "Employee is on vacation or time off.");
  }
  if (m.includes("holiday") || m.includes("closed")) {
    return match(
      "OUTSIDE_BUSINESS_HOURS",
      true,
      "Location is closed for this date.",
    );
  }
  if (m.includes("working hours") || m.includes("not working")) {
    return match(
      "OUTSIDE_EMPLOYEE_HOURS",
      true,
      "Outside employee working hours.",
    );
  }
  if (m.includes("lunch") || m.includes("break")) {
    return match("LUNCH_BREAK", true, "Conflicts with a lunch or break.");
  }
  if (m.includes("blackout")) {
    return match("SERVICE_BLACKOUT", true, "Service is blacked out for this time.");
  }
  if (m.includes("closure") || m.includes("business closed")) {
    return match("BUSINESS_CLOSURE", true, "Business is closed during this time.");
  }
  if (m.includes("notice") || m.includes("too soon") || m.includes("minimum")) {
    return match("MIN_NOTICE", true, "Does not meet minimum booking notice.");
  }
  if (m.includes("ahead") || m.includes("too far") || m.includes("window")) {
    return match(
      "MAX_BOOKING_WINDOW",
      true,
      "Outside the maximum booking window.",
    );
  }
  if (m.includes("daily") || m.includes("max appointment") || m.includes("limit")) {
    return match(
      "MAX_APPOINTMENTS",
      true,
      "Daily appointment limit has been reached.",
    );
  }
  if (m.includes("overlap") || m.includes("exclusion") || m.includes("conflict")) {
    return match("DOUBLE_BOOKING", true, "Conflicts with an existing appointment.");
  }
  if (m.includes("room") || m.includes("resource")) {
    return match("RESOURCE_BUSY", true, "Required resource is not available.");
  }
  if (
    m.includes("permission") ||
    m.includes("not authorized") ||
    m.includes("rls") ||
    m.includes("policy")
  ) {
    return match("NOT_AUTHORIZED", false, "Not authorized to book this slot.");
  }

  return match(
    "UNKNOWN",
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
