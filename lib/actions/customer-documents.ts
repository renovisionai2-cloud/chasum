"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { uploadBusinessAsset } from "@/lib/actions/uploads";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, CustomerDocument } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getCustomerDocuments(
  customerId: string,
): Promise<CustomerDocument[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_documents")
    .select("*")
    .eq("business_id", business.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addCustomerDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const customerId = formData.get("customer_id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!customerId || !name) {
    return { error: "Document name is required." };
  }

  const upload = await uploadBusinessAsset(formData);
  if (upload.error || !upload.url) {
    return { error: upload.error ?? "Upload failed." };
  }

  const supabase = await createClient();
  const file = formData.get("file") as File;

  const { error } = await supabase.from("customer_documents").insert({
    business_id: business.id,
    customer_id: customerId,
    name,
    file_url: upload.url,
    file_type: file?.type ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/clients/${customerId}`);
  return { success: "Document uploaded." };
}

export async function deleteCustomerDocument(
  id: string,
  customerId: string,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("customer_documents")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id)
    .eq("customer_id", customerId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/clients/${customerId}`);
  return { success: "Document removed." };
}
