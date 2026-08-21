import {
  type BookingIntervalMinutes,
} from "@/lib/booking/interval";

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
 * Business-default cascade only. Updates location_settings rows that still
 * match the previous business interval. Deliberate overrides are left alone.
 * Never used by location-scoped Settings saves.
 */
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
