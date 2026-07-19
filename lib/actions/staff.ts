"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  getActiveLocationId,
  getLocationScope,
} from "@/lib/actions/location";
import {
  composeDisplayName,
  permissionsForRole,
} from "@/lib/employees/roles";
import { withLocationFilter } from "@/lib/location/constants";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getStaff() {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const supabase = await createClient();

  let query = supabase
    .from("staff")
    .select(
      "*, staff_services(service_id), location:locations!staff_location_id_fkey(id, name)",
    )
    .eq("business_id", business.id)
    .order("name");

  query = withLocationFilter(query, scope);

  const { data, error } = await query;

  if (error) {
    // PostgREST can fail when multiple FKs exist between staff and locations.
    let fallback = supabase
      .from("staff")
      .select("*, staff_services(service_id)")
      .eq("business_id", business.id)
      .order("name");
    fallback = withLocationFilter(fallback, scope);
    const retry = await fallback;
    if (retry.error) throw new Error(retry.error.message);
    return retry.data;
  }

  return data;
}

/** Lightweight staff list for service assignment (no location embed). */
export async function getStaffForAssignment() {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const supabase = await createClient();

  let query = supabase
    .from("staff")
    .select("id, name, title, is_active, location_id, color")
    .eq("business_id", business.id)
    .order("name");

  query = withLocationFilter(query, scope);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function resolveStaffLocationId(
  businessId: string,
  formData: FormData,
): Promise<string | { error: string }> {
  const requested = (formData.get("location_id") as string)?.trim();
  const supabase = await createClient();

  if (requested) {
    const { data } = await supabase
      .from("locations")
      .select("id")
      .eq("id", requested)
      .eq("business_id", businessId)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return { error: "Selected location was not found." };
    return data.id;
  }

  return getActiveLocationId();
}

export async function createStaff(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const locationResult = await resolveStaffLocationId(business.id, formData);
  if (typeof locationResult === "object") return locationResult;

  const supabase = await createClient();

  const firstName = (formData.get("first_name") as string)?.trim() || null;
  const lastName = (formData.get("last_name") as string)?.trim() || null;
  const preferredName =
    (formData.get("preferred_name") as string)?.trim() || null;
  const legacyName = (formData.get("name") as string)?.trim() || "";
  const name =
    composeDisplayName({
      firstName,
      lastName,
      preferredName,
      name: legacyName,
    }) || legacyName;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const title = (formData.get("title") as string) || null;
  const color = (formData.get("color") as string) || "#3b82f6";
  const serviceIds = formData.getAll("service_ids") as string[];
  const hireDate = (formData.get("hire_date") as string)?.trim() || null;

  if (!name) return { error: "Staff name is required." };

  const photoUrl = (formData.get("photo_url") as string) || null;
  const biography = (formData.get("biography") as string)?.trim() || null;
  const qualifications =
    (formData.get("qualifications") as string)?.trim() || null;

  const { data: staffMember, error } = await supabase
    .from("staff")
    .insert({
      business_id: business.id,
      location_id: locationResult,
      default_location_id: locationResult,
      name,
      first_name: firstName,
      last_name: lastName,
      preferred_name: preferredName,
      email,
      phone,
      title,
      color,
      photo_url: photoUrl,
      biography,
      qualifications,
      hire_date: hireDate,
      role_key: "employee",
      employment_status: "active",
      permissions: permissionsForRole("employee"),
      accept_online_bookings: true,
      accept_new_clients: true,
      accept_walk_ins: true,
    })
    .select("id")
    .single();

  if (error || !staffMember) {
    // Soft-fallback when newer columns are not applied yet
    if (
      error?.message?.includes("role_key") ||
      error?.message?.includes("permissions") ||
      error?.message?.includes("first_name") ||
      error?.message?.includes("default_location") ||
      error?.message?.includes("accept_online")
    ) {
      const fallback = await supabase
        .from("staff")
        .insert({
          business_id: business.id,
          location_id: locationResult,
          name,
          email,
          title,
          color,
          photo_url: photoUrl,
          biography,
          qualifications,
        })
        .select("id")
        .single();
      if (fallback.error || !fallback.data) {
        return { error: fallback.error?.message ?? "Failed to create employee." };
      }
      if (serviceIds.length > 0) {
        await supabase.from("staff_services").insert(
          serviceIds.map((serviceId) => ({
            staff_id: fallback.data.id,
            service_id: serviceId,
          })),
        );
      }
      revalidatePath("/dashboard/staff");
      revalidatePath("/dashboard/employees");
      revalidatePath("/dashboard/calendar");
      return {
        success:
          "Employee added. Apply migration 025_employees_module for name parts and booking rules.",
      };
    }
    return { error: error?.message ?? "Failed to create employee." };
  }

  if (serviceIds.length > 0) {
    await supabase.from("staff_services").insert(
      serviceIds.map((serviceId) => ({
        staff_id: staffMember.id,
        service_id: serviceId,
      })),
    );
  }

  await supabase.from("staff_locations").upsert({
    staff_id: staffMember.id,
    location_id: locationResult,
    is_primary: true,
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${staffMember.id}`);
  revalidatePath("/dashboard/calendar");
  return {
    success:
      serviceIds.length === 0
        ? "Provider added. Assign services on their profile so customers can book them."
        : "Provider added.",
  };
}

export async function updateStaff(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const locationResult = await resolveStaffLocationId(business.id, formData);
  if (typeof locationResult === "object") return locationResult;

  const supabase = await createClient();
  const id = formData.get("id") as string;
  const serviceIds = formData.getAll("service_ids") as string[];

  const { error } = await supabase
    .from("staff")
    .update({
      name: (formData.get("name") as string).trim(),
      email: (formData.get("email") as string) || null,
      title: (formData.get("title") as string) || null,
      color: (formData.get("color") as string) || "#3b82f6",
      photo_url: (formData.get("photo_url") as string) || null,
      biography: (formData.get("biography") as string)?.trim() || null,
      qualifications: (formData.get("qualifications") as string)?.trim() || null,
      location_id: locationResult,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  await supabase.from("staff_services").delete().eq("staff_id", id);

  if (serviceIds.length > 0) {
    await supabase.from("staff_services").insert(
      serviceIds.map((serviceId) => ({
        staff_id: id,
        service_id: serviceId,
      })),
    );
  }

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/calendar");
  return { success: "Employee updated." };
}

export async function deleteStaff(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/employees");
  return { success: "Employee removed." };
}

export async function getPublicStaff(
  businessId: string,
  serviceId?: string,
  locationId?: string,
) {
  const supabase = await createClient();

  let query = supabase
    .from("staff")
    .select("*, staff_services(service_id)")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name");

  if (locationId) {
    query = query.eq("location_id", locationId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  if (!serviceId) return data;

  return data.filter((member) =>
    member.staff_services.some(
      (ss: { service_id: string }) => ss.service_id === serviceId,
    ),
  );
}
