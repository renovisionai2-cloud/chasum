import { parseISO } from "date-fns";

/**
 * Public booking always writes through the Booking Engine.
 * Named staff keep the selected employee id; any-staff stay unassigned (null).
 * Persistence uses book_public_appointment via an explicit public_rpc strategy.
 * The legacy create_public_appointment RPC is not used on this path.
 */
export function publicBookingStaffIdForEngine(input: {
  anyStaff: boolean;
  selectedStaffId: string;
}): string | null {
  return input.anyStaff ? null : input.selectedStaffId;
}

/**
 * Diagnostic helper for public start_time integrity. No PII.
 * Does not snap, round, or rewrite minutes.
 */
export function inspectPublicBookingStartTime(raw: string): {
  raw: string;
  iso: string;
  utcMinutes: number;
} {
  const start = parseISO(raw);
  if (Number.isNaN(start.getTime())) {
    return { raw, iso: "", utcMinutes: -1 };
  }
  return {
    raw,
    iso: start.toISOString(),
    utcMinutes: start.getUTCMinutes(),
  };
}
