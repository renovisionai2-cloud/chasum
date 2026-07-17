import { addMinutes, parseISO } from "date-fns";
import {
  composeAvailabilityContext,
  resolveRequestedStatus,
} from "@/lib/booking-engine/availability/compose";
import { conflictFromCode } from "@/lib/booking-engine/conflicts/codes";
import { mapRpcErrorToConflict } from "@/lib/booking-engine/conflicts/codes";
import type {
  AvailabilityContext,
  BookingIntent,
  PreviewSlotsInput,
  PreviewSlotsResult,
  ValidateBookingResult,
} from "@/lib/booking-engine/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Policy helpers composed from AvailabilityContext.
 * Full enforcement of lunch/blackouts/closures lands in enriched RPCs (Phase 5.1).
 * Here we apply notice / window checks that do not require inventing slots.
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

export async function previewAvailableSlots(
  input: PreviewSlotsInput,
): Promise<PreviewSlotsResult> {
  const composed = await composeAvailabilityContext(input);
  if (!composed.ok) {
    return { slots: [], context: emptyContext(input), conflicts: composed.conflicts };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_business_id: input.businessId,
    p_service_id: input.serviceId,
    p_staff_id: input.staffId,
    p_date: input.date,
    p_exclude_appointment_id: input.excludeAppointmentId ?? null,
    p_location_id: input.locationId,
  });

  if (error) {
    return {
      slots: [],
      context: composed.context,
      conflicts: [mapRpcErrorToConflict(error.message)],
    };
  }

  const slots = ((data ?? []) as string[]).map((start) => ({
    start,
    end: addMinutes(
      parseISO(start),
      composed.context.durationMinutes,
    ).toISOString(),
    staffId: input.staffId,
    locationId: input.locationId,
    serviceId: input.serviceId,
  }));

  return { slots, context: composed.context };
}

export async function validateBooking(
  intent: BookingIntent,
): Promise<ValidateBookingResult> {
  const composed = await composeAvailabilityContext({
    businessId: intent.businessId,
    locationId: intent.locationId,
    serviceId: intent.serviceId,
    staffId: intent.staffId,
    channel: intent.channel,
  });

  if (!composed.ok) {
    return { ok: false, conflicts: composed.conflicts };
  }

  const duration =
    intent.durationMinutes && intent.durationMinutes > 0
      ? intent.durationMinutes
      : composed.context.durationMinutes;
  const start = parseISO(intent.requestedStart);
  const end = intent.requestedEnd
    ? parseISO(intent.requestedEnd)
    : addMinutes(start, duration);

  const policyConflicts = applyPolicyChecks(
    composed.context,
    start.toISOString(),
  );
  if (policyConflicts.length > 0) {
    return {
      ok: false,
      conflicts: policyConflicts,
      context: composed.context,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("validate_appointment_slot", {
    p_business_id: intent.businessId,
    p_service_id: intent.serviceId,
    p_staff_id: intent.staffId,
    p_start_time: start.toISOString(),
    p_end_time: end.toISOString(),
    p_exclude_appointment_id: intent.excludeAppointmentId ?? null,
    p_location_id: intent.locationId,
  });

  if (error) {
    return {
      ok: false,
      conflicts: [mapRpcErrorToConflict(error.message)],
      context: composed.context,
    };
  }

  return {
    ok: true,
    context: { ...composed.context, durationMinutes: duration },
    endTime: end.toISOString(),
  };
}

export { resolveRequestedStatus };

function emptyContext(input: PreviewSlotsInput): AvailabilityContext {
  return {
    businessId: input.businessId,
    locationId: input.locationId,
    serviceId: input.serviceId,
    staffId: input.staffId,
    channel: input.channel,
    durationMinutes: 0,
    cleanupMinutes: 0,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    minNoticeMinutes: null,
    maxBookingDaysAhead: null,
    maxAppointmentsPerDay: null,
    allowDoubleBooking: false,
    acceptOnlineBookings: true,
    bookingVisibility: null,
    confirmationMode: null,
    priorityScheduling: 0,
    serviceActive: false,
    staffActive: false,
    composedAt: new Date().toISOString(),
  };
}
