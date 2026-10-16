"use server";
import { unknownMoney } from "@/lib/commerce/financial-aggregate/types";


import { getOrCreateBusiness } from "@/lib/actions/business";
import { getCommunicationService } from "@/lib/communication/service";
import {
  collectExactPhoneMatches,
  contactIdentityKey,
  DUPLICATE_LOOKUP_FAILED,
  readEmailField,
  readPhoneField,
  readSeparatePersonChoice,
  resolveEmailUpdate,
  separatePersonChoiceMatches,
  SHARED_PHONE_WARNING,
  validateCreateContact,
  type PhoneCandidateRow,
} from "@/lib/customers/contact-identity";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export type CustomerMatch = PhoneCandidateRow;

/** Shared-phone warning carried back to a form-driven creation surface. */
export type CustomerCreateState = ActionState & {
  /** Existing same-phone people. Create only after an explicit choice. */
  phoneMatches?: CustomerMatch[];
  /** Exact contact identity this warning answers. */
  warnedContactKey?: string;
};

type CustomerQueryClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Business-scoped exact-digits phone scan. Paging, match rules and
 * fail-closed behaviour all live in collectExactPhoneMatches.
 */
async function scanBusinessPhoneMatches(
  supabase: CustomerQueryClient,
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
        data: (page.data ?? null) as CustomerMatch[] | null,
        error: page.error ? { message: page.error.message } : null,
      };
    },
  });
}

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
  _prev: CustomerCreateState,
  formData: FormData,
): Promise<CustomerCreateState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const emailField = readEmailField(formData);
  if (emailField.kind === "invalid") return { error: emailField.error };
  const phone = readPhoneField(formData);
  const address = (formData.get("address") as string)?.trim() || null;
  const notes = (formData.get("notes") as string) || null;
  const referralSource =
    (formData.get("referral_source") as string)?.trim() || null;

  if (!name) return { error: "Customer name is required." };
  const contact = validateCreateContact({
    email: emailField.kind === "set" ? emailField.email : null,
    phone: phone.kind === "set" ? phone.phone : null,
  });
  if (!contact.ok) return { error: contact.error };

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

  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase.from("customers").insert({
    business_id: business.id,
    name,
    email: contact.email,
    phone: contact.phone,
    address,
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
  return { success: "Client added." };
}

/** Inline create from appointment modal — returns new customer id. */
export async function quickCreateCustomer(input: {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  /** When true, report matches without inserting. */
  checkDuplicatesOnly?: boolean;
  /**
   * Operator explicitly chose "Create a separate person" after a shared-phone
   * warning. Email collisions still block. Never merges.
   */
  createSeparatePerson?: boolean;
  /**
   * Contact identity the warning was shown for. The choice is only honoured
   * for that exact email/phone pair, so an edited contact is checked again.
   */
  acknowledgedContactKey?: string;
}): Promise<
  ActionState & {
    customerId?: string;
    email?: string | null;
    phone?: string | null;
    /** Hard email collision. Do not create. */
    emailMatches?: CustomerMatch[];
    /** Shared-phone warning. Create only after an explicit choice. */
    phoneMatches?: CustomerMatch[];
    /** Exact contact identity this warning answers. */
    warnedContactKey?: string;
  }
> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = input.name.trim();
  if (!name) return { error: "Customer name is required." };
  const contact = validateCreateContact({
    email: input.email,
    phone: input.phone,
  });
  if (!contact.ok) return { error: contact.error };

  if (contact.email) {
    const emailQuery = await supabase
      .from("customers")
      .select("id, name, email, phone")
      .eq("business_id", business.id)
      .ilike("email", contact.email)
      .limit(5);
    if (emailQuery.error) return { error: DUPLICATE_LOOKUP_FAILED };
    const emailMatches = (emailQuery.data ?? []) as CustomerMatch[];
    if (emailMatches.length > 0) {
      return {
        error: "A customer with this email already exists.",
        emailMatches,
      };
    }
  }

  if (contact.phone) {
    const phoneScan = await scanBusinessPhoneMatches(
      supabase,
      business.id,
      contact.phone,
    );
    if (!phoneScan.ok) return { error: phoneScan.error };
    const separatePerson = separatePersonChoiceMatches({
      requested: Boolean(input.createSeparatePerson),
      acknowledgedKey: input.acknowledgedContactKey,
      email: contact.email,
      phone: contact.phone,
    });
    if (phoneScan.matches.length > 0 && !separatePerson) {
      return {
        phoneMatches: phoneScan.matches,
        warnedContactKey: contactIdentityKey(contact),
        error: SHARED_PHONE_WARNING,
      };
    }
  }

  if (input.checkDuplicatesOnly) {
    return { success: "No duplicates found." };
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: business.id,
      name,
      email: contact.email,
      phone: contact.phone,
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
  return {
    success: "Client added.",
    customerId: data.id,
    email: contact.email,
    phone: contact.phone,
  };
}

export async function updateCustomer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Customer name is required." };

  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const emailField = readEmailField(formData);
  const phoneField = readPhoneField(formData);
  const { data: existing, error: existingError } = await supabase
    .from("customers")
    .select("email, phone")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (!existing) return { error: "Customer not found." };

  const nextPhone =
    phoneField.kind === "set" ? phoneField.phone : existing.phone;
  const emailUpdate = resolveEmailUpdate({
    field: emailField,
    existingEmail: existing.email,
    nextPhone,
    consentOnly: false,
  });
  if ("error" in emailUpdate) return { error: emailUpdate.error };

  const patch: Record<string, unknown> = {
    name,
    address: (formData.get("address") as string)?.trim() || null,
    notes: (formData.get("notes") as string) || null,
    referral_source:
      (formData.get("referral_source") as string)?.trim() || null,
    tags,
  };
  if (!emailUpdate.omit) patch.email = emailUpdate.email;
  if (phoneField.kind === "set") patch.phone = phoneField.phone;

  const { error } = await supabase
    .from("customers")
    .update(patch)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  revalidatePath("/dashboard/calendar");
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
      `*, service:services(name, color, price), staff:staff(name), location:locations(name, address_line1, address_line2, city, state, postal_code)`,
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

  const communications = await getCommunicationService().listForCustomer(
    business.id,
    id,
  );

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

  const lifetimeRevenue = unknownMoney("LIFETIME_HISTORY_UNVERIFIED");

  const totalVisits = completed.length;
  const lastVisit = history[0]?.start_time ?? null;

  return {
    customer,
    documents: documents ?? [],
    communications,
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
