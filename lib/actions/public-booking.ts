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

  let customerId: string;

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("business_id", business.id)
    .eq("email", customerEmail)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
    await supabase
      .from("customers")
      .update({ name: customerName, phone: customerPhone })
      .eq("id", customerId);
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        business_id: business.id,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      })
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      return { error: customerError?.message ?? "Failed to create customer." };
    }
    customerId = newCustomer.id;
  }

  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("business_id", business.id)
    .eq("staff_id", staffId)
    .neq("status", "cancelled")
    .lt("start_time", end.toISOString())
    .gt("end_time", start.toISOString());

  if (conflicts && conflicts.length > 0) {
    return { error: "This time slot is no longer available." };
  }

  const { error } = await supabase.from("appointments").insert({
    business_id: business.id,
    service_id: serviceId,
    staff_id: staffId,
    customer_id: customerId,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    status: "confirmed",
    notes,
  });

  if (error) return { error: error.message };

  return {
    success: `Your ${service.name} appointment is confirmed for ${start.toLocaleString()}.`,
  };
}
