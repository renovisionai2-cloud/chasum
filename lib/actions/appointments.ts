"use server";

import { addMinutes, parseISO } from "date-fns";
import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  getActiveLocationId,
  getLocationScope,
} from "@/lib/actions/location";
import { validateAppointmentSlot } from "@/lib/actions/scheduling";
import { withLocationFilter } from "@/lib/location/constants";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, AppointmentStatus } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";
import { handleAppointmentEvent } from "@/lib/integrations/notifications/orchestrator";
import { enqueueWaitlistNotification } from "@/lib/integrations/automation/waitlist";

function parseAppointmentStart(formData: FormData): Date | null {
  const startTime = formData.get("start_time") as string | null;
  if (startTime) return parseISO(startTime);

  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  if (date && time) return parseISO(`${date}T${time}`);

  return null;
}

export async function getAppointments(start: string, end: string) {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(id, name, color, duration_minutes, buffer_before_minutes, buffer_after_minutes),
      staff:staff(id, name, color, photo_url),
      customer:customers(id, name, email, phone),
      location:locations(id, name)
    `,
    )
    .eq("business_id", business.id)
    .gte("start_time", start)
    .lte("start_time", end)
    .order("start_time");

  query = withLocationFilter(query, scope);

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

export async function getDashboardStats() {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  function appointmentFilter() {
    return scope.mode === "single"
      ? { business_id: business.id, location_id: scope.locationId }
      : { business_id: business.id };
  }

  const apptFilter = appointmentFilter();

  const [todayRes, weekRes, customersRes, upcomingRes, todayApptsRes, newCustomersRes, revenueRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString()),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("appointments")
      .select(`*, service:services(name), customer:customers(name), location:locations(name)`)
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", now.toISOString())
      .order("start_time")
      .limit(5),
    supabase
      .from("appointments")
      .select(`*, service:services(name, color, price), customer:customers(name), staff:staff(name), location:locations(name)`)
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString())
      .order("start_time"),
    supabase
      .from("customers")
      .select("id, name, email, created_at")
      .eq("business_id", business.id)
      .gte("created_at", monthStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select("service:services(price)")
      .match(apptFilter)
      .eq("status", "completed")
      .gte("start_time", monthStart.toISOString())
      .lte("start_time", monthEnd.toISOString()),
  ]);

  const monthCustomersRes = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("created_at", monthStart.toISOString());

  const revenue = (revenueRes.data ?? []).reduce((sum, appt) => {
    const price = (appt.service as { price?: number } | null)?.price ?? 0;
    return sum + Number(price);
  }, 0);

  return {
    todayCount: todayRes.count ?? 0,
    weekCount: weekRes.count ?? 0,
    customerCount: customersRes.count ?? 0,
    newCustomersThisMonth: monthCustomersRes.count ?? 0,
    upcoming: upcomingRes.data ?? [],
    todayAppointments: todayApptsRes.data ?? [],
    newCustomers: newCustomersRes.data ?? [],
    monthlyRevenue: revenue,
  };
}

export async function createAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();

  const serviceId = formData.get("service_id") as string;
  const staffId = formData.get("staff_id") as string;
  const customerId = formData.get("customer_id") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!serviceId || !staffId || !customerId) {
    return { error: "All required fields must be filled." };
  }

  const startTime = parseAppointmentStart(formData);
  if (!startTime) {
    return { error: "Select an available time slot." };
  }

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes, buffer_before_minutes, buffer_after_minutes")
    .eq("id", serviceId)
    .single();

  if (!service) return { error: "Service not found." };

  const endTime = addMinutes(startTime, service.duration_minutes);

  const validation = await validateAppointmentSlot({
    businessId: business.id,
    serviceId,
    staffId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    locationId,
  });

  if (!validation.ok) {
    return { error: validation.error };
  }

  const { data: created, error } = await supabase.from("appointments").insert({
    business_id: business.id,
    location_id: locationId,
    service_id: serviceId,
    staff_id: staffId,
    customer_id: customerId,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    notes,
    status: "pending",
  }).select("id").single();

  if (error) return { error: error.message };

  if (created?.id) {
    await handleAppointmentEvent(created.id, "created");
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { success: "Appointment created." };
}

export async function updateAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const serviceId = formData.get("service_id") as string;
  const staffId = formData.get("staff_id") as string;
  const customerId = formData.get("customer_id") as string;
  const status = formData.get("status") as AppointmentStatus;
  const notes = (formData.get("notes") as string) || null;

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes, buffer_before_minutes, buffer_after_minutes")
    .eq("id", serviceId)
    .single();

  if (!service) return { error: "Service not found." };

  const startTime = parseAppointmentStart(formData);
  if (!startTime) {
    return { error: "Select an available time slot." };
  }

  const endTime = addMinutes(startTime, service.duration_minutes);

  const { data: existing } = await supabase
    .from("appointments")
    .select("location_id")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!existing) return { error: "Appointment not found." };

  if (status !== "cancelled") {
    const validation = await validateAppointmentSlot({
      businessId: business.id,
      serviceId,
      staffId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      excludeAppointmentId: id,
      locationId: existing.location_id,
    });

    if (!validation.ok) {
      return { error: validation.error };
    }
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      service_id: serviceId,
      staff_id: staffId,
      customer_id: customerId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status,
      notes,
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  const event =
    status === "cancelled"
      ? "cancelled"
      : status === "confirmed"
        ? "confirmed"
        : "updated";
  await handleAppointmentEvent(id, event);

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { success: "Appointment updated." };
}

export async function cancelAppointment(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  await handleAppointmentEvent(id, "cancelled");
  await enqueueWaitlistNotification(business.id, id);

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { success: "Appointment cancelled." };
}

export async function rescheduleAppointment(
  id: string,
  newStartTime: string,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*, service:services(duration_minutes, buffer_before_minutes, buffer_after_minutes)")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!appointment) return { error: "Appointment not found." };

  const service = appointment.service as {
    duration_minutes: number;
    buffer_before_minutes: number;
    buffer_after_minutes: number;
  };

  const startTime = parseISO(newStartTime);
  const endTime = addMinutes(startTime, service.duration_minutes);

  const validation = await validateAppointmentSlot({
    businessId: business.id,
    serviceId: appointment.service_id,
    staffId: appointment.staff_id,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    excludeAppointmentId: id,
    locationId: appointment.location_id,
  });

  if (!validation.ok) {
    return { error: validation.error };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await handleAppointmentEvent(id, "rescheduled", {
    previousStartTime: appointment.start_time,
  });

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { success: "Appointment rescheduled." };
}

export async function getPublicAppointments(
  businessId: string,
  start: string,
  end: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_appointments", {
    p_business_id: businessId,
    p_start: start,
    p_end: end,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}
