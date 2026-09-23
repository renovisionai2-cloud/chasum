"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  evaluateLocationQuota,
  locationLimitReachedMessage,
  planDisplayName,
} from "@/lib/billing/plan-entitlements";
import {
  normalizeBookingIntervalMinutes,
  resolveBookingIntervalMinutes,
  type BookingIntervalMinutes,
} from "@/lib/booking/interval";
import {
  ALL_LOCATIONS,
  LOCATION_SCOPE_COOKIE,
  parseLocationScope,
  type LocationScope,
} from "@/lib/location/constants";
import { readLocationScopeCookie } from "@/lib/location/scope";
import { locationSlug as slugify } from "@/lib/location/slug";
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
import { cache } from "react";

export const getLocations = cache(async (): Promise<Location[]> => {
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
});

export const getDefaultLocation = cache(async (): Promise<Location | null> => {
  const locations = await getLocations();
  return locations.find((l) => l.is_default) ?? locations[0] ?? null;
});

export const getLocationScope = cache(async (): Promise<LocationScope> => {
  const defaultLocation = await getDefaultLocation();
  if (!defaultLocation) {
    throw new Error("No locations configured for this business.");
  }
  const cookieValue = await readLocationScopeCookie();
  return parseLocationScope(cookieValue, defaultLocation.id);
});

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

export const getLocationQuota = cache(async (): Promise<{
  plan: SubscriptionPlan | null;
  planName: string;
  maxLocations: number | null;
  currentCount: number;
  canAdd: boolean;
}> => {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const [locations, planRes] = await Promise.all([
    getLocations(),
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("plan_key", business.subscription_plan_key ?? "starter")
      .maybeSingle(),
  ]);

  const quota = evaluateLocationQuota(
    locations.length,
    business.subscription_plan_key,
  );
  const plan = planRes.data
    ? ({ ...planRes.data, max_locations: quota.max } as SubscriptionPlan)
    : null;

  return {
    plan,
    planName: plan?.name ?? planDisplayName(quota.planKey),
    maxLocations: quota.max,
    currentCount: locations.length,
    canAdd: quota.canAdd,
  };
});

export type LocationTemplateSource = {
  id: string;
  name: string;
  isDefault: boolean;
  serviceCount: number;
  openDayCount: number;
  hourDayCount: number;
  segmentCount: number;
  weeklyHours: Array<{
    dayOfWeek: number;
    ranges: Array<{ openTime: string; closeTime: string }>;
  }>;
  settings: {
    appointmentIntervalMinutes: number;
    bookingLimitDays: number;
    maxDailyBookings: number | null;
    cancellationPolicy: string | null;
    minBookingNoticeMinutes: number;
    defaultTravelMinutes: number;
    timezone: string | null;
  } | null;
};

export type LocationSetupStaffOption = {
  id: string;
  name: string;
  homeLocationId: string | null;
  locationIds: string[];
};

export type LocationSetupContext = {
  sources: LocationTemplateSource[];
  staff: LocationSetupStaffOption[];
  defaultLocationCount: number;
  businessMinBookingNoticeMinutes: number;
};

export const getLocationSetupContext = cache(
  async (): Promise<LocationSetupContext> => {
    const business = await getOrCreateBusiness();
    const supabase = await createClient();
    const locations = await getLocations();
    const locationIds = locations.map((location) => location.id);

    const businessMinBookingNoticeMinutes = business.min_notice_minutes ?? 0;
    if (locationIds.length === 0) {
      return { sources: [], staff: [], defaultLocationCount: 0, businessMinBookingNoticeMinutes };
    }

    const [settingsRes, hoursRes, segmentsRes, servicesRes, staffRes] =
      await Promise.all([
        supabase
          .from("location_settings")
          .select(
            "location_id, appointment_interval_minutes, booking_limit_days, max_daily_bookings, cancellation_policy, min_booking_notice_minutes, default_travel_minutes, timezone",
          )
          .in("location_id", locationIds),
        supabase
          .from("location_hours")
          .select("location_id, day_of_week, is_open, open_time, close_time")
          .in("location_id", locationIds),
        supabase
          .from("location_hour_segments")
          .select("id, location_id, day_of_week, open_time, close_time, sort_order")
          .in("location_id", locationIds),
        supabase
          .from("services")
          .select("id, location_id, service_locations(location_id)")
          .eq("business_id", business.id)
          .eq("is_active", true),
        supabase
          .from("staff")
          .select("id, name, location_id, staff_locations(location_id)")
          .eq("business_id", business.id)
          .eq("is_active", true)
          .order("name"),
      ]);

    const errors = [
      settingsRes.error,
      hoursRes.error,
      segmentsRes.error,
      servicesRes.error,
      staffRes.error,
    ].filter(Boolean);
    if (errors.length > 0) {
      throw new Error("Location setup preview could not be loaded.");
    }

    const settingsByLocation = new Map(
      (settingsRes.data ?? []).map((row) => [row.location_id as string, row]),
    );
    const hourDaysByLocation = new Map<string, number>();
    const openDaysByLocation = new Map<string, number>();
    for (const row of hoursRes.data ?? []) {
      const id = row.location_id as string;
      hourDaysByLocation.set(id, (hourDaysByLocation.get(id) ?? 0) + 1);
      if (!row.is_open) continue;
      openDaysByLocation.set(id, (openDaysByLocation.get(id) ?? 0) + 1);
    }
    const segmentsByLocation = new Map<string, number>();
    for (const row of segmentsRes.data ?? []) {
      const id = row.location_id as string;
      segmentsByLocation.set(id, (segmentsByLocation.get(id) ?? 0) + 1);
    }

    const serviceRows = (servicesRes.data ?? []) as Array<{
      id: string;
      location_id: string | null;
      service_locations?: Array<{ location_id: string }> | null;
    }>;

    const sources = locations.map((location) => {
      const settings = settingsByLocation.get(location.id);
      const serviceCount = serviceRows.filter(
        (service) =>
          service.location_id === location.id ||
          (service.service_locations ?? []).some(
            (row) => row.location_id === location.id,
          ),
      ).length;

      return {
        id: location.id,
        name: location.name,
        isDefault: location.is_default,
        serviceCount,
        openDayCount: openDaysByLocation.get(location.id) ?? 0,
        hourDayCount: hourDaysByLocation.get(location.id) ?? 0,
        segmentCount: segmentsByLocation.get(location.id) ?? 0,
        weeklyHours: (hoursRes.data ?? [])
          .filter((day) => day.location_id === location.id)
          .sort((a, b) => a.day_of_week - b.day_of_week)
          .map((day) => {
            const segments = (segmentsRes.data ?? [])
              .filter((segment) =>
                segment.location_id === location.id &&
                segment.day_of_week === day.day_of_week,
              )
              .sort((a, b) =>
                a.sort_order - b.sort_order || a.open_time.localeCompare(b.open_time),
              );
            // Availability uses split hours before the single daily window.
            const windows = segments.length > 0 ? segments : day.is_open ? [day] : [];
            return {
              dayOfWeek: day.day_of_week,
              ranges: windows.map((window) => ({
                openTime: window.open_time,
                closeTime: window.close_time,
              })),
            };
          }),
        settings: settings
          ? {
              appointmentIntervalMinutes: Number(
                settings.appointment_interval_minutes,
              ),
              bookingLimitDays: Number(settings.booking_limit_days),
              maxDailyBookings:
                settings.max_daily_bookings == null
                  ? null
                  : Number(settings.max_daily_bookings),
              cancellationPolicy: settings.cancellation_policy ?? null,
              minBookingNoticeMinutes: Number(
                settings.min_booking_notice_minutes ?? 0,
              ),
              defaultTravelMinutes: Number(
                settings.default_travel_minutes ?? 0,
              ),
              timezone: settings.timezone ?? null,
            }
          : null,
      } satisfies LocationTemplateSource;
    });

    const staff = ((staffRes.data ?? []) as Array<{
      id: string;
      name: string;
      location_id: string | null;
      staff_locations?: Array<{ location_id: string }> | null;
    }>).map((member) => {
      const locationIds = new Set<string>();
      if (member.location_id) locationIds.add(member.location_id);
      for (const row of member.staff_locations ?? []) {
        locationIds.add(row.location_id);
      }
      return {
        id: member.id,
        name: member.name,
        homeLocationId: member.location_id,
        locationIds: [...locationIds],
      } satisfies LocationSetupStaffOption;
    });

    return {
      sources,
      staff,
      businessMinBookingNoticeMinutes,
      defaultLocationCount: locations.filter((location) => location.is_default)
        .length,
    };
  },
);

export type LocationCreateState = ActionState & {
  locationId?: string;
  locationName?: string;
  setupMode?: "default" | "copy" | "blank";
  sourceLocationName?: string | null;
  copiedServiceCount?: number;
};

export async function createLocation(
  _prev: LocationCreateState,
  formData: FormData,
): Promise<LocationCreateState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Location name is required." };

  const locations = await getLocations();
  const quota = evaluateLocationQuota(
    locations.length,
    business.subscription_plan_key,
  );
  if (!quota.canAdd && quota.max != null) {
    return {
      error: locationLimitReachedMessage(
        quota.planKey,
        quota.max,
        quota.currentCount,
      ),
    };
  }

  const setupMode = String(formData.get("setup_mode") ?? "default");
  if (
    setupMode !== "default" &&
    setupMode !== "copy" &&
    setupMode !== "blank"
  ) {
    return { error: "Choose how to set up this location." };
  }

  const sourceLocationId =
    setupMode === "blank"
      ? null
      : String(formData.get("source_location_id") ?? "").trim() || null;
  const defaultSource = locations.find((location) => location.is_default) ?? null;
  const sourceLocation =
    setupMode === "default"
      ? defaultSource
      : setupMode === "copy"
        ? locations.find((location) => location.id === sourceLocationId) ?? null
        : null;

  if (setupMode !== "blank" && !sourceLocation) {
    return {
      error:
        setupMode === "default"
          ? "No active default location is available to copy."
          : "Choose an active location to copy.",
    };
  }

  const slug = slugify(name);
  if (!slug) return { error: "Use at least one letter (a–z) or number in the location name." };

  const timezone =
    String(formData.get("timezone") ?? "").trim() || business.timezone;
  const emptyToNull = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value || null;
  };

  const { data, error } = await supabase.rpc("create_location_from_template", {
    p_business_id: business.id,
    p_name: name,
    p_slug: slug,
    p_timezone: timezone,
    p_address_line1: emptyToNull("address_line1"),
    p_address_line2: emptyToNull("address_line2"),
    p_city: emptyToNull("city"),
    p_state: emptyToNull("state"),
    p_postal_code: emptyToNull("postal_code"),
    p_phone: emptyToNull("phone"),
    p_setup_mode: setupMode,
    p_source_location_id:
      setupMode === "default" ? defaultSource?.id ?? null : sourceLocationId,
  });

  if (error) {
    if (
      error.code === "PGRST202" ||
      error.message.includes("create_location_from_template")
    ) {
      return {
        error:
          "Location template setup is not available in this environment yet.",
      };
    }
    if (error.message.includes("LOCATION_LIMIT_REACHED") && quota.max != null) {
      return {
        error: locationLimitReachedMessage(
          quota.planKey,
          quota.max,
          quota.currentCount,
        ),
      };
    }
    if (error.code === "23505") {
      return { error: "This location name is already in use. Choose a different name." };
    }
    return { error: error.message };
  }

  const result = data as {
    location_id?: string;
    setup_mode?: "default" | "copy" | "blank";
    source_location_id?: string | null;
    copied_service_count?: number;
  } | null;

  if (!result?.location_id) {
    return { error: "Location setup completed without a location id." };
  }

  await setLocationScope(result.location_id);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/business");

  return {
    success: `Location "${name}" created.`,
    locationId: result.location_id,
    locationName: name,
    setupMode,
    sourceLocationName: sourceLocation?.name ?? null,
    copiedServiceCount: Number(result.copied_service_count ?? 0),
  };
}

export async function assignStaffToLocation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const locationId = String(formData.get("location_id") ?? "").trim();
  const staffIds = [
    ...new Set(formData.getAll("staff_ids").map(String).filter(Boolean)),
  ];

  if (!locationId) return { error: "Location is required." };

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("business_id", business.id)
    .eq("is_active", true)
    .maybeSingle();

  if (locationError || !location) {
    return { error: "The new location could not be verified." };
  }

  if (staffIds.length === 0) {
    return { success: "No staff assigned yet." };
  }

  const { data: staffRows, error: staffError } = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .in("id", staffIds);

  if (staffError || (staffRows ?? []).length !== staffIds.length) {
    return { error: "One or more selected staff members are unavailable." };
  }

  const { error } = await supabase.from("staff_locations").upsert(
    staffIds.map((staffId) => ({
      staff_id: staffId,
      location_id: locationId,
      is_primary: false,
    })),
    { onConflict: "staff_id,location_id" },
  );

  if (error) return { error: "Staff assignments could not be saved." };

  revalidatePath("/dashboard/business");
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/calendar");
  return {
    success: `${staffIds.length} staff member${staffIds.length === 1 ? "" : "s"} assigned.`,
  };
}

export async function updateLocation(
  locationId: string,
  updates: {
    name?: string;
    slug?: string;
    phone?: string | null;
    timezone?: string;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
  },
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const payload: Record<string, string | null> = {};
  if (updates.name?.trim()) payload.name = updates.name.trim();
  if (updates.slug?.trim()) payload.slug = slugify(updates.slug.trim());
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.timezone?.trim()) payload.timezone = updates.timezone.trim();
  if (updates.address_line1 !== undefined) {
    payload.address_line1 = updates.address_line1;
  }
  if (updates.address_line2 !== undefined) {
    payload.address_line2 = updates.address_line2;
  }
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.state !== undefined) payload.state = updates.state;
  if (updates.postal_code !== undefined) {
    payload.postal_code = updates.postal_code;
  }

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
  revalidatePath("/dashboard/business");
  revalidatePath("/dashboard/settings");
  return { success: "Location updated." };
}

export async function updateLocationFromForm(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locationId = String(formData.get("location_id") ?? "").trim();
  if (!locationId) return { error: "Location is required." };

  const emptyToNull = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v.length > 0 ? v : null;
  };

  return updateLocation(locationId, {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    phone: emptyToNull("phone"),
    timezone: String(formData.get("timezone") ?? "").trim() || undefined,
    address_line1: emptyToNull("address_line1"),
    address_line2: emptyToNull("address_line2"),
    city: emptyToNull("city"),
    state: emptyToNull("state"),
    postal_code: emptyToNull("postal_code"),
  });
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

/** Shared booking grid interval for calendar + availability UIs. */
export async function getBookingIntervalMinutes(
  locationId?: string,
): Promise<BookingIntervalMinutes> {
  const business = await getOrCreateBusiness();
  const loc = await getLocationWithSettings(locationId);
  return resolveBookingIntervalMinutes({
    locationInterval: loc?.settings?.appointment_interval_minutes,
    businessInterval: business.appointment_interval_minutes,
  });
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
  revalidatePath("/dashboard/business");
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

  const appointmentInterval = normalizeBookingIntervalMinutes(
    formData.get("appointment_interval_minutes"),
  );
  const bookingLimitDays = Number(formData.get("booking_limit_days"));
  const maxDailyBookings = formData.get("max_daily_bookings")
    ? Number(formData.get("max_daily_bookings"))
    : null;
  const cancellationPolicy =
    (formData.get("cancellation_policy") as string) || null;

  const { error } = await supabase
    .from("location_settings")
    .update({
      appointment_interval_minutes: appointmentInterval,
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
