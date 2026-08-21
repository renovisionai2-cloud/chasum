import {
  normalizeBookingIntervalMinutes,
  type BookingIntervalMinutes,
} from "@/lib/booking/interval";

export const BUSINESS_INTERVAL_SAVE_ERROR =
  "Your booking interval could not be saved. Please try again.";

export const LOCATION_INTERVAL_INHERIT_ERROR =
  "Your business default was saved, but some locations still use the previous interval. Try saving again from Settings.";

type QueryResult = {
  data?: unknown;
  error?: { message?: string } | null;
};

type ThenableFilter = PromiseLike<QueryResult> & {
  update: (payload: Record<string, unknown>) => ThenableFilter;
  select: (columns: string) => ThenableFilter;
  eq: (column: string, value: unknown) => ThenableFilter;
  in: (column: string, values: string[]) => ThenableFilter;
};

function asFilter(value: unknown): ThenableFilter {
  return value as ThenableFilter;
}

type SupabaseLike = {
  from: (table: string) => unknown;
};

/**
 * True when this location is still following the business default.
 * Matching values mean "inherited", not an intentional override.
 */
export function isFollowingBusinessInterval(
  businessInterval: unknown,
  locationInterval: unknown,
): boolean {
  return (
    normalizeBookingIntervalMinutes(locationInterval) ===
    normalizeBookingIntervalMinutes(businessInterval)
  );
}

/**
 * A location scheduling save should update the business default only when
 * the location is still inherited and the operator picked a new interval.
 * Already-different locations stay location-scoped overrides.
 */
export function locationIntervalChangeTouchesBusiness(input: {
  businessInterval: unknown;
  currentLocationInterval: unknown;
  nextInterval: unknown;
}): boolean {
  const next = normalizeBookingIntervalMinutes(input.nextInterval);
  const previousBusiness = normalizeBookingIntervalMinutes(
    input.businessInterval,
  );
  if (next === previousBusiness) return false;
  return isFollowingBusinessInterval(
    input.businessInterval,
    input.currentLocationInterval,
  );
}

export async function propagateInheritedBookingInterval(
  supabase: SupabaseLike,
  input: {
    locationIds: string[];
    previousInterval: BookingIntervalMinutes;
    nextInterval: BookingIntervalMinutes;
  },
): Promise<{ error?: string }> {
  if (input.nextInterval === input.previousInterval) return {};
  if (input.locationIds.length === 0) return {};

  const result = (await asFilter(supabase.from("location_settings"))
    .update({ appointment_interval_minutes: input.nextInterval })
    .in("location_id", input.locationIds)
    .eq("appointment_interval_minutes", input.previousInterval)) as QueryResult;

  if (result?.error) {
    return { error: LOCATION_INTERVAL_INHERIT_ERROR };
  }
  return {};
}

export async function saveBusinessBookingInterval(
  supabase: SupabaseLike,
  input: {
    businessId: string;
    previousInterval: BookingIntervalMinutes;
    nextInterval: BookingIntervalMinutes;
  },
): Promise<{ error?: string }> {
  if (input.nextInterval === input.previousInterval) return {};

  const businessResult = (await asFilter(supabase.from("businesses"))
    .update({ appointment_interval_minutes: input.nextInterval })
    .eq("id", input.businessId)) as QueryResult;

  if (businessResult?.error) {
    return { error: BUSINESS_INTERVAL_SAVE_ERROR };
  }

  const locationsResult = (await asFilter(supabase.from("locations"))
    .select("id")
    .eq("business_id", input.businessId)) as QueryResult & {
    data?: { id: string }[] | null;
  };

  if (locationsResult?.error) {
    return { error: LOCATION_INTERVAL_INHERIT_ERROR };
  }

  const locationIds = (locationsResult?.data ?? []).map((row) => String(row.id));
  return propagateInheritedBookingInterval(supabase, {
    locationIds,
    previousInterval: input.previousInterval,
    nextInterval: input.nextInterval,
  });
}

/**
 * Settings → Scheduling rules path. Inherited locations update the business
 * default; intentional overrides stay location-scoped.
 */
export async function applyLocationSchedulingInterval(
  supabase: SupabaseLike,
  input: {
    businessId: string;
    locationId: string;
    businessInterval: unknown;
    currentLocationInterval: unknown;
    nextInterval: unknown;
    locationPatch: Record<string, unknown>;
  },
): Promise<{ error?: string; touchedBusiness: boolean }> {
  const previousBusiness = normalizeBookingIntervalMinutes(
    input.businessInterval,
  );
  const next = normalizeBookingIntervalMinutes(input.nextInterval);
  const touchedBusiness = locationIntervalChangeTouchesBusiness({
    businessInterval: input.businessInterval,
    currentLocationInterval: input.currentLocationInterval,
    nextInterval: input.nextInterval,
  });

  if (touchedBusiness) {
    const synced = await saveBusinessBookingInterval(supabase, {
      businessId: input.businessId,
      previousInterval: previousBusiness,
      nextInterval: next,
    });
    if (synced.error) return { error: synced.error, touchedBusiness: true };
  }

  const locationResult = (await asFilter(supabase.from("location_settings"))
    .update(input.locationPatch)
    .eq("location_id", input.locationId)) as QueryResult;

  if (locationResult?.error) {
    return {
      error: locationResult.error.message ?? "Location settings could not be saved.",
      touchedBusiness,
    };
  }

  return { touchedBusiness };
}
