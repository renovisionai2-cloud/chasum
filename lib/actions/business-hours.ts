"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getBusinessHours() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", business.id)
    .order("day_of_week");

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBusinessHours(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  for (let day = 0; day < 7; day++) {
    const isOpen = formData.get(`day_${day}_open`) === "on";
    const openTime = (formData.get(`day_${day}_open_time`) as string) || "09:00";
    const closeTime =
      (formData.get(`day_${day}_close_time`) as string) || "17:00";

    const { error } = await supabase
      .from("business_hours")
      .update({
        is_open: isOpen,
        open_time: openTime,
        close_time: closeTime,
      })
      .eq("business_id", business.id)
      .eq("day_of_week", day);

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: "Business hours updated." };
}

export async function updateBusinessProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const timezone = (formData.get("timezone") as string) || business.timezone;

  if (!name) return { error: "Business name is required." };
  if (!slug) return { error: "Booking URL slug is required." };

  const { error } = await supabase
    .from("businesses")
    .update({ name, slug, timezone })
    .eq("id", business.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "This booking URL is already taken." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: "Business profile updated." };
}

export async function getPublicBusinessHours(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .order("day_of_week");

  if (error) throw new Error(error.message);
  return data;
}
