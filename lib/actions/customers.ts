"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getCustomers(search?: string) {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("*")
    .eq("business_id", business.id)
    .order("name");

  if (search?.trim()) {
    query = query.or(
      `name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createCustomer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name) return { error: "Customer name is required." };
  if (!email) return { error: "Email is required." };

  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase.from("customers").insert({
    business_id: business.id,
    name,
    email,
    phone,
    notes,
    tags,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A customer with this email already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/calendar");
  return { success: "Customer added." };
}

export async function updateCustomer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("customers")
    .update({
      name: (formData.get("name") as string).trim(),
      email: (formData.get("email") as string).trim(),
      phone: (formData.get("phone") as string) || null,
      notes: (formData.get("notes") as string) || null,
      tags,
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  return { success: "Customer updated." };
}

export async function deleteCustomer(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  return { success: "Customer deleted." };
}

export async function getCustomerProfile(id: string) {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (error || !customer) return null;

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `*, service:services(name, color), staff:staff(name)`,
    )
    .eq("customer_id", id)
    .order("start_time", { ascending: false });

  return { customer, appointments: appointments ?? [] };
}
