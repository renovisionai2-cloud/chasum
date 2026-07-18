import { addMinutes, parseISO } from "date-fns";
import {
  composeAvailabilityContext,
  resolveRequestedStatus,
} from "@/lib/booking-engine/availability/compose";
import { enrichSlotCandidates } from "@/lib/booking-engine/availability/enrich";
import { applyPolicyChecks } from "@/lib/booking-engine/availability/query-policy";
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

export { applyPolicyChecks } from "@/lib/booking-engine/availability/query-policy";

/**
 * Availability Engine entry — single source of truth for slot previews.
 * SQL RPC generates starts; TypeScript composes policy, scores, and warnings.
 */
export async function previewAvailableSlots(
  input: PreviewSlotsInput,
): Promise<PreviewSlotsResult> {
  const composed = await composeAvailabilityContext(input);
  if (!composed.ok) {
    return {
      slots: [],
      context: emptyContext(input),
      conflicts: composed.conflicts,
      emptyReason: composed.conflicts[0],
    };
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
    const conflict = mapRpcErrorToConflict(error.message);
    return {
      slots: [],
      context: composed.context,
      conflicts: [conflict],
      emptyReason: conflict,
    };
  }

  const starts = (data ?? []) as string[];
  const slots = await enrichSlotCandidates({
    starts,
    preview: input,
    context: composed.context,
  });

  let emptyReason = undefined;
  if (slots.length === 0) {
    if (starts.length > 0) {
      emptyReason = conflictFromCode(
        "MIN_NOTICE",
        "Openings exist but none meet booking notice or window rules.",
        { severity: "warning" },
      );
    } else {
      emptyReason = conflictFromCode(
        "STAFF_BUSY",
        "No available slots for this employee on the selected date.",
        { severity: "warning", recoverable: true },
      );
    }
  }

  return {
    slots,
    context: composed.context,
    emptyReason,
  };
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
    timezone: null,
    intervalMinutes: 30,
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
