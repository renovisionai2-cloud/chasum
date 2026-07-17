"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getHolidays() {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("holidays")
    .select("*")
    .eq("business_id", business.id)
    .or(`location_id.is.null,location_id.eq.${locationId}`)
    .order("date");

  if (error) throw new Error(error.message);
  return data;
}

export async function createHoliday(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const date = formData.get("date") as string;
  const isRecurring = formData.get("is_recurring") === "on";
  const businessWide = formData.get("business_wide") === "on";

  if (!name || !date) return { error: "Name and date are required." };

  const { error } = await supabase.from("holidays").insert({
    business_id: business.id,
    location_id: businessWide ? null : locationId,
    name,
    date,
    is_recurring: isRecurring,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/business");
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
  revalidatePath("/dashboard/business");
  return { success: "Holiday removed." };
}

export async function getPublicHolidays(
  businessId: string,
  locationId?: string,
) {
  const supabase = await createClient();

  let query = supabase.from("holidays").select("*").eq("business_id", businessId);

  if (locationId) {
    query = query.or(`location_id.is.null,location_id.eq.${locationId}`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}
