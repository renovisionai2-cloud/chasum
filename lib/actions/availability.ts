"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  getActiveLocationId,
  getLocationScope,
} from "@/lib/actions/location";
import { withLocationFilter } from "@/lib/location/constants";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getAvailabilityBlocks() {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const supabase = await createClient();

  let query = supabase
    .from("availability")
    .select("*, staff:staff(id, name)")
    .eq("business_id", business.id)
    .eq("is_available", false)
    .gte("end_time", new Date().toISOString())
    .order("start_time");

  query = withLocationFilter(query, scope);

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

export async function createAvailabilityBlock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();

  const staffId = (formData.get("staff_id") as string) || null;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!startTime || !endTime) {
    return { error: "Start and end times are required." };
  }

  if (new Date(endTime) <= new Date(startTime)) {
    return { error: "End time must be after start time." };
  }

  if (staffId) {
    const { data: staffMember } = await supabase
      .from("staff")
      .select("id")
      .eq("id", staffId)
      .eq("business_id", business.id)
      .eq("location_id", locationId)
      .single();

    if (!staffMember) {
      return { error: "Staff member not found." };
    }
  }

  const { error } = await supabase.from("availability").insert({
    business_id: business.id,
    location_id: locationId,
    staff_id: staffId,
    start_time: startTime,
    end_time: endTime,
    is_available: false,
    notes,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
  return { success: "Time block added." };
}

export async function deleteAvailabilityBlock(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
  return { success: "Time block removed." };
}
