"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  collectExactPhoneMatches,
  contactIdentityKey,
  readEmailField,
  readPhoneField,
  readSeparatePersonChoice,
  resolveEmailUpdate,
  SHARED_PHONE_WARNING,
  validateCreateContact,
  type PhoneCandidateRow,
} from "@/lib/customers/contact-identity";
import { runCrmAiQuery } from "@/lib/crm/ai";
import {
  CUSTOMER_CONSENT_UNAVAILABLE,
  CUSTOMER_PROFILE_CONFLICT,
  consentTimestampForUpdate,
  parseConsentWriteIntent,
  parseCustomerPayload,
  parseExpectedCustomerVersion,
  stripMissingCustomerWriteColumns,
} from "@/lib/crm/customer-payload";
import { loadCrmProfile, touchCustomerActivity } from "@/lib/crm/service";
import { displayCustomerName } from "@/lib/crm/display";
import type { CrmProfile } from "@/lib/crm/types";
import { isMissingSchemaError } from "@/lib/supabase/errors";
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

/** Shared-phone warning carried back to the CRM creation form. */
export type CrmCustomerCreateState = ActionState & {
  /** Existing same-phone people. Create only after an explicit choice. */
  phoneMatches?: PhoneCandidateRow[];
  /** Exact contact identity this warning answers. */
  warnedContactKey?: string;
};

type CrmQueryClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Business-scoped exact-digits phone scan. Paging, match rules and
 * fail-closed behaviour all live in collectExactPhoneMatches.
 */
async function scanBusinessPhoneMatches(
  supabase: CrmQueryClient,
  businessId: string,
  phone: string,
) {
  return collectExactPhoneMatches({
    digits: phone,
    fetchPage: async (from, pageSize) => {
      const page = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .eq("business_id", businessId)
        .not("phone", "is", null)
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      return {
        data: (page.data ?? null) as PhoneCandidateRow[] | null,
        error: page.error ? { message: page.error.message } : null,
      };
    },
  });
}

export async function createCrmCustomer(
  _prev: CrmCustomerCreateState,
  formData: FormData,
): Promise<CrmCustomerCreateState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const emailField = readEmailField(formData);
  if (emailField.kind === "invalid") return { error: emailField.error };
  const payload = parseCustomerPayload(formData);

  if (!payload.name) return { error: "Customer name is required." };
  const contact = validateCreateContact({
    email: typeof payload.email === "string" ? payload.email : null,
    phone: typeof payload.phone === "string" ? payload.phone : null,
  });
  if (!contact.ok) return { error: contact.error };
  payload.email = contact.email;
  payload.phone = contact.phone;

  // Same Business-scoped shared-phone contract as the quick-create surfaces:
  // warn before the insert, never auto-select and never merge.
  if (contact.phone) {
    const phoneScan = await scanBusinessPhoneMatches(
      supabase,
      business.id,
      contact.phone,
    );
    if (!phoneScan.ok) return { error: phoneScan.error };
    if (
      phoneScan.matches.length > 0 &&
      !readSeparatePersonChoice(formData, contact)
    ) {
      return {
        error: SHARED_PHONE_WARNING,
        phoneMatches: phoneScan.matches,
        warnedContactKey: contactIdentityKey(contact),
      };
    }
  }

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
    if (isMissingSchemaError(error.message)) {
      const legacyPayload = stripMissingCustomerWriteColumns(
        payload,
        error.message,
      );
      const stripped = Object.keys(legacyPayload).length !== Object.keys(payload).length;
      if (stripped) {
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
          return { success: "Client added." };
        }
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

  const consentIntent = parseConsentWriteIntent(formData);
  if (consentIntent.kind === "invalid") return { error: consentIntent.error };

  const expectedVersion = parseExpectedCustomerVersion(formData);
  if (!expectedVersion.ok) return { error: expectedVersion.error };

  const consentRequested =
    consentIntent.kind === "grant" || consentIntent.kind === "revoke";

  const emailField = readEmailField(formData);
  const phoneField = readPhoneField(formData);
  const payload = parseCustomerPayload(formData, {
    consentTimestampMode: "defer",
  });
  if (!payload.name) return { error: "Customer name is required." };

  const { data: existing, error: existingError } = await supabase
    .from("customers")
    .select("id, email, phone, marketing_consent, marketing_consent_at")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (existingError) {
    if (consentRequested) {
      return {
        error: isMissingSchemaError(existingError.message)
          ? CUSTOMER_CONSENT_UNAVAILABLE
          : existingError.message,
      };
    }
    if (!isMissingSchemaError(existingError.message)) {
      return { error: existingError.message };
    }
  } else if (!existing) {
    return { error: "Customer not found." };
  } else if (consentRequested) {
    const nextConsent = consentIntent.kind === "grant";
    payload.marketing_consent = nextConsent;
    payload.marketing_consent_at = consentTimestampForUpdate({
      nextConsent,
      existingConsent: Boolean(existing.marketing_consent),
      existingAt: (existing.marketing_consent_at as string | null) ?? null,
    });
  }

  const nextPhone =
    phoneField.kind === "set"
      ? phoneField.phone
      : ((existing?.phone as string | null | undefined) ?? null);
  const emailUpdate = resolveEmailUpdate({
    field: emailField,
    existingEmail: (existing?.email as string | null | undefined) ?? null,
    nextPhone,
    consentOnly: consentRequested,
  });
  if ("error" in emailUpdate) return { error: emailUpdate.error };
  if (emailUpdate.omit) delete payload.email;
  else payload.email = emailUpdate.email;
  if (phoneField.kind === "omit") delete payload.phone;

  const applyUpdate = async (body: Record<string, unknown>) =>
    supabase
      .from("customers")
      .update(body)
      .eq("id", id)
      .eq("business_id", business.id)
      .eq("updated_at", expectedVersion.updatedAt)
      .select("id")
      .maybeSingle();

  const { data, error } = await applyUpdate(payload);

  if (error) {
    if (consentRequested) {
      return {
        error: isMissingSchemaError(error.message)
          ? CUSTOMER_CONSENT_UNAVAILABLE
          : error.message.includes("crm_status") ||
              error.message.includes("first_name")
            ? "Could not save CRM profile. Apply migration 018_crm_department if needed."
            : error.message,
      };
    }
    if (isMissingSchemaError(error.message)) {
      const legacyPayload = stripMissingCustomerWriteColumns(
        payload,
        error.message,
      );
      const droppedConsent =
        (Object.prototype.hasOwnProperty.call(payload, "marketing_consent") &&
          !Object.prototype.hasOwnProperty.call(
            legacyPayload,
            "marketing_consent",
          )) ||
        (Object.prototype.hasOwnProperty.call(payload, "marketing_consent_at") &&
          !Object.prototype.hasOwnProperty.call(
            legacyPayload,
            "marketing_consent_at",
          ));
      if (droppedConsent) {
        return { error: CUSTOMER_CONSENT_UNAVAILABLE };
      }
      const stripped =
        Object.keys(legacyPayload).length !== Object.keys(payload).length;
      if (stripped) {
        const retry = await applyUpdate(legacyPayload);
        if (!retry.error && retry.data) {
          revalidateCrm(id);
          return { success: "Customer profile saved." };
        }
        if (!retry.error && !retry.data) {
          return { error: CUSTOMER_PROFILE_CONFLICT };
        }
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

  if (!data) return { error: CUSTOMER_PROFILE_CONFLICT };

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
): Promise<import("@/lib/actions/commerce").CommerceActionState> {
  // Delegate to Commerce Platform — never bypass the ledger
  const { recordPaymentAction } = await import("@/lib/actions/commerce");
  const result = await recordPaymentAction({}, formData);
  return result;
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
