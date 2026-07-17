"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import type {
  BusinessAutomationRule,
  CustomFormTemplate,
  DiscountCode,
  GiftCard,
  Membership,
  ServiceCategory,
  ServicePackage,
  TaxRate,
} from "@/lib/business/types";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, BusinessSocialLinks } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

function revalidateBusiness() {
  revalidatePath("/dashboard/business");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/calendar");
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cents(raw: FormDataEntryValue | null): number {
  if (raw == null || String(raw).trim() === "") return 0;
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function bpsFromPercent(raw: FormDataEntryValue | null): number {
  if (raw == null || String(raw).trim() === "") return 0;
  const n = Number(String(raw));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

// —— Profile ——

export async function updateBusinessManagementProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  if (!name) return { error: "Business name is required." };
  if (!slug) return { error: "Booking URL slug is required." };

  const social_links: BusinessSocialLinks = {
    instagram: emptyToNull(formData.get("social_instagram")) ?? undefined,
    facebook: emptyToNull(formData.get("social_facebook")) ?? undefined,
    tiktok: emptyToNull(formData.get("social_tiktok")) ?? undefined,
    youtube: emptyToNull(formData.get("social_youtube")) ?? undefined,
    twitter: emptyToNull(formData.get("social_twitter")) ?? undefined,
  };

  const payload = {
    name,
    slug,
    timezone: (formData.get("timezone") as string) || business.timezone,
    description: emptyToNull(formData.get("description")),
    industry: emptyToNull(formData.get("industry")),
    legal_name: emptyToNull(formData.get("legal_name")),
    business_type: emptyToNull(formData.get("business_type")),
    language: (formData.get("language") as string)?.trim() || "en",
    website: emptyToNull(formData.get("website")),
    email: emptyToNull(formData.get("email")),
    phone: emptyToNull(formData.get("phone")),
    tax_number: emptyToNull(formData.get("tax_number")),
    currency: (formData.get("currency") as string)?.trim().toLowerCase() || "usd",
    logo_url: emptyToNull(formData.get("logo_url")),
    cover_url: emptyToNull(formData.get("cover_url")),
    address_line1: emptyToNull(formData.get("address_line1")),
    address_line2: emptyToNull(formData.get("address_line2")),
    city: emptyToNull(formData.get("city")),
    state: emptyToNull(formData.get("state")),
    postal_code: emptyToNull(formData.get("postal_code")),
    country: emptyToNull(formData.get("country")),
    social_links,
  };

  const { error } = await supabase
    .from("businesses")
    .update(payload)
    .eq("id", business.id);

  if (error) {
    if (
      error.message.includes("industry") ||
      error.message.includes("tax_number") ||
      error.message.includes("legal_name") ||
      error.message.includes("language") ||
      error.message.includes("business_type")
    ) {
      // Soft fallback without new columns
      const { error: legacyError } = await supabase
        .from("businesses")
        .update({
          name: payload.name,
          slug: payload.slug,
          timezone: payload.timezone,
          description: payload.description,
          website: payload.website,
          email: payload.email,
          phone: payload.phone,
          logo_url: payload.logo_url,
          cover_url: payload.cover_url,
          address_line1: payload.address_line1,
          address_line2: payload.address_line2,
          city: payload.city,
          state: payload.state,
          postal_code: payload.postal_code,
          country: payload.country,
          social_links: payload.social_links,
        })
        .eq("id", business.id);
      if (legacyError) return { error: legacyError.message };
      revalidateBusiness();
      return {
        success:
          "Profile saved. Apply migration 023_business_management_settings for legal name, language, and related fields.",
      };
    }
    return { error: error.message };
  }

  revalidateBusiness();
  return { success: "Business profile saved." };
}

// —— Categories ——

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order");
  if (error) return [];
  return (data as ServiceCategory[]) ?? [];
}

export async function upsertServiceCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Category name is required." };

  const payload = {
    business_id: business.id,
    name,
    description: emptyToNull(formData.get("description")),
    icon: emptyToNull(formData.get("icon")),
    color: (formData.get("color") as string) || "#64748b",
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") !== "false",
  };

  const { error } = id
    ? await supabase.from("service_categories").update(payload).eq("id", id).eq("business_id", business.id)
    : await supabase.from("service_categories").insert(payload);

  if (error) {
    if (error.code === "23505") return { error: "Category already exists." };
    return {
      error: error.message.includes("service_categories")
        ? "Apply migration 020_business_management to enable categories."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: id ? "Category updated." : "Category created." };
}

export async function deleteServiceCategory(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_categories")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Category deleted." };
}

// —— Resources (rooms / equipment) ——

export async function upsertBookingResource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Resource name is required." };

  const payload = {
    business_id: business.id,
    name,
    resource_type: (formData.get("resource_type") as string) || "room",
    location_id: emptyToNull(formData.get("location_id")),
    capacity: formData.get("capacity")
      ? Number(formData.get("capacity"))
      : null,
    color: (formData.get("color") as string) || "#64748b",
    is_active: formData.get("is_active") !== "false",
  };

  const { error } = id
    ? await supabase.from("booking_resources").update(payload).eq("id", id).eq("business_id", business.id)
    : await supabase.from("booking_resources").insert(payload);

  if (error) {
    return {
      error: error.message.includes("booking_resources")
        ? "Apply migration 019_booking_engine_2 to enable rooms and resources."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: id ? "Resource updated." : "Resource created." };
}

export async function deleteBookingResource(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_resources")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Resource deleted." };
}

// —— Memberships ——

export async function listMemberships(): Promise<Membership[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("business_id", business.id)
    .order("name");
  if (error) return [];
  return (data as Membership[]) ?? [];
}

export async function upsertMembership(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Membership name is required." };

  const isUnlimited = formData.get("is_unlimited") === "on";
  const payload = {
    business_id: business.id,
    name,
    description: emptyToNull(formData.get("description")),
    billing_interval: (formData.get("billing_interval") as string) || "monthly",
    price_cents: cents(formData.get("price")),
    visit_limit: isUnlimited ? null : Number(formData.get("visit_limit") || 0) || null,
    is_unlimited: isUnlimited,
    is_active: formData.get("is_active") !== "false",
  };

  const { error } = id
    ? await supabase.from("memberships").update(payload).eq("id", id).eq("business_id", business.id)
    : await supabase.from("memberships").insert(payload);

  if (error) {
    return {
      error: error.message.includes("memberships")
        ? "Apply migration 020_business_management to enable memberships."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: id ? "Membership updated." : "Membership created." };
}

export async function deleteMembership(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Membership deleted." };
}

// —— Packages ——

export async function listPackages(): Promise<ServicePackage[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_packages")
    .select("*")
    .eq("business_id", business.id)
    .order("name");
  if (error) return [];
  return (data as ServicePackage[]) ?? [];
}

export async function upsertPackage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Package name is required." };

  const serviceIds = formData.getAll("service_ids") as string[];
  const payload = {
    business_id: business.id,
    name,
    description: emptyToNull(formData.get("description")),
    price_cents: cents(formData.get("price")),
    total_visits: Number(formData.get("total_visits") || 1) || 1,
    expires_after_days: formData.get("expires_after_days")
      ? Number(formData.get("expires_after_days"))
      : null,
    transferable: formData.get("transferable") === "on",
    is_active: formData.get("is_active") !== "false",
    service_ids: serviceIds,
  };

  const { error } = id
    ? await supabase.from("service_packages").update(payload).eq("id", id).eq("business_id", business.id)
    : await supabase.from("service_packages").insert(payload);

  if (error) {
    return {
      error: error.message.includes("service_packages")
        ? "Apply migration 020_business_management to enable packages."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: id ? "Package updated." : "Package created." };
}

export async function deletePackage(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_packages")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Package deleted." };
}

// —— Gift cards ——

export async function listGiftCards(): Promise<GiftCard[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as GiftCard[]) ?? [];
}

export async function createGiftCard(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const amount = cents(formData.get("amount"));
  if (amount <= 0) return { error: "Gift card value is required." };

  const code =
    emptyToNull(formData.get("code"))?.toUpperCase() ||
    `GC-${randomBytes(4).toString("hex").toUpperCase()}`;

  const expiresDays = Number(formData.get("expires_after_days") || 0);
  const expires_at =
    expiresDays > 0
      ? new Date(Date.now() + expiresDays * 86400000).toISOString()
      : null;

  const { error } = await supabase.from("gift_cards").insert({
    business_id: business.id,
    code,
    initial_balance_cents: amount,
    balance_cents: amount,
    is_digital: formData.get("is_digital") !== "false",
    expires_at,
    notes: emptyToNull(formData.get("notes")),
    status: "active",
  });

  if (error) {
    if (error.code === "23505") return { error: "Gift card code already exists." };
    return {
      error: error.message.includes("gift_cards")
        ? "Apply migration 020_business_management to enable gift cards."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: `Gift card ${code} created.` };
}

export async function redeemGiftCard(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const amount = cents(formData.get("amount"));
  if (!code || amount <= 0) return { error: "Code and amount are required." };

  const { data: card } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("business_id", business.id)
    .eq("code", code)
    .maybeSingle();

  if (!card) return { error: "Gift card not found." };
  if (card.status !== "active") return { error: "Gift card is not active." };
  if ((card.balance_cents as number) < amount) {
    return { error: "Insufficient gift card balance." };
  }

  const nextBalance = (card.balance_cents as number) - amount;
  const { error } = await supabase
    .from("gift_cards")
    .update({
      balance_cents: nextBalance,
      status: nextBalance === 0 ? "redeemed" : "active",
    })
    .eq("id", card.id);

  if (error) return { error: error.message };
  revalidateBusiness();
  return {
    success: `Redeemed $${(amount / 100).toFixed(2)}. Remaining $${(nextBalance / 100).toFixed(2)}.`,
  };
}

// —— Taxes ——

export async function listTaxRates(): Promise<TaxRate[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tax_rates")
    .select("*")
    .eq("business_id", business.id)
    .order("name");
  if (error) return [];
  return (data as TaxRate[]) ?? [];
}

export async function upsertTaxRate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Tax name is required." };

  const payload = {
    business_id: business.id,
    name,
    rate_bps: bpsFromPercent(formData.get("rate")),
    country: emptyToNull(formData.get("country")),
    region: emptyToNull(formData.get("region")),
    inclusive: formData.get("inclusive") === "on",
    is_default: formData.get("is_default") === "on",
    is_active: formData.get("is_active") !== "false",
  };

  const { error } = id
    ? await supabase.from("tax_rates").update(payload).eq("id", id).eq("business_id", business.id)
    : await supabase.from("tax_rates").insert(payload);

  if (error) {
    return {
      error: error.message.includes("tax_rates")
        ? "Apply migration 020_business_management to enable tax rates."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: id ? "Tax rate updated." : "Tax rate created." };
}

export async function deleteTaxRate(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tax_rates")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Tax rate deleted." };
}

// —— Discounts ——

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as DiscountCode[]) ?? [];
}

export async function upsertDiscountCode(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  if (!code || !name) return { error: "Code and name are required." };

  const discountType = (formData.get("discount_type") as string) || "percentage";
  const payload = {
    business_id: business.id,
    code,
    name,
    discount_type: discountType,
    percent_bps:
      discountType === "percentage" ? bpsFromPercent(formData.get("percent")) : null,
    amount_cents: discountType === "fixed" ? cents(formData.get("amount")) : null,
    automatic: formData.get("automatic") === "on" || discountType === "automatic",
    is_active: formData.get("is_active") !== "false",
  };

  const { error } = id
    ? await supabase.from("discount_codes").update(payload).eq("id", id).eq("business_id", business.id)
    : await supabase.from("discount_codes").insert(payload);

  if (error) {
    if (error.code === "23505") return { error: "Promo code already exists." };
    return {
      error: error.message.includes("discount_codes")
        ? "Apply migration 020_business_management to enable discounts."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: id ? "Discount updated." : "Discount created." };
}

export async function deleteDiscountCode(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("discount_codes")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Discount deleted." };
}

// —— Forms ——

export async function listFormTemplates(): Promise<CustomFormTemplate[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_form_templates")
    .select("*")
    .eq("business_id", business.id)
    .order("name");
  if (error) return [];
  return (data as CustomFormTemplate[]) ?? [];
}

export async function upsertFormTemplate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Form name is required." };

  const payload = {
    business_id: business.id,
    name,
    form_type: (formData.get("form_type") as string) || "intake",
    description: emptyToNull(formData.get("description")),
    requires_signature: formData.get("requires_signature") === "on",
    is_active: formData.get("is_active") !== "false",
    schema: { fields: [], version: 1 },
  };

  const { error } = id
    ? await supabase.from("custom_form_templates").update(payload).eq("id", id).eq("business_id", business.id)
    : await supabase.from("custom_form_templates").insert(payload);

  if (error) {
    return {
      error: error.message.includes("custom_form_templates")
        ? "Apply migration 020_business_management to enable custom forms."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: id ? "Form updated." : "Form template created." };
}

export async function deleteFormTemplate(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_form_templates")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Form template deleted." };
}

// —— Automation rules ——

export async function listAutomationRules(): Promise<BusinessAutomationRule[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_automation_rules")
    .select("*")
    .eq("business_id", business.id)
    .order("rule_type");
  if (error) return [];
  return (data as BusinessAutomationRule[]) ?? [];
}

export async function upsertAutomationRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const name = (formData.get("name") as string)?.trim();
  const ruleType = (formData.get("rule_type") as string)?.trim();
  if (!name || !ruleType) return { error: "Name and rule type are required." };

  const payload = {
    business_id: business.id,
    name,
    rule_type: ruleType,
    enabled: formData.get("enabled") === "on",
    config: {
      notes: emptyToNull(formData.get("notes")),
    },
  };

  const { error } = id
    ? await supabase.from("business_automation_rules").update(payload).eq("id", id).eq("business_id", business.id)
    : await supabase.from("business_automation_rules").insert(payload);

  if (error) {
    return {
      error: error.message.includes("business_automation_rules")
        ? "Apply migration 020_business_management to enable automation rules."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: id ? "Rule updated." : "Automation rule created." };
}

export async function deleteAutomationRule(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("business_automation_rules")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Rule deleted." };
}

// —— Booking / branding / notifications / AI settings ——

function boolFromCheckbox(formData: FormData, key: string): boolean {
  const raw = formData.get(key);
  return raw === "on" || raw === "true" || raw === "1";
}

export async function updateBusinessBookingSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const appointmentInterval =
    Number(formData.get("appointment_interval_minutes")) ||
    business.appointment_interval_minutes ||
    30;
  const bookingLimitDays =
    Number(formData.get("booking_limit_days")) ||
    business.booking_limit_days ||
    60;
  const minNotice = Math.max(0, Number(formData.get("min_notice_minutes")) || 0);
  const cancelWindow = Math.max(
    0,
    Number(formData.get("cancellation_window_hours")) || 24,
  );
  const confirmationMode = (formData.get("booking_confirmation_mode") as string) ||
    "auto";
  if (!["auto", "manual", "request_approval"].includes(confirmationMode)) {
    return { error: "Invalid booking confirmation mode." };
  }

  const onlineEnabled = boolFromCheckbox(formData, "online_booking_enabled");
  const payload = {
    appointment_interval_minutes: appointmentInterval,
    booking_limit_days: bookingLimitDays,
    min_notice_minutes: minNotice,
    cancellation_window_hours: cancelWindow,
    reschedule_policy: emptyToNull(formData.get("reschedule_policy")),
    cancellation_policy: emptyToNull(formData.get("cancellation_policy")),
    allow_double_booking: boolFromCheckbox(formData, "allow_double_booking"),
    waitlist_enabled: boolFromCheckbox(formData, "waitlist_enabled"),
    online_booking_enabled: onlineEnabled,
    booking_confirmation_mode: confirmationMode,
    public_booking_mode: (onlineEnabled
      ? confirmationMode === "request_approval"
        ? "request_approval"
        : "public"
      : "staff_only") as import("@/lib/types/booking").PublicBookingMode,
  };

  const { error } = await supabase
    .from("businesses")
    .update(payload)
    .eq("id", business.id);

  if (error) {
    return {
      error: error.message.includes("min_notice_minutes")
        ? "Apply migration 023_business_management_settings to enable booking policies."
        : error.message,
    };
  }

  // Keep active location settings in sync for the engine
  const { getActiveLocationId } = await import("@/lib/actions/location");
  const locationId = await getActiveLocationId();
  await supabase
    .from("location_settings")
    .update({
      appointment_interval_minutes: appointmentInterval,
      booking_limit_days: bookingLimitDays,
      cancellation_policy: payload.cancellation_policy,
    })
    .eq("location_id", locationId);

  revalidateBusiness();
  return { success: "Booking settings saved." };
}

export async function updateBusinessBrandingSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const brandColor =
    (formData.get("brand_color") as string)?.trim() || "#2563EB";
  const accentColor =
    (formData.get("accent_color") as string)?.trim() || "#7C3AED";

  const booking_page_branding = {
    headline: emptyToNull(formData.get("booking_headline")) ?? "",
    show_logo: boolFromCheckbox(formData, "show_logo"),
    show_cover: boolFromCheckbox(formData, "show_cover"),
    primary_button_label:
      emptyToNull(formData.get("primary_button_label")) ?? "Book now",
  };

  const { error } = await supabase
    .from("businesses")
    .update({
      logo_url: emptyToNull(formData.get("logo_url")),
      favicon_url: emptyToNull(formData.get("favicon_url")),
      cover_url: emptyToNull(formData.get("cover_url")),
      brand_color: brandColor,
      accent_color: accentColor,
      email_signature: emptyToNull(formData.get("email_signature")),
      booking_page_branding,
    })
    .eq("id", business.id);

  if (error) {
    return {
      error: error.message.includes("brand_color")
        ? "Apply migration 023_business_management_settings to enable branding."
        : error.message,
    };
  }

  revalidateBusiness();
  return { success: "Branding saved." };
}

export async function updateBusinessNotificationSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const reminderHours = Math.max(
    1,
    Number(formData.get("reminder_hours_before")) || 24,
  );

  const { error } = await supabase
    .from("businesses")
    .update({
      email_notifications_enabled: boolFromCheckbox(
        formData,
        "email_notifications_enabled",
      ),
      sms_notifications_enabled: boolFromCheckbox(
        formData,
        "sms_notifications_enabled",
      ),
      owner_notifications_enabled: boolFromCheckbox(
        formData,
        "owner_notifications_enabled",
      ),
      staff_notifications_enabled: boolFromCheckbox(
        formData,
        "staff_notifications_enabled",
      ),
      reminder_hours_before: reminderHours,
      notification_email: emptyToNull(formData.get("notification_email")),
    })
    .eq("id", business.id);

  if (error) {
    return {
      error: error.message.includes("owner_notifications")
        ? "Apply migration 023_business_management_settings for owner/staff notification toggles."
        : error.message,
    };
  }

  revalidateBusiness();
  return { success: "Notification settings saved." };
}

export async function updateBusinessAiSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const toneRaw = (formData.get("summer_tone") as string) || "professional";
  const tone =
    toneRaw === "friendly" || toneRaw === "concise" || toneRaw === "warm"
      ? toneRaw
      : "professional";

  const ai_settings = {
    summer: {
      enabled: boolFromCheckbox(formData, "summer_enabled"),
      greeting: emptyToNull(formData.get("summer_greeting")) ?? "",
      tone,
      escalation: emptyToNull(formData.get("summer_escalation")) ?? "",
      business_knowledge:
        emptyToNull(formData.get("summer_business_knowledge")) ?? "",
    },
    chase: {
      enabled: boolFromCheckbox(formData, "chase_enabled"),
      daily_summary: boolFromCheckbox(formData, "chase_daily_summary"),
      weekly_summary: boolFromCheckbox(formData, "chase_weekly_summary"),
      recommendations: boolFromCheckbox(formData, "chase_recommendations"),
      business_analytics: boolFromCheckbox(
        formData,
        "chase_business_analytics",
      ),
    },
  };

  const { error } = await supabase
    .from("businesses")
    .update({ ai_settings })
    .eq("id", business.id);

  if (error) {
    return {
      error: error.message.includes("ai_settings")
        ? "Apply migration 023_business_management_settings to enable AI configuration."
        : error.message,
    };
  }

  revalidateBusiness();
  return { success: "AI settings saved. Summer and Chase will use these when enabled." };
}

// —— Closures ——

export async function listBusinessClosures(): Promise<
  import("@/lib/business/settings").BusinessClosure[]
> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_closures")
    .select("*")
    .eq("business_id", business.id)
    .order("starts_at", { ascending: true });
  if (error) return [];
  return (data as import("@/lib/business/settings").BusinessClosure[]) ?? [];
}

export async function createBusinessClosure(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const name = (formData.get("name") as string)?.trim();
  const closureType = (formData.get("closure_type") as string) || "temporary";
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;
  if (!name || !startsAt || !endsAt) {
    return { error: "Name, start, and end are required." };
  }
  if (!["holiday", "vacation", "temporary", "special_hours"].includes(closureType)) {
    return { error: "Invalid closure type." };
  }

  const businessWide = formData.get("business_wide") === "on";
  const { getActiveLocationId } = await import("@/lib/actions/location");
  const locationId = businessWide ? null : await getActiveLocationId();

  const { error } = await supabase.from("business_closures").insert({
    business_id: business.id,
    location_id: locationId,
    closure_type: closureType,
    name,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    open_time: emptyToNull(formData.get("open_time")),
    close_time: emptyToNull(formData.get("close_time")),
    is_recurring: formData.get("is_recurring") === "on",
    notes: emptyToNull(formData.get("notes")),
  });

  if (error) {
    return {
      error: error.message.includes("business_closures")
        ? "Apply migration 023_business_management_settings to enable closures."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: "Closure saved." };
}

export async function deleteBusinessClosure(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("business_closures")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Closure removed." };
}

// —— Documents ——

export async function listBusinessDocuments(): Promise<
  import("@/lib/business/settings").BusinessDocument[]
> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_documents")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as import("@/lib/business/settings").BusinessDocument[]) ?? [];
}

export async function addBusinessDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const name = (formData.get("name") as string)?.trim();
  const fileUrl = emptyToNull(formData.get("file_url"));
  if (!name || !fileUrl) return { error: "Name and file are required." };

  const { error } = await supabase.from("business_documents").insert({
    business_id: business.id,
    name,
    file_url: fileUrl,
    file_type: emptyToNull(formData.get("file_type")),
  });

  if (error) {
    return {
      error: error.message.includes("business_documents")
        ? "Apply migration 023_business_management_settings to enable documents."
        : error.message,
    };
  }
  revalidateBusiness();
  return { success: "Document added." };
}

export async function deleteBusinessDocument(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("business_documents")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { error: error.message };
  revalidateBusiness();
  return { success: "Document removed." };
}

