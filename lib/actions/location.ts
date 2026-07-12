"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  ALL_LOCATIONS,
  LOCATION_SCOPE_COOKIE,
  parseLocationScope,
  type LocationScope,
} from "@/lib/location/constants";
import { readLocationScopeCookie } from "@/lib/location/scope";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  Location,
  LocationHours,
  LocationSettings,
  LocationWithSettings,
  SubscriptionPlan,
} from "@/lib/types/booking";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function getLocations(): Promise<Location[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDefaultLocation(): Promise<Location | null> {
  const locations = await getLocations();
  return locations.find((l) => l.is_default) ?? locations[0] ?? null;
}

export async function getLocationScope(): Promise<LocationScope> {
  const defaultLocation = await getDefaultLocation();
  if (!defaultLocation) {
    throw new Error("No locations configured for this business.");
  }
  const cookieValue = await readLocationScopeCookie();
  return parseLocationScope(cookieValue, defaultLocation.id);
}

/** Active location for mutations — falls back to default when scope is ALL. */
export async function getActiveLocationId(): Promise<string> {
  const scope = await getLocationScope();
  if (scope.mode === "single") return scope.locationId;
  const defaultLocation = await getDefaultLocation();
  if (!defaultLocation) throw new Error("No default location.");
  return defaultLocation.id;
}

export async function setLocationScope(
  locationId: string | typeof ALL_LOCATIONS,
): Promise<void> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  if (locationId !== ALL_LOCATIONS) {
    const { data } = await supabase
      .from("locations")
      .select("id")
      .eq("id", locationId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (!data) throw new Error("Location not found.");
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCATION_SCOPE_COOKIE, locationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard", "layout");
}

export async function getLocationQuota(): Promise<{
  plan: SubscriptionPlan | null;
  currentCount: number;
  canAdd: boolean;
}> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const [locations, planRes, canAddRes] = await Promise.all([
    getLocations(),
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("plan_key", business.subscription_plan_key ?? "starter")
      .maybeSingle(),
    supabase.rpc("can_add_location", { p_business_id: business.id }),
  ]);

  return {
    plan: planRes.data,
    currentCount: locations.length,
    canAdd: canAddRes.data === true,
  };
}

export async function createLocation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Location name is required." };

  const { data: canAdd } = await supabase.rpc("can_add_location", {
    p_business_id: business.id,
  });
  if (!canAdd) {
    return {
      error:
        "Your plan does not allow more locations. Upgrade your subscription to add another location.",
    };
  }

  const slugInput = (formData.get("slug") as string)?.trim();
  const slug = slugInput ? slugify(slugInput) : slugify(name);
  const timezone =
    (formData.get("timezone") as string) || business.timezone;
  const addressLine1 = (formData.get("address_line1") as string) || null;
  const city = (formData.get("city") as string) || null;
  const state = (formData.get("state") as string) || null;
  const postalCode = (formData.get("postal_code") as string) || null;
  const phone = (formData.get("phone") as string) || null;

  const { data: location, error } = await supabase
    .from("locations")
    .insert({
      business_id: business.id,
      name,
      slug,
      timezone,
      is_default: false,
      is_active: true,
      address_line1: addressLine1,
      city,
      state,
      postal_code: postalCode,
      phone,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A location with this slug already exists." };
    }
    return { error: error.message };
  }

  await supabase.from("location_settings").insert({
    location_id: location.id,
    appointment_interval_minutes: business.appointment_interval_minutes ?? 30,
    booking_limit_days: business.booking_limit_days ?? 60,
    max_daily_bookings: business.max_daily_bookings,
    cancellation_policy: business.cancellation_policy,
  });

  await supabase.from("location_hours").insert(
    Array.from({ length: 7 }, (_, day) => ({
      location_id: location.id,
      day_of_week: day,
      is_open: day >= 1 && day <= 5,
      open_time: "09:00",
      close_time: "17:00",
    })),
  );

  await setLocationScope(location.id);
  revalidatePath("/dashboard", "layout");
  return { success: `Location "${name}" created.` };
}

export async function updateLocation(
  locationId: string,
  updates: { name?: string; slug?: string; phone?: string | null },
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const payload: Record<string, string | null> = {};
  if (updates.name?.trim()) payload.name = updates.name.trim();
  if (updates.slug?.trim()) payload.slug = slugify(updates.slug.trim());
  if (updates.phone !== undefined) payload.phone = updates.phone;

  if (Object.keys(payload).length === 0) {
    return { error: "No updates provided." };
  }

  const { error } = await supabase
    .from("locations")
    .update(payload)
    .eq("id", locationId)
    .eq("business_id", business.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "A location with this slug already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Location updated." };
}

export async function renameLocation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locationId = formData.get("location_id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!locationId || !name) return { error: "Location and name are required." };
  return updateLocation(locationId, { name });
}

export async function getLocationWithSettings(
  locationId?: string,
): Promise<LocationWithSettings | null> {
  const id = locationId ?? (await getActiveLocationId());
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .select(
      `
      *,
      location_settings (*),
      location_hours (*)
    `,
    )
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const settings = Array.isArray(data.location_settings)
    ? data.location_settings[0]
    : data.location_settings;
  const hours = (data.location_hours ?? []) as LocationHours[];

  return {
    ...(data as Location),
    settings: settings as LocationSettings,
    hours: hours.sort((a, b) => a.day_of_week - b.day_of_week),
  };
}

export async function getLocationHours(
  locationId?: string,
): Promise<LocationHours[]> {
  const loc = await getLocationWithSettings(locationId);
  return loc?.hours ?? [];
}

export async function updateLocationHours(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locationId = await getActiveLocationId();
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!location) return { error: "Location not found." };

  for (let day = 0; day < 7; day++) {
    const isOpen = formData.get(`day_${day}_open`) === "on";
    const openTime = (formData.get(`day_${day}_open_time`) as string) || "09:00";
    const closeTime =
      (formData.get(`day_${day}_close_time`) as string) || "17:00";

    const { error } = await supabase
      .from("location_hours")
      .update({
        is_open: isOpen,
        open_time: openTime,
        close_time: closeTime,
      })
      .eq("location_id", locationId)
      .eq("day_of_week", day);

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: "Location hours updated." };
}

export async function updateLocationSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locationId = await getActiveLocationId();
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!location) return { error: "Location not found." };

  const appointmentInterval = Number(formData.get("appointment_interval_minutes"));
  const bookingLimitDays = Number(formData.get("booking_limit_days"));
  const maxDailyBookings = formData.get("max_daily_bookings")
    ? Number(formData.get("max_daily_bookings"))
    : null;
  const cancellationPolicy =
    (formData.get("cancellation_policy") as string) || null;

  const { error } = await supabase
    .from("location_settings")
    .update({
      appointment_interval_minutes: appointmentInterval || 30,
      booking_limit_days: bookingLimitDays || 60,
      max_daily_bookings: maxDailyBookings,
      cancellation_policy: cancellationPolicy,
    })
    .eq("location_id", locationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: "Booking settings updated." };
}

export async function getPublicLocations(businessId: string): Promise<Location[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_locations", {
    p_business_id: businessId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as Location[];
}

export async function getPublicLocationBySlug(
  businessId: string,
  locationSlug: string,
): Promise<Location | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_location_by_slug", {
    p_business_id: businessId,
    p_location_slug: locationSlug,
  });

  if (error) throw new Error(error.message);
  return (data as Location | null) ?? null;
}
