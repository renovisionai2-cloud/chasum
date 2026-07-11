"use server";

import { getOrCreateBusiness, getBusinessBySlug } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";

/** Single RPC entry point for all slot queries — public and dashboard share this. */
export async function fetchAvailableSlots(
  businessId: string,
  serviceId: string,
  staffId: string,
  date: string,
  excludeAppointmentId?: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_available_slots", {
    p_business_id: businessId,
    p_service_id: serviceId,
    p_staff_id: staffId,
    p_date: date,
    p_exclude_appointment_id: excludeAppointmentId ?? null,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as string[];
}

export async function getDashboardAvailableSlots(
  serviceId: string,
  staffId: string,
  date: string,
  excludeAppointmentId?: string,
): Promise<string[]> {
  const business = await getOrCreateBusiness();
  return fetchAvailableSlots(
    business.id,
    serviceId,
    staffId,
    date,
    excludeAppointmentId,
  );
}

export async function getPublicAvailableSlots(
  slug: string,
  serviceId: string,
  staffId: string,
  date: string,
): Promise<string[]> {
  const business = await getBusinessBySlug(slug);
  if (!business) return [];
  return fetchAvailableSlots(business.id, serviceId, staffId, date);
}

export async function validateAppointmentSlot(params: {
  businessId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("validate_appointment_slot", {
    p_business_id: params.businessId,
    p_service_id: params.serviceId,
    p_staff_id: params.staffId,
    p_start_time: params.startTime,
    p_end_time: params.endTime,
    p_exclude_appointment_id: params.excludeAppointmentId ?? null,
  });

  if (error) {
    const message = error.message.includes("Time slot")
      ? "This time slot is not available."
      : error.message;
    return { ok: false, error: message };
  }

  return { ok: true };
}
