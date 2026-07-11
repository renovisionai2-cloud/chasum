"use server";

import { addMinutes, parseISO } from "date-fns";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, AppointmentStatus } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getAppointments(start: string, end: string) {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(id, name, color, duration_minutes),
      staff:staff(id, name, color),
      customer:customers(id, name, email, phone)
    `,
    )
    .eq("business_id", business.id)
    .gte("start_time", start)
    .lte("start_time", end)
    .order("start_time");

  if (error) throw new Error(error.message);
  return data;
}

export async function getDashboardStats() {
  const business = await getOrCreateBusiness();
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

  const [todayRes, weekRes, customersRes, upcomingRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .neq("status", "cancelled")
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .neq("status", "cancelled")
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString()),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("appointments")
      .select(
        `*, service:services(name), customer:customers(name)`,
      )
      .eq("business_id", business.id)
      .neq("status", "cancelled")
      .gte("start_time", now.toISOString())
      .order("start_time")
      .limit(5),
  ]);

  const monthCustomersRes = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("created_at", monthStart.toISOString());

  return {
    todayCount: todayRes.count ?? 0,
    weekCount: weekRes.count ?? 0,
    customerCount: customersRes.count ?? 0,
    newCustomersThisMonth: monthCustomersRes.count ?? 0,
    upcoming: upcomingRes.data ?? [],
  };
}

async function checkConflict(
  businessId: string,
  staffId: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
) {
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("id")
    .eq("business_id", businessId)
    .eq("staff_id", staffId)
    .neq("status", "cancelled")
    .lt("start_time", endTime)
    .gt("end_time", startTime);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

export async function createAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const serviceId = formData.get("service_id") as string;
  const staffId = formData.get("staff_id") as string;
  const customerId = formData.get("customer_id") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!serviceId || !staffId || !customerId || !date || !time) {
    return { error: "All required fields must be filled." };
  }

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();

  if (!service) return { error: "Service not found." };

  const startTime = parseISO(`${date}T${time}`);
  const endTime = addMinutes(startTime, service.duration_minutes);

  const conflict = await checkConflict(
    business.id,
    staffId,
    startTime.toISOString(),
    endTime.toISOString(),
  );

  if (conflict) {
    return { error: "This time slot conflicts with an existing appointment." };
  }

  const { error } = await supabase.from("appointments").insert({
    business_id: business.id,
    service_id: serviceId,
    staff_id: staffId,
    customer_id: customerId,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    notes,
    status: "scheduled",
  });

  if (error) return { error: error.message };

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
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const status = formData.get("status") as AppointmentStatus;
  const notes = (formData.get("notes") as string) || null;

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();

  if (!service) return { error: "Service not found." };

  const startTime = parseISO(`${date}T${time}`);
  const endTime = addMinutes(startTime, service.duration_minutes);

  const conflict = await checkConflict(
    business.id,
    staffId,
    startTime.toISOString(),
    endTime.toISOString(),
    id,
  );

  if (conflict && status !== "cancelled") {
    return { error: "This time slot conflicts with an existing appointment." };
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

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { success: "Appointment cancelled." };
}

export async function getPublicAppointments(
  businessId: string,
  start: string,
  end: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("start_time, end_time, staff_id, status")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .gte("start_time", start)
    .lte("start_time", end);

  if (error) throw new Error(error.message);
  return data;
}
