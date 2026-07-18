import { addMinutes, parseISO } from "date-fns";
import { conflictFromCode } from "@/lib/booking-engine/conflicts/codes";
import type { AvailabilityContext } from "@/lib/booking-engine/types";

/**
 * Policy helpers composed from AvailabilityContext.
 * SQL RPCs remain authoritative for hours/busy; these mirror notice/window
 * for preview filtering and validateBooking pre-checks.
 */
export function applyPolicyChecks(
  context: AvailabilityContext,
  startIso: string,
  now = new Date(),
): ReturnType<typeof conflictFromCode>[] {
  const conflicts: ReturnType<typeof conflictFromCode>[] = [];
  const start = parseISO(startIso);

  if (context.minNoticeMinutes != null && context.minNoticeMinutes > 0) {
    const earliest = addMinutes(now, context.minNoticeMinutes);
    if (start < earliest) {
      conflicts.push(
        conflictFromCode(
          "MIN_NOTICE",
          `Bookings require at least ${context.minNoticeMinutes} minutes notice.`,
        ),
      );
    }
  }

  if (context.maxBookingDaysAhead != null && context.maxBookingDaysAhead > 0) {
    const latest = addMinutes(now, context.maxBookingDaysAhead * 24 * 60);
    if (start > latest) {
      conflicts.push(
        conflictFromCode(
          "MAX_BOOKING_WINDOW",
          `Bookings cannot be more than ${context.maxBookingDaysAhead} days ahead.`,
        ),
      );
    }
  }

  return conflicts;
}
