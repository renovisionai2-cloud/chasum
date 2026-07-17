"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  getActiveLocationId,
  getLocationScope,
} from "@/lib/actions/location";
import { withLocationFilter } from "@/lib/location/constants";
import { isMissingSchemaError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  Service,
  ServiceBlackout,
  ServiceStaffAssignment,
} from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

function revalidateServices() {
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/business");
}

function checked(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalInt(formData: FormData, name: string): number | null {
  const raw = emptyToNull(formData.get(name));
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function dollarsToCents(formData: FormData, name: string): number {
  const raw = emptyToNull(formData.get(name));
  if (raw == null) return 0;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars < 0) return 0;
  return Math.round(dollars * 100);
}

type BookingVisibility = "online" | "hidden" | "internal";
type ConfirmationMode = "inherit" | "auto_confirm" | "require_approval";

function parseVisibility(formData: FormData): BookingVisibility {
  const raw = (formData.get("booking_visibility") as string) || "online";
  if (raw === "hidden" || raw === "internal" || raw === "online") return raw;
  return "online";
}

function parseConfirmationMode(formData: FormData): ConfirmationMode {
  const raw = (formData.get("confirmation_mode") as string) || "inherit";
  if (
    raw === "auto_confirm" ||
    raw === "require_approval" ||
    raw === "inherit"
  ) {
    return raw;
  }
  return "inherit";
}

function buildServicePayload(
  formData: FormData,
  businessId: string,
  locationId: string,
  options?: { includeId?: boolean },
) {
  const visibility = parseVisibility(formData);
  const categoryId = emptyToNull(formData.get("category_id"));
  const categoryName = emptyToNull(formData.get("category"));
  const depositCents = dollarsToCents(formData, "deposit_amount");
  const depositRequired = checked(formData, "deposit_required") || depositCents > 0;

  return {
    ...(options?.includeId
      ? {}
      : {
          business_id: businessId,
          location_id: locationId,
        }),
    name: (formData.get("name") as string)?.trim() ?? "",
    description: emptyToNull(formData.get("description")),
    category: categoryName,
    category_id: categoryId,
    duration_minutes: Number(formData.get("duration_minutes")),
    cleanup_minutes: Number(formData.get("cleanup_minutes")) || 0,
    price: Number(formData.get("price")) || 0,
    color: (formData.get("color") as string) || "#2563eb",
    buffer_before_minutes: Number(formData.get("buffer_before_minutes")) || 0,
    buffer_after_minutes: Number(formData.get("buffer_after_minutes")) || 0,
    preparation_instructions: emptyToNull(
      formData.get("preparation_instructions"),
    ),
    internal_notes: emptyToNull(formData.get("internal_notes")),
    cancellation_policy: emptyToNull(formData.get("cancellation_policy")),
    booking_visibility: visibility,
    online_booking: visibility === "online",
    confirmation_mode: parseConfirmationMode(formData),
    online_payment_required: checked(formData, "online_payment_required"),
    taxable: checked(formData, "taxable"),
    deposit_required: depositRequired,
    deposit_cents: depositRequired ? depositCents : 0,
    tax_rate_bps: optionalInt(formData, "tax_rate_bps") ?? 0,
    sort_order: Number(formData.get("sort_order")) || 0,
    max_appointments_per_day: optionalInt(formData, "max_appointments_per_day"),
    min_booking_notice_minutes: optionalInt(
      formData,
      "min_booking_notice_minutes",
    ),
    max_booking_days_ahead: optionalInt(formData, "max_booking_days_ahead"),
    is_active: checked(formData, "is_active"),
  };
}

const CORE_SERVICE_KEYS = [
  "business_id",
  "location_id",
  "name",
  "description",
  "category",
  "duration_minutes",
  "price",
  "color",
  "buffer_before_minutes",
  "buffer_after_minutes",
  "preparation_instructions",
  "internal_notes",
  "cancellation_policy",
  "online_booking",
  "is_active",
] as const;

function pickCorePayload(payload: Record<string, unknown>) {
  const core: Record<string, unknown> = {};
  for (const key of CORE_SERVICE_KEYS) {
    if (key in payload) core[key] = payload[key];
  }
  return core;
}

async function syncServiceLocations(
  serviceId: string,
  primaryLocationId: string,
  locationIds: string[],
) {
  const supabase = await createClient();
  const unique = Array.from(
    new Set([primaryLocationId, ...locationIds.filter(Boolean)]),
  );

  const { error: deleteError } = await supabase
    .from("service_locations")
    .delete()
    .eq("service_id", serviceId);
  if (deleteError && !isMissingSchemaError(deleteError.message)) {
    return deleteError.message;
  }

  if (unique.length === 0) return null;

  const rows = unique.map((locationId) => ({
    service_id: serviceId,
    location_id: locationId,
    is_primary: locationId === primaryLocationId,
  }));

  const { error } = await supabase.from("service_locations").insert(rows);
  if (error && !isMissingSchemaError(error.message)) return error.message;
  return null;
}

async function syncStaffAssignments(
  serviceId: string,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient();
  const staffIds = formData.getAll("staff_ids").map(String).filter(Boolean);

  const { error: deleteError } = await supabase
    .from("staff_services")
    .delete()
    .eq("service_id", serviceId);
  if (deleteError) return deleteError.message;

  if (staffIds.length === 0) return null;

  const rows = staffIds.map((staffId) => {
    const overrideRaw = emptyToNull(formData.get(`price_override_${staffId}`));
    const priceOverride =
      overrideRaw != null && Number.isFinite(Number(overrideRaw))
        ? Number(overrideRaw)
        : null;
    return {
      staff_id: staffId,
      service_id: serviceId,
      price_override: priceOverride,
    };
  });

  const { error } = await supabase.from("staff_services").insert(rows);
  if (error) {
    if (error.message.includes("price_override")) {
      const fallback = rows.map(({ staff_id, service_id }) => ({
        staff_id,
        service_id,
      }));
      const retry = await supabase.from("staff_services").insert(fallback);
      if (retry.error) return retry.error.message;
      return null;
    }
    return error.message;
  }
  return null;
}

export async function getServices(): Promise<Service[]> {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const supabase = await createClient();

  let query = supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true })
    .order("name");

  query = withLocationFilter(query, scope);

  const { data, error } = await query;

  if (error) {
    if (error.message.includes("sort_order")) {
      let fallback = supabase
        .from("services")
        .select("*")
        .eq("business_id", business.id)
        .order("name");
      fallback = withLocationFilter(fallback, scope);
      const retry = await fallback;
      if (retry.error) throw new Error(retry.error.message);
      return (retry.data as Service[]) ?? [];
    }
    throw new Error(error.message);
  }
  return (data as Service[]) ?? [];
}

export async function getServiceStaffAssignments(
  serviceId: string,
): Promise<ServiceStaffAssignment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_services")
    .select("service_id, staff_id, price_override")
    .eq("service_id", serviceId);

  if (error) {
    if (error.message.includes("price_override")) {
      const retry = await supabase
        .from("staff_services")
        .select("service_id, staff_id")
        .eq("service_id", serviceId);
      if (retry.error) return [];
      return ((retry.data ?? []) as { service_id: string; staff_id: string }[]).map(
        (row) => ({
          service_id: row.service_id,
          staff_id: row.staff_id,
          price_override: null,
        }),
      );
    }
    return [];
  }

  return ((data ?? []) as ServiceStaffAssignment[]).map((row) => ({
    service_id: row.service_id,
    staff_id: row.staff_id,
    price_override:
      row.price_override == null ? null : Number(row.price_override),
  }));
}

export async function getServiceLocationIds(serviceId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_locations")
    .select("location_id, is_primary")
    .eq("service_id", serviceId)
    .order("is_primary", { ascending: false });

  if (error) {
    if (isMissingSchemaError(error.message)) return [];
    return [];
  }
  return (data ?? []).map((row) => row.location_id as string);
}

export async function getServiceBlackouts(
  serviceId: string,
): Promise<ServiceBlackout[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_blackouts")
    .select("*")
    .eq("business_id", business.id)
    .eq("service_id", serviceId)
    .order("starts_at", { ascending: true });

  if (error) {
    if (isMissingSchemaError(error.message)) return [];
    return [];
  }
  return (data as ServiceBlackout[]) ?? [];
}

export async function createService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const primaryLocation =
    emptyToNull(formData.get("primary_location_id")) ??
    (await getActiveLocationId());
  const locationIds = formData.getAll("location_ids").map(String).filter(Boolean);
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const durationMinutes = Number(formData.get("duration_minutes"));
  if (!name) return { error: "Service name is required." };
  if (!durationMinutes || durationMinutes < 5) {
    return { error: "Duration must be at least 5 minutes." };
  }

  const payload = buildServicePayload(formData, business.id, primaryLocation);

  let insertedId: string | null = null;
  let { data, error } = await supabase
    .from("services")
    .insert(payload)
    .select("id")
    .single();

  if (error && isMissingSchemaError(error.message)) {
    const core = pickCorePayload(payload);
    const retry = await supabase
      .from("services")
      .insert(core)
      .select("id")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return { error: error.message };
  insertedId = data?.id ?? null;
  if (!insertedId) return { error: "Service was created but id was missing." };

  const locationError = await syncServiceLocations(
    insertedId,
    primaryLocation,
    locationIds,
  );
  if (locationError) return { error: locationError };

  const staffError = await syncStaffAssignments(insertedId, formData);
  if (staffError) return { error: staffError };

  revalidateServices();
  return { success: "Service created." };
}

export async function updateService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = formData.get("id") as string;
  if (!id) return { error: "Service id is required." };

  const primaryLocation =
    emptyToNull(formData.get("primary_location_id")) ??
    (await getActiveLocationId());
  const locationIds = formData.getAll("location_ids").map(String).filter(Boolean);

  const payload = buildServicePayload(formData, business.id, primaryLocation);
  // Keep primary location in sync for booking RPCs
  const updatePayload = {
    ...payload,
    location_id: primaryLocation,
  };

  let { error } = await supabase
    .from("services")
    .update(updatePayload)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error && isMissingSchemaError(error.message)) {
    const core = pickCorePayload(updatePayload);
    const retry = await supabase
      .from("services")
      .update(core)
      .eq("id", id)
      .eq("business_id", business.id);
    error = retry.error;
  }

  if (error) return { error: error.message };

  const locationError = await syncServiceLocations(id, primaryLocation, locationIds);
  if (locationError) return { error: locationError };

  const staffError = await syncStaffAssignments(id, formData);
  if (staffError) return { error: staffError };

  revalidateServices();
  return { success: "Service updated." };
}

export async function deleteService(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidateServices();
  return { success: "Service deleted." };
}

export async function reorderServices(
  orderedIds: string[],
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase
      .from("services")
      .update({ sort_order: index })
      .eq("id", orderedIds[index])
      .eq("business_id", business.id);
    if (error) {
      if (isMissingSchemaError(error.message)) {
        return {
          error:
            "Apply migration 024_services_module to enable service ordering.",
        };
      }
      return { error: error.message };
    }
  }

  revalidateServices();
  return { success: "Service order updated." };
}

export async function upsertServiceBlackout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const serviceId = emptyToNull(formData.get("service_id"));
  const startsAt = emptyToNull(formData.get("starts_at"));
  const endsAt = emptyToNull(formData.get("ends_at"));

  if (!serviceId) return { error: "Service is required." };
  if (!startsAt || !endsAt) {
    return { error: "Blackout start and end are required." };
  }
  if (new Date(endsAt) <= new Date(startsAt)) {
    return { error: "Blackout end must be after start." };
  }

  const payload = {
    business_id: business.id,
    service_id: serviceId,
    location_id: emptyToNull(formData.get("location_id")),
    starts_at: startsAt,
    ends_at: endsAt,
    reason: emptyToNull(formData.get("reason")),
  };

  const { error } = id
    ? await supabase
        .from("service_blackouts")
        .update(payload)
        .eq("id", id)
        .eq("business_id", business.id)
    : await supabase.from("service_blackouts").insert(payload);

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return {
        error:
          "Apply migration 024_services_module to enable service blackouts.",
      };
    }
    return { error: error.message };
  }

  revalidateServices();
  return { success: id ? "Blackout updated." : "Blackout created." };
}

export async function deleteServiceBlackout(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_blackouts")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return {
        error:
          "Apply migration 024_services_module to enable service blackouts.",
      };
    }
    return { error: error.message };
  }

  revalidateServices();
  return { success: "Blackout deleted." };
}

export async function getPublicServices(
  businessId: string,
  locationId?: string,
) {
  const supabase = await createClient();

  let query = supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .eq("online_booking", true)
    .order("sort_order", { ascending: true })
    .order("name");

  if (locationId) {
    query = query.eq("location_id", locationId);
  }

  const { data, error } = await query;

  if (error) {
    if (error.message.includes("sort_order")) {
      let fallback = supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .eq("online_booking", true)
        .order("name");
      if (locationId) fallback = fallback.eq("location_id", locationId);
      const retry = await fallback;
      if (retry.error) throw new Error(retry.error.message);
      return retry.data;
    }
    throw new Error(error.message);
  }

  // Prefer booking_visibility when present (kept in sync with online_booking).
  return (data ?? []).filter((service) => {
    const visibility = (service as Service).booking_visibility;
    if (!visibility) return true;
    return visibility === "online";
  });
}
