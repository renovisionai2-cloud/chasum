"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId, getLocationScope } from "@/lib/actions/location";
import { createClient } from "@/lib/supabase/server";

/** Single RPC entry point for all slot queries — public and dashboard share this. */
export async function fetchAvailableSlots(
  businessId: string,
  serviceId: string,
  staffId: string,
  date: string,
  excludeAppointmentId?: string,
  locationId?: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_available_slots", {
    p_business_id: businessId,
    p_service_id: serviceId,
    p_staff_id: staffId,
    p_date: date,
    p_exclude_appointment_id: excludeAppointmentId ?? null,
    p_location_id: locationId ?? null,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as string[];
}

export async function getDashboardAvailableSlots(
  serviceId: string,
  staffId: string,
  date: string,
  excludeAppointmentId?: string,
  locationId?: string,
): Promise<string[]> {
  const business = await getOrCreateBusiness();
  const resolvedLocationId = locationId || (await getActiveLocationId());
  return fetchAvailableSlots(
    business.id,
    serviceId,
    staffId,
    date,
    excludeAppointmentId,
    resolvedLocationId,
  );
}

export async function getPublicAvailableSlots(
  slug: string,
  serviceId: string,
  staffId: string,
  date: string,
  locationId?: string,
): Promise<string[]> {
  const { getBusinessBySlug } = await import("@/lib/actions/business");
  const business = await getBusinessBySlug(slug);
  if (!business) return [];
  return fetchAvailableSlots(
    business.id,
    serviceId,
    staffId,
    date,
    undefined,
    locationId,
  );
}

export async function validateAppointmentSlot(params: {
  businessId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
  locationId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("validate_appointment_slot", {
    p_business_id: params.businessId,
    p_service_id: params.serviceId,
    p_staff_id: params.staffId,
    p_start_time: params.startTime,
    p_end_time: params.endTime,
    p_exclude_appointment_id: params.excludeAppointmentId ?? null,
    p_location_id: params.locationId ?? null,
  });

  if (error) {
    const message = error.message.includes("Time slot")
      ? "This time slot is not available."
      : error.message;
    return { ok: false, error: message };
  }

  return { ok: true };
}

export async function getDashboardLocationScope() {
  return getLocationScope();
}
