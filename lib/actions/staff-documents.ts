"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { logStaffActivity } from "@/lib/employees/service";
import { uploadBusinessAsset } from "@/lib/actions/uploads";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, StaffDocument } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

function revalidate(staffId: string) {
  revalidatePath(`/dashboard/staff/${staffId}`);
  revalidatePath(`/dashboard/employees/${staffId}`);
  revalidatePath("/dashboard/staff");
}

export async function getStaffDocuments(
  staffId: string,
): Promise<StaffDocument[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_documents")
    .select("*")
    .eq("business_id", business.id)
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[staff-documents]", error.message);
    return [];
  }
  return (data as StaffDocument[]) ?? [];
}

export async function addStaffDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const staffId = formData.get("staff_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || "general";

  if (!staffId || !name) {
    return { error: "Document name is required." };
  }

  const upload = await uploadBusinessAsset(formData);
  if (upload.error || !upload.url) {
    return { error: upload.error ?? "Upload failed." };
  }

  const supabase = await createClient();
  const file = formData.get("file") as File;

  const { error } = await supabase.from("staff_documents").insert({
    business_id: business.id,
    staff_id: staffId,
    name,
    category,
    file_url: upload.url,
    file_type: file?.type ?? null,
    expires_on: (formData.get("expires_on") as string)?.trim() || null,
    issued_by: (formData.get("issued_by") as string)?.trim() || null,
  });

  if (error) {
    if (
      error.message.includes("expires_on") ||
      error.message.includes("issued_by") ||
      error.message.includes("license")
    ) {
      const retry = await supabase.from("staff_documents").insert({
        business_id: business.id,
        staff_id: staffId,
        name,
        category: category === "license" ? "certification" : category,
        file_url: upload.url,
        file_type: file?.type ?? null,
      });
      if (retry.error) {
        return {
          error: retry.error.message.includes("staff_documents")
            ? "Could not save document. Apply migration 025_employees_module if needed."
            : retry.error.message,
        };
      }
    } else {
      return {
        error:
          error.message.includes("staff_documents")
            ? "Could not save document. Apply migration 017_employee_management if needed."
            : error.message,
      };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await logStaffActivity({
    businessId: business.id,
    staffId,
    eventType: "document_added",
    title: `Document uploaded: ${name}`,
    createdBy: user?.id ?? null,
  });

  revalidate(staffId);
  return { success: "Document uploaded." };
}

export async function deleteStaffDocument(
  id: string,
  staffId: string,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("staff_documents")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id)
    .eq("staff_id", staffId);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await logStaffActivity({
    businessId: business.id,
    staffId,
    eventType: "document_removed",
    title: "Document removed",
    createdBy: user?.id ?? null,
  });

  revalidate(staffId);
  return { success: "Document removed." };
}
