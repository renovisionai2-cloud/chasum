"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getHolidays() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("holidays")
    .select("*")
    .eq("business_id", business.id)
    .order("date");

  if (error) throw new Error(error.message);
  return data;
}

export async function createHoliday(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const date = formData.get("date") as string;
  const isRecurring = formData.get("is_recurring") === "on";

  if (!name || !date) return { error: "Name and date are required." };

  const { error } = await supabase.from("holidays").insert({
    business_id: business.id,
    name,
    date,
    is_recurring: isRecurring,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: "Holiday added." };
}

export async function deleteHoliday(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("holidays")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: "Holiday removed." };
}

export async function getPublicHolidays(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("holidays")
    .select("*")
    .eq("business_id", businessId);

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBusinessSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const appointmentInterval = Number(formData.get("appointment_interval_minutes"));
  const bookingLimitDays = Number(formData.get("booking_limit_days"));
  const maxDailyBookings = formData.get("max_daily_bookings")
    ? Number(formData.get("max_daily_bookings"))
    : null;
  const cancellationPolicy =
    (formData.get("cancellation_policy") as string) || null;

  const { error } = await supabase
    .from("businesses")
    .update({
      appointment_interval_minutes: appointmentInterval || 30,
      booking_limit_days: bookingLimitDays || 60,
      max_daily_bookings: maxDailyBookings,
      cancellation_policy: cancellationPolicy,
    })
    .eq("id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: "Booking settings updated." };
}
