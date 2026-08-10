/**
 * SchedulingPolicy — resolved scheduling rules for Availability Truth (Phase 5.1).
 *
 * This is a composed snapshot of configuration. It is NOT a second slot engine.
 * Slot legality remains in Postgres RPCs (`get_available_slots` / `validate_appointment_slot`).
 *
 * EMPTY TIME ≠ AVAILABLE TIME.
 */

import type {
  AvailabilityContext,
  BookingChannel,
} from "@/lib/booking-engine/types";

/**
 * Resolved scheduling rules used by the BookingFacade for policy-aware
 * orchestration (notice/window mirrors, UI labels, conflict explanations).
 */
export type SchedulingPolicy = {
  channel: BookingChannel;
  timezone: string | null;
  /** Start-time grid — distinct from service duration. */
  bookingIntervalMinutes: number;
  /** Length of the appointment block once started. */
  serviceDurationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  cleanupMinutes: number;
  minimumNoticeMinutes: number | null;
  maximumAdvanceDays: number | null;
  dailyCap: number | null;
  allowDoubleBooking: boolean;
  acceptOnlineBookings: boolean;
  bookingVisibility: AvailabilityContext["bookingVisibility"];
  /** True when service is active in SoT. */
  serviceActive: boolean;
  /** True when employee is active in SoT. */
  staffActive: boolean;
};

/**
 * Documented precedence (must match RPC + compose mirrors):
 *
 * Interval:     location_settings → business → 30
 * Min notice:   max(business, service, location) candidates present
 * Max ahead:    min(business, service, location) candidates present (>0)
 * Daily cap:    min(service, staff, location) candidates present (>0)
 * Buffers:      max(service, staff) for before/after; cleanup = service only
 * Duration:     staff_services.duration_override → service.duration_minutes
 * Timezone:     location → business
 *
 * Ambiguity: when location_settings row exists but max_daily_bookings is null,
 * SQL may not fall back to business max_daily_bookings — documented PARTIAL.
 */
export function resolveSchedulingPolicy(
  context: AvailabilityContext,
): SchedulingPolicy {
  return {
    channel: context.channel,
    timezone: context.timezone,
    bookingIntervalMinutes: context.intervalMinutes,
    serviceDurationMinutes: context.durationMinutes,
    bufferBeforeMinutes: context.bufferBeforeMinutes,
    bufferAfterMinutes: context.bufferAfterMinutes,
    cleanupMinutes: context.cleanupMinutes,
    minimumNoticeMinutes: context.minNoticeMinutes,
    maximumAdvanceDays: context.maxBookingDaysAhead,
    dailyCap: context.maxAppointmentsPerDay,
    allowDoubleBooking: context.allowDoubleBooking,
    acceptOnlineBookings: context.acceptOnlineBookings,
    bookingVisibility: context.bookingVisibility,
    serviceActive: context.serviceActive,
    staffActive: context.staffActive,
  };
}

/** Explicit product rule: start interval ≠ service duration. */
export function distinguishesIntervalFromDuration(
  policy: SchedulingPolicy,
): boolean {
  return policy.bookingIntervalMinutes !== policy.serviceDurationMinutes;
}
