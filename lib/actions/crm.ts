"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { runCrmAiQuery } from "@/lib/crm/ai";
import { loadCrmProfile, touchCustomerActivity } from "@/lib/crm/service";
import { displayCustomerName } from "@/lib/crm/display";
import type { CrmProfile } from "@/lib/crm/types";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, Customer, Location, Staff } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

function revalidateCrm(customerId?: string) {
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/crm");
  revalidatePath("/dashboard/calendar");
  if (customerId) {
    revalidatePath(`/dashboard/clients/${customerId}`);
    revalidatePath(`/dashboard/crm/${customerId}`);
  }
}

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function composeName(first?: string | null, last?: string | null, fallback?: string | null) {
  const composed = [first, last].filter(Boolean).join(" ").trim();
  return composed || fallback?.trim() || "";
}

function parseCustomerPayload(formData: FormData) {
  const firstName = (formData.get("first_name") as string)?.trim() || null;
  const lastName = (formData.get("last_name") as string)?.trim() || null;
  const preferredName = (formData.get("preferred_name") as string)?.trim() || null;
  const legacyName = (formData.get("name") as string)?.trim() || null;
  const name = composeName(firstName, lastName, legacyName);

  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const isVip = formData.get("is_vip") === "on" || formData.get("is_vip") === "true";
  let crmStatus = (formData.get("crm_status") as string)?.trim() || "active";
  if (isVip && crmStatus === "active") crmStatus = "vip";

  const marketingConsent =
    formData.get("marketing_consent") === "on" ||
    formData.get("marketing_consent") === "true";
  const membershipId = (formData.get("membership_id") as string)?.trim() || null;

  return {
    name,
    first_name: firstName,
    last_name: lastName,
    preferred_name: preferredName,
    email: (formData.get("email") as string)?.trim() || "",
    phone: (formData.get("phone") as string)?.trim() || null,
    address: (formData.get("address") as string)?.trim() || null,
    photo_url: (formData.get("photo_url") as string)?.trim() || null,
    date_of_birth: (formData.get("date_of_birth") as string)?.trim() || null,
    gender: (formData.get("gender") as string)?.trim() || null,
    emergency_contact_name:
      (formData.get("emergency_contact_name") as string)?.trim() || null,
    emergency_contact_phone:
      (formData.get("emergency_contact_phone") as string)?.trim() || null,
    emergency_contact_relationship:
      (formData.get("emergency_contact_relationship") as string)?.trim() || null,
    preferred_communication_method:
      (formData.get("preferred_communication_method") as string)?.trim() || null,
    crm_status: crmStatus,
    assigned_staff_id: (formData.get("assigned_staff_id") as string)?.trim() || null,
    preferred_location_id:
      (formData.get("preferred_location_id") as string)?.trim() || null,
    membership_id: membershipId,
    is_vip: isVip,
    anniversary_date: (formData.get("anniversary_date") as string)?.trim() || null,
    loyalty_status: (formData.get("loyalty_status") as string)?.trim() || "standard",
    marketing_consent: marketingConsent,
    marketing_consent_at: marketingConsent ? new Date().toISOString() : null,
    referral_source: (formData.get("referral_source") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
    tags,
    last_activity_at: new Date().toISOString(),
  };
}

export type CrmDirectoryCustomer = Customer & {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  photo_url?: string | null;
  crm_status?: string;
  assigned_staff_id?: string | null;
  preferred_location_id?: string | null;
  is_vip?: boolean;
  loyalty_status?: string;
  last_activity_at?: string | null;
  date_of_birth?: string | null;
  anniversary_date?: string | null;
  assigned_staff?: Pick<Staff, "id" | "name"> | null;
  preferred_location?: Pick<Location, "id" | "name"> | null;
};

export async function getCrmDirectory(): Promise<CrmDirectoryCustomer[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select(
      `*, assigned_staff:staff!customers_assigned_staff_id_fkey(id, name), preferred_location:locations!customers_preferred_location_id_fkey(id, name)`,
    )
    .eq("business_id", business.id)
    .order("last_activity_at", { ascending: false, nullsFirst: false });

  if (error) {
    const fallback = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", business.id)
      .order("name");
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? []) as CrmDirectoryCustomer[];
  }

  return (data ?? []) as CrmDirectoryCustomer[];
}

export async function loadCrmCustomerProfile(
  customerId: string,
): Promise<CrmProfile | null> {
  const business = await getOrCreateBusiness();
  return loadCrmProfile(business.id, customerId);
}

export async function createCrmCustomer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const payload = parseCustomerPayload(formData);

  if (!payload.name) return { error: "Customer name is required." };
  if (!payload.email && !payload.phone) {
    return {
      error: "Add an email or phone number so you can reach this customer.",
    };
  }
  // Schema requires email (unique per business). Phone-only walk-ins get a stable placeholder.
  if (!payload.email && payload.phone) {
    const digits = payload.phone.replace(/\D/g, "") || "unknown";
    payload.email = `phone.${digits}@chasum.local`;
  }
  if (!payload.email) return { error: "Email is required." };

  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: business.id,
      ...payload,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A customer with this email already exists." };
    }
    if (
      error.message.includes("marketing_consent") ||
      error.message.includes("membership_id")
    ) {
      const {
        marketing_consent: _mc,
        marketing_consent_at: _mca,
        membership_id: _mid,
        ...legacyPayload
      } = payload;
      void _mc;
      void _mca;
      void _mid;
      const retry = await supabase
        .from("customers")
        .insert({
          business_id: business.id,
          ...legacyPayload,
        })
        .select("id")
        .single();
      if (retry.error) {
        if (retry.error.code === "23505") {
          return { error: "A customer with this email already exists." };
        }
      } else {
        revalidateCrm(retry.data.id);
        return {
          success:
            "Client added. Apply migration 027_crm_phase_5_4 for marketing consent & membership.",
        };
      }
    }
    // Pre-migration soft fallback
    if (error.message.includes("crm_status") || error.message.includes("first_name")) {
      const legacy = await supabase.from("customers").insert({
        business_id: business.id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        notes: payload.notes,
        tags: payload.tags,
        referral_source: payload.referral_source,
      });
      if (legacy.error) return { error: legacy.error.message };
      revalidateCrm();
      return { success: "Client added." };
    }
    return { error: error.message };
  }

  revalidateCrm(data.id);
  return { success: "Client added." };
}

export async function updateCrmCustomer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Customer id is required." };

  const payload = parseCustomerPayload(formData);
  if (!payload.name) return { error: "Customer name is required." };
  if (!payload.email) return { error: "Email is required." };

  const { error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    if (
      error.message.includes("marketing_consent") ||
      error.message.includes("membership_id")
    ) {
      const {
        marketing_consent: _mc,
        marketing_consent_at: _mca,
        membership_id: _mid,
        ...legacyPayload
      } = payload;
      void _mc;
      void _mca;
      void _mid;
      const retry = await supabase
        .from("customers")
        .update(legacyPayload)
        .eq("id", id)
        .eq("business_id", business.id);
      if (!retry.error) {
        revalidateCrm(id);
        return {
          success:
            "Customer profile saved. Apply migration 027_crm_phase_5_4 for marketing consent & membership.",
        };
      }
    }
    return {
      error:
        error.message.includes("crm_status") ||
        error.message.includes("first_name")
          ? "Could not save CRM profile. Apply migration 018_crm_department if needed."
          : error.message,
    };
  }

  revalidateCrm(id);
  return { success: "Customer profile saved." };
}

export async function addCrmNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const customerId = String(formData.get("customer_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!customerId || !body) return { error: "Note cannot be empty." };

  const supabase = await createClient();
  const noteTypeRaw = String(formData.get("note_type") ?? "general").trim();
  const noteType =
    noteTypeRaw === "warning" ||
    noteTypeRaw === "medical" ||
    noteTypeRaw === "service"
      ? noteTypeRaw
      : "general";

  const { error } = await supabase.from("customer_notes").insert({
    business_id: business.id,
    customer_id: customerId,
    body,
    note_type: noteType,
    is_pinned: formData.get("is_pinned") === "on",
    is_private: formData.get("is_private") === "on",
    created_by: await currentUserId(),
  });

  if (error) {
    if (error.message.includes("note_type")) {
      const retry = await supabase.from("customer_notes").insert({
        business_id: business.id,
        customer_id: customerId,
        body,
        is_pinned: formData.get("is_pinned") === "on",
        is_private: formData.get("is_private") === "on",
        created_by: await currentUserId(),
      });
      if (!retry.error) {
        await touchCustomerActivity(business.id, customerId);
        revalidateCrm(customerId);
        return { success: "Note saved." };
      }
    }
    return {
      error:
        error.message.includes("customer_notes")
          ? "Could not save note. Apply migration 018_crm_department if needed."
          : error.message,
    };
  }

  await touchCustomerActivity(business.id, customerId);
  revalidateCrm(customerId);
  return { success: "Note saved." };
}

export async function deleteCrmNoteAction(
  noteId: string,
  customerId: string,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_notes")
    .delete()
    .eq("id", noteId)
    .eq("business_id", business.id)
    .eq("customer_id", customerId);

  if (error) return { error: error.message };
  revalidateCrm(customerId);
  return { success: "Note deleted." };
}

export async function recordCrmPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Delegate to Commerce Platform — never bypass the ledger
  const { recordPaymentAction } = await import("@/lib/actions/commerce");
  const result = await recordPaymentAction({}, formData);
  if (result.error) return { error: result.error };
  return { success: result.success ?? "Payment saved." };
}

export async function sparkCrmQueryAction(input: {
  kind:
    | "summarize_customer"
    | "inactive_customers"
    | "top_spenders"
    | "birthday_promotions"
    | "custom";
  customerId?: string;
  prompt?: string;
}) {
  const business = await getOrCreateBusiness();
  return runCrmAiQuery({
    businessId: business.id,
    kind: input.kind,
    customerId: input.customerId,
    prompt: input.prompt,
  });
}

/** Fetch a single appointment with relations for CRM reschedule/cancel. */
export async function getCrmAppointmentForBooking(
  appointmentId: string,
): Promise<import("@/lib/types/booking").AppointmentWithRelations | null> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `*, service:services(id, name, color, duration_minutes, buffer_before_minutes, buffer_after_minutes),
       staff:staff(id, name, color, photo_url),
       customer:customers(id, name, email, phone),
       location:locations(id, name)`,
    )
    .eq("id", appointmentId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as import("@/lib/types/booking").AppointmentWithRelations;
}

export { displayCustomerName };
