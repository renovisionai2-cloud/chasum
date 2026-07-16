"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import { scheduleRecurringJob } from "@/lib/integrations/automation/recurring";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types/booking";

export async function getNotifications(limit = 50) {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

export async function getUnreadNotificationCount() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .is("read_at", null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notifications");
  return { success: "Marked as read." };
}

export async function markAllNotificationsRead(): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("business_id", business.id)
    .is("read_at", null);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notifications");
  return { success: "All notifications marked as read." };
}

export async function getWaitlistEntries() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("waitlists")
    .select("*, customer:customers(id, name, email, phone), service:services(id, name), staff:staff(id, name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addToWaitlist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const serviceId = formData.get("service_id") as string;
  const customerId = formData.get("customer_id") as string;
  const preferredDate = formData.get("preferred_date") as string;
  const staffId = (formData.get("staff_id") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!serviceId || !customerId || !preferredDate) {
    return { error: "Service, client, and date are required." };
  }

  const { error } = await supabase.from("waitlists").insert({
    business_id: business.id,
    service_id: serviceId,
    customer_id: customerId,
    staff_id: staffId,
    preferred_date: preferredDate,
    preferred_time_start: (formData.get("preferred_time_start") as string) || null,
    preferred_time_end: (formData.get("preferred_time_end") as string) || null,
    notes,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/waitlist");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/automation");
  return { success: "Added to waitlist." };
}

export async function removeFromWaitlist(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("waitlists")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/waitlist");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/automation");
  return { success: "Removed from waitlist." };
}

export async function getRecurringRules() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recurring_rules")
    .select("*, service:services(name), staff:staff(name), customer:customers(name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createRecurringRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recurring_rules")
    .insert({
      business_id: business.id,
      service_id: formData.get("service_id") as string,
      staff_id: formData.get("staff_id") as string,
      customer_id: formData.get("customer_id") as string,
      frequency: formData.get("frequency") as string,
      interval_count: Number(formData.get("interval_count") ?? 1),
      day_of_week: formData.get("day_of_week")
        ? Number(formData.get("day_of_week"))
        : null,
      start_date: formData.get("start_date") as string,
      end_date: (formData.get("end_date") as string) || null,
      max_occurrences: formData.get("max_occurrences")
        ? Number(formData.get("max_occurrences"))
        : null,
      start_time: formData.get("start_time") as string,
      notes: (formData.get("notes") as string) || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create rule." };

  await scheduleRecurringJob(data.id, business.id);

  revalidatePath("/dashboard/automation");
  return { success: "Recurring rule created." };
}

export async function toggleRecurringRule(
  id: string,
  active: boolean,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("recurring_rules")
    .update({ active })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/automation");
  return { success: active ? "Rule activated." : "Rule paused." };
}

export async function getNotificationLogs(limit = 50) {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notification_logs")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}
