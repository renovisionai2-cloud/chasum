import { addMinutes, parseISO } from "date-fns";
import {
  composeAvailabilityContext,
  resolveRequestedStatus,
} from "@/lib/booking-engine/availability/compose";
import { enrichSlotCandidates } from "@/lib/booking-engine/availability/enrich";
import { applyPolicyChecks } from "@/lib/booking-engine/availability/query-policy";
import { conflictFromCode } from "@/lib/booking-engine/conflicts/codes";
import { mapRpcErrorToConflict } from "@/lib/booking-engine/conflicts/codes";
import {
  DEFAULT_BOOKING_INTERVAL_MINUTES,
  resolveBookingIntervalMinutes,
} from "@/lib/booking/interval";
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
 * Service columns for unassigned validateBooking.
 * Must use services.min_booking_notice_minutes — never businesses.min_notice_minutes.
 */
export const UNASSIGNED_SERVICE_SELECT =
  "id, duration_minutes, cleanup_minutes, buffer_before_minutes, buffer_after_minutes, is_active, confirmation_mode, min_booking_notice_minutes, max_booking_days_ahead, max_appointments_per_day, location_id";

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
  // Unassigned: validate service + times without employee-specific RPC.
  if (!intent.staffId) {
    return validateUnassignedBooking(intent);
  }

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

/**
 * Validate an unassigned (staff_id null) booking without employee-specific RPC.
 * Service eligibility is separate from named-employee assignment — never treat
 * a missing staff_id as an inactive / unavailable service.
 *
 * IMPORTANT: services use `min_booking_notice_minutes` (not businesses'
 * `min_notice_minutes`). Selecting the wrong column makes PostgREST fail and
 * previously surfaced a false "Service is not available." conflict.
 */
async function validateUnassignedBooking(
  intent: BookingIntent,
): Promise<ValidateBookingResult> {
  const supabase = await createClient();
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select(UNASSIGNED_SERVICE_SELECT)
    .eq("id", intent.serviceId)
    .eq("business_id", intent.businessId)
    .maybeSingle();

  if (serviceError) {
    return {
      ok: false,
      conflicts: [
        conflictFromCode(
          "UNKNOWN",
          "Could not verify this service. Please try again.",
          { recoverable: true },
        ),
      ],
    };
  }

  if (!service) {
    return {
      ok: false,
      conflicts: [
        conflictFromCode("SERVICE_INACTIVE", "Service is not available."),
      ],
    };
  }

  if (service.is_active === false) {
    return {
      ok: false,
      conflicts: [
        conflictFromCode("SERVICE_INACTIVE", "Service is inactive."),
      ],
    };
  }

  // Location eligibility: prefer service_locations; fall back to primary location_id.
  if (intent.locationId) {
    const { data: serviceLocations, error: locLinkError } = await supabase
      .from("service_locations")
      .select("location_id")
      .eq("service_id", intent.serviceId);

    if (!locLinkError && serviceLocations && serviceLocations.length > 0) {
      const offered = serviceLocations.some(
        (row) => row.location_id === intent.locationId,
      );
      if (!offered) {
        return {
          ok: false,
          conflicts: [
            conflictFromCode(
              "NOT_AUTHORIZED",
              "This service is not offered at the selected location.",
              { recoverable: true },
            ),
          ],
        };
      }
    } else if (
      service.location_id &&
      service.location_id !== intent.locationId
    ) {
      return {
        ok: false,
        conflicts: [
          conflictFromCode(
            "NOT_AUTHORIZED",
            "This service is not offered at the selected location.",
            { recoverable: true },
          ),
        ],
      };
    }
  }

  // At least one active employee must be assigned to the service.
  const { data: linkedStaff, error: linkError } = await supabase
    .from("staff_services")
    .select("staff_id, staff!inner(id, is_active)")
    .eq("service_id", intent.serviceId);

  if (linkError) {
    return {
      ok: false,
      conflicts: [
        conflictFromCode(
          "UNKNOWN",
          "Could not verify eligible employees for this service.",
          { recoverable: true },
        ),
      ],
    };
  }

  const hasActiveAssignee = (linkedStaff ?? []).some((row) => {
    const st = row.staff as unknown as { id: string; is_active: boolean } | null;
    return Boolean(st?.is_active);
  });

  if (!hasActiveAssignee) {
    return {
      ok: false,
      conflicts: [
        conflictFromCode(
          "NOT_AUTHORIZED",
          "Assign at least one active employee to this service before booking unassigned.",
          { recoverable: true },
        ),
      ],
    };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("timezone, allow_double_booking, min_notice_minutes, appointment_interval_minutes")
    .eq("id", intent.businessId)
    .maybeSingle();

  const { data: location } = await supabase
    .from("locations")
    .select("timezone")
    .eq("id", intent.locationId)
    .maybeSingle();

  const { data: locationSettings } = await supabase
    .from("location_settings")
    .select("appointment_interval_minutes")
    .eq("location_id", intent.locationId)
    .maybeSingle();

  const intervalMinutes = resolveBookingIntervalMinutes({
    locationInterval: locationSettings?.appointment_interval_minutes,
    businessInterval: business?.appointment_interval_minutes,
  });

  const duration =
    intent.durationMinutes && intent.durationMinutes > 0
      ? intent.durationMinutes
      : Number(service.duration_minutes ?? 30);
  const start = parseISO(intent.requestedStart);
  const end = intent.requestedEnd
    ? parseISO(intent.requestedEnd)
    : addMinutes(start, duration);

  if (!(end.getTime() > start.getTime())) {
    return {
      ok: false,
      conflicts: [
        conflictFromCode(
          "INVALID_RANGE",
          "End time must be after start time.",
        ),
      ],
    };
  }

  // Soft location capacity: block exact overlaps on unassigned + same location
  // unless the business allows double booking.
  // Note: with migration 034 unapplied there are no null staff rows yet — this
  // is forward-compatible once nullable staff_id is enabled.
  if (!business?.allow_double_booking) {
    let overlapQuery = supabase
      .from("appointments")
      .select("id")
      .eq("business_id", intent.businessId)
      .eq("location_id", intent.locationId)
      .is("staff_id", null)
      .neq("status", "cancelled")
      .lt("start_time", end.toISOString())
      .gt("end_time", start.toISOString())
      .limit(1);
    if (intent.excludeAppointmentId) {
      overlapQuery = overlapQuery.neq("id", intent.excludeAppointmentId);
    }
    const { data: overlaps } = await overlapQuery;
    if (overlaps && overlaps.length > 0) {
      return {
        ok: false,
        conflicts: [
          conflictFromCode(
            "STAFF_BUSY",
            "Another unassigned appointment already covers this time at this location.",
            { recoverable: true },
          ),
        ],
      };
    }
  }

  const serviceMinNotice =
    service.min_booking_notice_minutes != null
      ? Number(service.min_booking_notice_minutes)
      : null;
  const businessMinNotice =
    business?.min_notice_minutes != null
      ? Number(business.min_notice_minutes)
      : null;
  const minNoticeCandidates = [serviceMinNotice, businessMinNotice].filter(
    (n): n is number => n != null && Number.isFinite(n),
  );

  const context: AvailabilityContext = {
    businessId: intent.businessId,
    locationId: intent.locationId,
    serviceId: intent.serviceId,
    staffId: null,
    channel: intent.channel,
    timezone:
      (location?.timezone as string | null | undefined) ??
      (business?.timezone as string | null | undefined) ??
      null,
    intervalMinutes,
    durationMinutes: duration,
    cleanupMinutes: Number(service.cleanup_minutes ?? 0),
    bufferBeforeMinutes: Number(service.buffer_before_minutes ?? 0),
    bufferAfterMinutes: Number(service.buffer_after_minutes ?? 0),
    minNoticeMinutes:
      minNoticeCandidates.length > 0 ? Math.max(...minNoticeCandidates) : null,
    maxBookingDaysAhead:
      service.max_booking_days_ahead != null
        ? Number(service.max_booking_days_ahead)
        : null,
    maxAppointmentsPerDay:
      service.max_appointments_per_day != null
        ? Number(service.max_appointments_per_day)
        : null,
    allowDoubleBooking: Boolean(business?.allow_double_booking),
    acceptOnlineBookings: true,
    bookingVisibility: null,
    confirmationMode:
      (service.confirmation_mode as AvailabilityContext["confirmationMode"]) ??
      null,
    priorityScheduling: 0,
    serviceActive: true,
    staffActive: true,
    composedAt: new Date().toISOString(),
  };

  const policyConflicts = applyPolicyChecks(context, start.toISOString());
  if (policyConflicts.length > 0) {
    return { ok: false, conflicts: policyConflicts, context };
  }

  return { ok: true, context, endTime: end.toISOString() };
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
    intervalMinutes: DEFAULT_BOOKING_INTERVAL_MINUTES,
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
