"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, BusinessSocialLinks } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getBusinessHours() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", business.id)
    .order("day_of_week");

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBusinessHours(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  for (let day = 0; day < 7; day++) {
    const isOpen = formData.get(`day_${day}_open`) === "on";
    const openTime = (formData.get(`day_${day}_open_time`) as string) || "09:00";
    const closeTime =
      (formData.get(`day_${day}_close_time`) as string) || "17:00";

    const { error } = await supabase
      .from("business_hours")
      .update({
        is_open: isOpen,
        open_time: openTime,
        close_time: closeTime,
      })
      .eq("business_id", business.id)
      .eq("day_of_week", day);

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: "Business hours updated." };
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateBusinessProfile(
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
  const timezone = (formData.get("timezone") as string) || business.timezone;

  if (!name) return { error: "Business name is required." };
  if (!slug) return { error: "Booking URL slug is required." };

  const social_links: BusinessSocialLinks = {
    instagram: emptyToNull(formData.get("social_instagram")) ?? undefined,
    facebook: emptyToNull(formData.get("social_facebook")) ?? undefined,
    tiktok: emptyToNull(formData.get("social_tiktok")) ?? undefined,
    youtube: emptyToNull(formData.get("social_youtube")) ?? undefined,
  };

  // Drop empty keys
  for (const key of Object.keys(social_links) as (keyof BusinessSocialLinks)[]) {
    if (!social_links[key]) delete social_links[key];
  }

  const cancellationPolicy = emptyToNull(formData.get("cancellation_policy"));
  const bookingPolicy = emptyToNull(formData.get("booking_policy"));

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      slug,
      timezone,
      logo_url: emptyToNull(formData.get("logo_url")),
      phone: emptyToNull(formData.get("phone")),
      email: emptyToNull(formData.get("email")),
      website: emptyToNull(formData.get("website")),
      address_line1: emptyToNull(formData.get("address_line1")),
      address_line2: emptyToNull(formData.get("address_line2")),
      city: emptyToNull(formData.get("city")),
      state: emptyToNull(formData.get("state")),
      postal_code: emptyToNull(formData.get("postal_code")),
      country: emptyToNull(formData.get("country")) ?? "US",
      booking_policy: bookingPolicy,
      cancellation_policy: cancellationPolicy,
      social_links,
    })
    .eq("id", business.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "This booking URL is already taken." };
    }
    return { error: error.message };
  }

  // Keep default location settings cancellation in sync for scheduling RPCs
  const { data: defaultLoc } = await supabase
    .from("locations")
    .select("id")
    .eq("business_id", business.id)
    .eq("is_default", true)
    .maybeSingle();

  if (defaultLoc) {
    await supabase
      .from("location_settings")
      .update({ cancellation_policy: cancellationPolicy })
      .eq("location_id", defaultLoc.id);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/book/${slug}`);
  return { success: "Business profile updated." };
}

export async function getPublicBusinessHours(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .order("day_of_week");

  if (error) throw new Error(error.message);
  return data;
}
