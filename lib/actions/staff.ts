"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getStaff() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select("*, staff_services(service_id)")
    .eq("business_id", business.id)
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function createStaff(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const title = (formData.get("title") as string) || null;
  const color = (formData.get("color") as string) || "#3b82f6";
  const serviceIds = formData.getAll("service_ids") as string[];

  if (!name?.trim()) return { error: "Staff name is required." };

  const { data: staffMember, error } = await supabase
    .from("staff")
    .insert({
      business_id: business.id,
      name: name.trim(),
      email,
      title,
      color,
    })
    .select("id")
    .single();

  if (error || !staffMember) return { error: error?.message ?? "Failed to create staff." };

  if (serviceIds.length > 0) {
    await supabase.from("staff_services").insert(
      serviceIds.map((serviceId) => ({
        staff_id: staffMember.id,
        service_id: serviceId,
      })),
    );
  }

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/calendar");
  return { success: "Staff member added." };
}

export async function updateStaff(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const serviceIds = formData.getAll("service_ids") as string[];

  const { error } = await supabase
    .from("staff")
    .update({
      name: (formData.get("name") as string).trim(),
      email: (formData.get("email") as string) || null,
      title: (formData.get("title") as string) || null,
      color: (formData.get("color") as string) || "#3b82f6",
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  await supabase.from("staff_services").delete().eq("staff_id", id);

  if (serviceIds.length > 0) {
    await supabase.from("staff_services").insert(
      serviceIds.map((serviceId) => ({
        staff_id: id,
        service_id: serviceId,
      })),
    );
  }

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/calendar");
  return { success: "Staff member updated." };
}

export async function deleteStaff(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: "Staff member removed." };
}

export async function getPublicStaff(businessId: string, serviceId?: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select("*, staff_services(service_id)")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);

  if (!serviceId) return data;

  return data.filter((member) =>
    member.staff_services.some(
      (ss: { service_id: string }) => ss.service_id === serviceId,
    ),
  );
}
