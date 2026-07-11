"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getServices() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function createService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const durationMinutes = Number(formData.get("duration_minutes"));
  const price = Number(formData.get("price"));
  const color = (formData.get("color") as string) || "#2563eb";

  if (!name?.trim()) return { error: "Service name is required." };
  if (!durationMinutes || durationMinutes < 5) {
    return { error: "Duration must be at least 5 minutes." };
  }

  const category = (formData.get("category") as string) || null;
  const bufferBefore = Number(formData.get("buffer_before_minutes")) || 0;
  const bufferAfter = Number(formData.get("buffer_after_minutes")) || 0;

  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name: name.trim(),
    description,
    category,
    duration_minutes: durationMinutes,
    price: price || 0,
    color,
    buffer_before_minutes: bufferBefore,
    buffer_after_minutes: bufferAfter,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/calendar");
  return { success: "Service created." };
}

export async function updateService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("services")
    .update({
      name: (formData.get("name") as string).trim(),
      description: (formData.get("description") as string) || null,
      category: (formData.get("category") as string) || null,
      duration_minutes: Number(formData.get("duration_minutes")),
      price: Number(formData.get("price")) || 0,
      color: (formData.get("color") as string) || "#2563eb",
      buffer_before_minutes: Number(formData.get("buffer_before_minutes")) || 0,
      buffer_after_minutes: Number(formData.get("buffer_after_minutes")) || 0,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/calendar");
  return { success: "Service updated." };
}

export async function deleteService(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  return { success: "Service deleted." };
}

export async function getPublicServices(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}
