"use server";

import { addMinutes, parseISO } from "date-fns";
import { getBusinessBySlug } from "@/lib/actions/business";
import { getPublicBusinessHours } from "@/lib/actions/business-hours";
import { getPublicAppointments } from "@/lib/actions/appointments";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { generateTimeSlots } from "@/lib/calendar/utils";

export async function getAvailableSlots(
  slug: string,
  serviceId: string,
  staffId: string,
  date: string,
) {
  const business = await getBusinessBySlug(slug);
  if (!business) return [];

  const supabase = await createClient();

  const [{ data: service }, hours, appointments] = await Promise.all([
    supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", serviceId)
      .single(),
    getPublicBusinessHours(business.id),
    getPublicAppointments(
      business.id,
      `${date}T00:00:00.000Z`,
      `${date}T23:59:59.999Z`,
    ),
  ]);

  if (!service) return [];

  const dayDate = parseISO(date);
  return generateTimeSlots(
    dayDate,
    hours,
    service.duration_minutes,
    appointments,
    staffId,
  ).map((slot) => slot.toISOString());
}

export async function bookAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = formData.get("slug") as string;
  const serviceId = formData.get("service_id") as string;
  const staffId = formData.get("staff_id") as string;
  const startTime = formData.get("start_time") as string;
  const customerName = (formData.get("customer_name") as string)?.trim();
  const customerEmail = (formData.get("customer_email") as string)?.trim();
  const customerPhone = (formData.get("customer_phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!slug || !serviceId || !staffId || !startTime || !customerName || !customerEmail) {
    return { error: "Please fill in all required fields." };
  }

  const business = await getBusinessBySlug(slug);
  if (!business) return { error: "Business not found." };

  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes, name")
    .eq("id", serviceId)
    .eq("business_id", business.id)
    .eq("is_active", true)
    .single();

  if (!service) return { error: "Service not available." };

  const start = parseISO(startTime);
  const end = addMinutes(start, service.duration_minutes);

  const { data: customerId, error: customerError } = await supabase.rpc(
    "upsert_booking_customer",
    {
      p_business_id: business.id,
      p_name: customerName,
      p_email: customerEmail,
      p_phone: customerPhone,
    },
  );

  if (customerError || !customerId) {
    return { error: customerError?.message ?? "Failed to save customer details." };
  }

  const { error: appointmentError } = await supabase.rpc(
    "create_public_appointment",
    {
      p_business_id: business.id,
      p_service_id: serviceId,
      p_staff_id: staffId,
      p_customer_id: customerId,
      p_start_time: start.toISOString(),
      p_end_time: end.toISOString(),
      p_notes: notes,
    },
  );

  if (appointmentError) {
    const message = appointmentError.message.includes("Time slot")
      ? "This time slot is no longer available."
      : appointmentError.message;
    return { error: message };
  }

  return {
    success: `Your ${service.name} appointment is confirmed for ${start.toLocaleString()}.`,
  };
}
