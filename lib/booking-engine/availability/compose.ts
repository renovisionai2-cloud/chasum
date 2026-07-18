import {
  cacheGet,
  cacheKey,
  cacheSet,
} from "@/lib/booking-engine/availability/cache";
import { conflictFromCode } from "@/lib/booking-engine/conflicts/codes";
import type {
  AvailabilityContext,
  BookingChannel,
  BookingConflictReport,
} from "@/lib/booking-engine/types";
import { createClient } from "@/lib/supabase/server";

export type ComposeAvailabilityInput = {
  businessId: string;
  locationId: string;
  serviceId: string;
  staffId: string;
  channel: BookingChannel;
};

type ComposeResult =
  | { ok: true; context: AvailabilityContext }
  | { ok: false; conflicts: BookingConflictReport[] };

/**
 * Compose AvailabilityContext from Business + Services + Employees.
 * Memoized briefly to avoid duplicate reads during multi-staff previews.
 * Does not invent slots — SQL RPCs remain the slot authority.
 */
export async function composeAvailabilityContext(
  input: ComposeAvailabilityInput,
): Promise<ComposeResult> {
  const key = cacheKey([
    "compose",
    input.businessId,
    input.locationId,
    input.serviceId,
    input.staffId,
    input.channel,
  ]);
  const cached = cacheGet<ComposeResult>(key);
  if (cached) return cached;

  const result = await composeAvailabilityContextUncached(input);
  cacheSet(key, result);
  return result;
}

async function composeAvailabilityContextUncached(
  input: ComposeAvailabilityInput,
): Promise<ComposeResult> {
  const supabase = await createClient();

  const [
    businessRes,
    serviceRes,
    staffRes,
    linkRes,
    locationSettingsRes,
    locationRes,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "id, timezone, min_notice_minutes, allow_double_booking, booking_limit_days, booking_confirmation_mode",
      )
      .eq("id", input.businessId)
      .maybeSingle(),
    supabase
      .from("services")
      .select(
        "id, is_active, duration_minutes, cleanup_minutes, buffer_before_minutes, buffer_after_minutes, max_appointments_per_day, min_booking_notice_minutes, max_booking_days_ahead, booking_visibility, confirmation_mode, online_booking, location_id",
      )
      .eq("id", input.serviceId)
      .eq("business_id", input.businessId)
      .maybeSingle(),
    supabase
      .from("staff")
      .select(
        "id, is_active, accept_online_bookings, max_appointments_per_day, buffer_before_minutes, buffer_after_minutes, min_break_minutes, priority_scheduling, location_id",
      )
      .eq("id", input.staffId)
      .eq("business_id", input.businessId)
      .maybeSingle(),
    supabase
      .from("staff_services")
      .select("service_id, duration_override_minutes, price_override")
      .eq("staff_id", input.staffId)
      .eq("service_id", input.serviceId)
      .maybeSingle(),
    supabase
      .from("location_settings")
      .select(
        "booking_limit_days, max_daily_bookings, min_booking_notice_minutes, appointment_interval_minutes",
      )
      .eq("location_id", input.locationId)
      .maybeSingle(),
    supabase
      .from("locations")
      .select("id, timezone")
      .eq("id", input.locationId)
      .eq("business_id", input.businessId)
      .maybeSingle(),
  ]);

  const conflicts: BookingConflictReport[] = [];

  if (!businessRes.data) {
    conflicts.push(
      conflictFromCode("NOT_AUTHORIZED", "Business not found.", {
        recoverable: false,
      }),
    );
  }
  if (!serviceRes.data) {
    conflicts.push(
      conflictFromCode("UNKNOWN", "Service not found.", { recoverable: false }),
    );
  }
  if (!staffRes.data) {
    conflicts.push(
      conflictFromCode("UNKNOWN", "Employee not found.", { recoverable: false }),
    );
  }
  if (conflicts.length > 0) {
    return { ok: false, conflicts };
  }

  const business = businessRes.data as Record<string, unknown>;
  const service = serviceRes.data as Record<string, unknown>;
  const staff = staffRes.data as Record<string, unknown>;
  const link = linkRes.data as Record<string, unknown> | null;
  const locationSettings = locationSettingsRes.data as Record<
    string,
    unknown
  > | null;
  const location = locationRes.data as Record<string, unknown> | null;

  if (!service.is_active) {
    conflicts.push(
      conflictFromCode("UNKNOWN", "Service is inactive.", {
        recoverable: false,
      }),
    );
  }
  if (!staff.is_active) {
    conflicts.push(
      conflictFromCode("UNKNOWN", "Employee is inactive.", {
        recoverable: false,
      }),
    );
  }

  const visibility =
    (service.booking_visibility as AvailabilityContext["bookingVisibility"]) ??
    null;
  const onlineBooking = service.online_booking !== false;
  if (
    (input.channel === "public" || input.channel === "summer") &&
    (visibility === "hidden" ||
      visibility === "internal" ||
      onlineBooking === false)
  ) {
    conflicts.push(
      conflictFromCode(
        "NOT_AUTHORIZED",
        "Service is not available for online booking.",
        { recoverable: false },
      ),
    );
  }

  if (
    (input.channel === "public" || input.channel === "summer") &&
    staff.accept_online_bookings === false
  ) {
    conflicts.push(
      conflictFromCode(
        "NOT_AUTHORIZED",
        "Employee does not accept online bookings.",
        { recoverable: false },
      ),
    );
  }

  if (
    (input.channel === "public" || input.channel === "summer") &&
    linkRes.error == null &&
    !link
  ) {
    const { count } = await supabase
      .from("staff_services")
      .select("service_id", { count: "exact", head: true })
      .eq("service_id", input.serviceId);
    if ((count ?? 0) > 0) {
      conflicts.push(
        conflictFromCode(
          "NOT_AUTHORIZED",
          "Employee is not assigned to this service.",
          { recoverable: true },
        ),
      );
    }
  }

  if (conflicts.length > 0) {
    return { ok: false, conflicts };
  }

  const durationOverride =
    link?.duration_override_minutes != null
      ? Number(link.duration_override_minutes)
      : null;
  const durationMinutes =
    durationOverride && durationOverride > 0
      ? durationOverride
      : Number(service.duration_minutes ?? 30);

  const staffBufferBefore = Number(staff.buffer_before_minutes ?? 0);
  const staffBufferAfter = Number(staff.buffer_after_minutes ?? 0);
  const serviceBufferBefore = Number(service.buffer_before_minutes ?? 0);
  const serviceBufferAfter = Number(service.buffer_after_minutes ?? 0);

  const minNoticeCandidates = [
    business.min_notice_minutes != null
      ? Number(business.min_notice_minutes)
      : null,
    service.min_booking_notice_minutes != null
      ? Number(service.min_booking_notice_minutes)
      : null,
    locationSettings?.min_booking_notice_minutes != null
      ? Number(locationSettings.min_booking_notice_minutes)
      : null,
  ].filter((n): n is number => n != null && Number.isFinite(n));

  const maxAheadCandidates = [
    business.booking_limit_days != null
      ? Number(business.booking_limit_days)
      : null,
    service.max_booking_days_ahead != null
      ? Number(service.max_booking_days_ahead)
      : null,
    locationSettings?.booking_limit_days != null
      ? Number(locationSettings.booking_limit_days)
      : null,
  ].filter((n): n is number => n != null && Number.isFinite(n) && n > 0);

  const maxDayCandidates = [
    service.max_appointments_per_day != null
      ? Number(service.max_appointments_per_day)
      : null,
    staff.max_appointments_per_day != null
      ? Number(staff.max_appointments_per_day)
      : null,
    locationSettings?.max_daily_bookings != null
      ? Number(locationSettings.max_daily_bookings)
      : null,
  ].filter((n): n is number => n != null && Number.isFinite(n) && n > 0);

  const timezone =
    (location?.timezone as string | null | undefined) ??
    (business.timezone as string | null | undefined) ??
    null;

  const context: AvailabilityContext = {
    businessId: input.businessId,
    locationId: input.locationId,
    serviceId: input.serviceId,
    staffId: input.staffId,
    channel: input.channel,
    timezone,
    intervalMinutes: Number(
      locationSettings?.appointment_interval_minutes ?? 30,
    ),
    durationMinutes,
    cleanupMinutes: Number(service.cleanup_minutes ?? 0),
    bufferBeforeMinutes: Math.max(serviceBufferBefore, staffBufferBefore),
    bufferAfterMinutes: Math.max(serviceBufferAfter, staffBufferAfter),
    minNoticeMinutes:
      minNoticeCandidates.length > 0 ? Math.max(...minNoticeCandidates) : null,
    maxBookingDaysAhead:
      maxAheadCandidates.length > 0 ? Math.min(...maxAheadCandidates) : null,
    maxAppointmentsPerDay:
      maxDayCandidates.length > 0 ? Math.min(...maxDayCandidates) : null,
    allowDoubleBooking: Boolean(business.allow_double_booking),
    acceptOnlineBookings: staff.accept_online_bookings !== false,
    bookingVisibility: visibility,
    confirmationMode:
      (service.confirmation_mode as AvailabilityContext["confirmationMode"]) ??
      null,
    priorityScheduling: Number(staff.priority_scheduling ?? 0),
    serviceActive: Boolean(service.is_active),
    staffActive: Boolean(staff.is_active),
    composedAt: new Date().toISOString(),
  };

  return { ok: true, context };
}

export function resolveRequestedStatus(
  context: AvailabilityContext,
  requested?: string | null,
): "pending" | "confirmed" {
  if (requested === "pending" || requested === "confirmed") {
    return requested;
  }
  if (context.confirmationMode === "require_approval") return "pending";
  if (context.confirmationMode === "auto_confirm") return "confirmed";
  if (context.channel === "public" || context.channel === "summer") {
    return "confirmed";
  }
  return "pending";
}
