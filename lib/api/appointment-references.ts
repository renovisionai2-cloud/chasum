import "server-only";
import type { createServiceClient } from "@/lib/supabase/service";

type Client = ReturnType<typeof createServiceClient>;

export type AppointmentReferences = {
  location_id?: string;
  customer_id: string;
  service_id: string;
  staff_id: string;
};

/** Validate before a privileged API write; simple foreign keys do not check tenancy. */
export async function validateAppointmentReferences({
  client,
  businessId,
  references,
  requireActive = { location: true, service: true, staff: true },
}: {
  client: Client;
  businessId: string;
  references: AppointmentReferences;
  requireActive?: { location: boolean; service: boolean; staff: boolean };
}): Promise<
  | { ok: true; references: Required<AppointmentReferences> }
  | { ok: false; error: string; status: 400 | 503 }
> {
  let locationQuery = client.from("locations").select("id")
    .eq("business_id", businessId);
  if (references.location_id) {
    locationQuery = locationQuery.eq("id", references.location_id);
  }
  if (requireActive.location || !references.location_id) {
    locationQuery = locationQuery.eq("is_active", true);
  }
  let serviceQuery = client.from("services").select("id")
    .eq("business_id", businessId).eq("id", references.service_id);
  if (requireActive.service) serviceQuery = serviceQuery.eq("is_active", true);
  let staffQuery = client.from("staff").select("id")
    .eq("business_id", businessId).eq("id", references.staff_id);
  if (requireActive.staff) staffQuery = staffQuery.eq("is_active", true);

  const [locations, customer, service, staff] = await Promise.all([
    // Two rows are enough to prove ambiguity; never choose the first of many.
    locationQuery.limit(2),
    client.from("customers").select("id")
      .eq("business_id", businessId).eq("id", references.customer_id).maybeSingle(),
    serviceQuery.maybeSingle(),
    staffQuery.maybeSingle(),
  ]);
  if ([locations, customer, service, staff].some((result) => result.error)) {
    return { ok: false, error: "Unable to validate appointment references", status: 503 };
  }
  if (!references.location_id && (locations.data?.length ?? 0) > 1) {
    return { ok: false, error: "location_id is required when multiple active locations exist", status: 400 };
  }
  if (locations.data?.length !== 1) {
    return { ok: false, error: "Location is not available for this business", status: 400 };
  }
  // Missing and foreign IDs intentionally have the same response.
  for (const [label, result] of [["Customer", customer], ["Service", service], ["Staff", staff]] as const) {
    if (!result.data) return { ok: false, error: `${label} is not available for this business`, status: 400 };
  }
  return {
    ok: true,
    references: {
      location_id: locations.data[0].id,
      customer_id: customer.data!.id,
      service_id: service.data!.id,
      staff_id: staff.data!.id,
    },
  };
}
