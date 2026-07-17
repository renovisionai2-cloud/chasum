import { withLocationFilter } from "@/lib/location/constants";
import type { LocationScope } from "@/lib/location/constants";
import { createClient } from "@/lib/supabase/server";

/** Calendar range query — read model for Day/Week/Month surfaces. */
export async function queryAppointmentsInRange(input: {
  businessId: string;
  startIso: string;
  endIso: string;
  scope?: LocationScope;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(id, name, color, duration_minutes, buffer_before_minutes, buffer_after_minutes, price),
      staff:staff(id, name, color, photo_url),
      customer:customers(id, name, email, phone),
      location:locations(id, name)
    `,
    )
    .eq("business_id", input.businessId)
    .gte("start_time", input.startIso)
    .lte("start_time", input.endIso)
    .order("start_time");

  if (input.scope) {
    query = withLocationFilter(query, input.scope);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Chase read projection — utilization / revenue aggregates.
 * Read-only; never books.
 */
export async function queryUtilizationProjection(input: {
  businessId: string;
  startIso: string;
  endIso: string;
  locationId?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(
      "id, status, start_time, end_time, staff_id, service:services(price, duration_minutes)",
    )
    .eq("business_id", input.businessId)
    .gte("start_time", input.startIso)
    .lte("start_time", input.endIso)
    .neq("status", "cancelled");

  if (input.locationId) {
    query = query.eq("location_id", input.locationId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  let bookedMinutes = 0;
  let completed = 0;
  let noShows = 0;
  let revenue = 0;

  for (const row of rows) {
    const start = new Date(row.start_time as string).getTime();
    const end = new Date(row.end_time as string).getTime();
    bookedMinutes += Math.max(0, Math.round((end - start) / 60_000));
    if (row.status === "completed") {
      completed += 1;
      const price =
        (row.service as { price?: number } | null)?.price ?? 0;
      revenue += Number(price);
    }
    if (row.status === "no_show") noShows += 1;
  }

  return {
    appointmentCount: rows.length,
    bookedMinutes,
    completed,
    noShows,
    revenue,
    rows,
  };
}
