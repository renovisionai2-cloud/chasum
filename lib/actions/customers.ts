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
    const q = search.trim();
    query = query.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`,
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
  const referralSource =
    (formData.get("referral_source") as string)?.trim() || null;

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
    referral_source: referralSource,
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

/** Inline create from appointment modal — returns new customer id. */
export async function quickCreateCustomer(input: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}): Promise<ActionState & { customerId?: string }> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { error: "Customer name is required." };
  if (!email) return { error: "Email is required." };

  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: business.id,
      name,
      email,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      tags: [],
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A customer with this email already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/calendar");
  return { success: "Customer added.", customerId: data.id };
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
      referral_source:
        (formData.get("referral_source") as string)?.trim() || null,
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
      `*, service:services(name, color, price), staff:staff(name), location:locations(name)`,
    )
    .eq("customer_id", id)
    .eq("business_id", business.id)
    .order("start_time", { ascending: false });

  const { data: documents } = await supabase
    .from("customer_documents")
    .select("*")
    .eq("customer_id", id)
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const rows = appointments ?? [];
  const now = new Date();

  const upcoming = rows.filter(
    (a) =>
      a.status !== "cancelled" &&
      new Date(a.start_time).getTime() >= now.getTime(),
  );
  const history = rows.filter(
    (a) =>
      a.status !== "cancelled" &&
      new Date(a.start_time).getTime() < now.getTime(),
  );
  const cancellations = rows.filter((a) => a.status === "cancelled");
  const noShows = rows.filter((a) => a.status === "no_show");
  const completed = rows.filter((a) => a.status === "completed");

  const lifetimeRevenue = completed.reduce((sum, a) => {
    const price = (a.service as { price?: number } | null)?.price ?? 0;
    return sum + Number(price);
  }, 0);

  const totalVisits = completed.length;
  const lastVisit = history[0]?.start_time ?? null;

  return {
    customer,
    documents: documents ?? [],
    appointments: rows,
    upcoming,
    history,
    cancellations,
    noShows,
    metrics: {
      totalVisits,
      lifetimeRevenue,
      noShowCount: noShows.length,
      cancellationCount: cancellations.length,
      upcomingCount: upcoming.length,
      lastVisit,
    },
  };
}
