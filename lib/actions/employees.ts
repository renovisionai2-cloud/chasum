"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  isEmployeeRoleKey,
  isPermissionKey,
  permissionsForRole,
  type EmployeeRoleKey,
  type PermissionKey,
} from "@/lib/employees/roles";
import {
  getEmployeeProfile,
  listDepartments,
  logStaffActivity,
} from "@/lib/employees/service";
import type { Department, EmployeeProfile } from "@/lib/employees/types";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

function revalidateEmployee(staffId?: string) {
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/calendar");
  if (staffId) {
    revalidatePath(`/dashboard/staff/${staffId}`);
    revalidatePath(`/dashboard/employees/${staffId}`);
  }
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function centsFromDollars(raw: FormDataEntryValue | null): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

function bpsFromPercent(raw: FormDataEntryValue | null): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

export async function getDepartments(): Promise<Department[]> {
  const business = await getOrCreateBusiness();
  return listDepartments(business.id);
}

export async function getEmployeeDirectory() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select(
      `*, staff_services(service_id), location:locations(id, name), department:departments(id, name, color)`,
    )
    .eq("business_id", business.id)
    .order("name");

  if (error) {
    // Pre-migration fallback
    const fallback = await supabase
      .from("staff")
      .select("*, staff_services(service_id), location:locations(id, name)")
      .eq("business_id", business.id)
      .order("name");
    if (fallback.error) throw new Error(fallback.error.message);
    return fallback.data ?? [];
  }

  return data ?? [];
}

export async function loadEmployeeProfile(
  staffId: string,
): Promise<EmployeeProfile | null> {
  const business = await getOrCreateBusiness();
  return getEmployeeProfile(business.id, staffId);
}

export async function updateEmployeeProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Employee id is required." };

  const roleRaw = String(formData.get("role_key") ?? "employee");
  const role: EmployeeRoleKey = isEmployeeRoleKey(roleRaw) ? roleRaw : "employee";

  const permissionEntries = formData.getAll("permissions") as string[];
  const customPermissions = permissionEntries.filter(isPermissionKey) as PermissionKey[];
  const permissions =
    customPermissions.length > 0 ? customPermissions : permissionsForRole(role);

  const locationIds = formData.getAll("location_ids") as string[];
  const serviceIds = formData.getAll("service_ids") as string[];
  const primaryLocation =
    (formData.get("location_id") as string)?.trim() ||
    locationIds[0] ||
    null;

  if (!primaryLocation) return { error: "Primary location is required." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const payload = {
    name,
    email: (formData.get("email") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    title: (formData.get("title") as string)?.trim() || null,
    photo_url: (formData.get("photo_url") as string)?.trim() || null,
    biography: (formData.get("biography") as string)?.trim() || null,
    qualifications: (formData.get("qualifications") as string)?.trim() || null,
    color: (formData.get("color") as string) || "#3b82f6",
    location_id: primaryLocation,
    department_id: (formData.get("department_id") as string)?.trim() || null,
    employment_status: (formData.get("employment_status") as string) || "active",
    role_key: role,
    permissions,
    hire_date: (formData.get("hire_date") as string)?.trim() || null,
    termination_date: (formData.get("termination_date") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
    emergency_contact_name:
      (formData.get("emergency_contact_name") as string)?.trim() || null,
    emergency_contact_phone:
      (formData.get("emergency_contact_phone") as string)?.trim() || null,
    emergency_contact_relationship:
      (formData.get("emergency_contact_relationship") as string)?.trim() || null,
    pay_type: (formData.get("pay_type") as string) || "hourly",
    hourly_rate_cents: centsFromDollars(formData.get("hourly_rate")),
    salary_cents: centsFromDollars(formData.get("salary")),
    commission_rate_bps: bpsFromPercent(formData.get("commission_rate")),
    payroll_notes: (formData.get("payroll_notes") as string)?.trim() || null,
    is_active: formData.get("is_active") === "true",
  };

  const { error } = await supabase
    .from("staff")
    .update(payload)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    return {
      error:
        error.message.includes("department") || error.message.includes("role_key")
          ? "Could not save employee profile. Apply migration 017_employee_management if you have not yet."
          : error.message,
    };
  }

  await supabase.from("staff_services").delete().eq("staff_id", id);
  if (serviceIds.length > 0) {
    await supabase.from("staff_services").insert(
      serviceIds.map((serviceId) => ({
        staff_id: id,
        service_id: serviceId,
      })),
    );
  }

  const assignedLocations =
    locationIds.length > 0 ? locationIds : [primaryLocation];
  await supabase.from("staff_locations").delete().eq("staff_id", id);
  await supabase.from("staff_locations").insert(
    assignedLocations.map((locationId) => ({
      staff_id: id,
      location_id: locationId,
      is_primary: locationId === primaryLocation,
    })),
  );

  const userId = await currentUserId();
  await logStaffActivity({
    businessId: business.id,
    staffId: id,
    eventType: "updated",
    title: "Employee profile updated",
    createdBy: userId,
  });

  revalidateEmployee(id);
  return { success: "Employee profile saved." };
}

export async function createDepartmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Department name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    business_id: business.id,
    name,
    description: (formData.get("description") as string)?.trim() || null,
    color: (formData.get("color") as string) || "#64748b",
  });

  if (error) {
    if (error.code === "23505") return { error: "Department already exists." };
    return { error: error.message };
  }

  revalidateEmployee();
  return { success: "Department created." };
}

export async function addEmployeeNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const staffId = String(formData.get("staff_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!staffId || !note) return { error: "Note is required." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("staff")
    .select("notes")
    .eq("id", staffId)
    .eq("business_id", business.id)
    .maybeSingle();

  const previous = (existing?.notes as string | null) ?? "";
  const merged = previous ? `${previous.trim()}\n\n${note}` : note;

  const { error } = await supabase
    .from("staff")
    .update({ notes: merged })
    .eq("id", staffId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  await logStaffActivity({
    businessId: business.id,
    staffId,
    eventType: "note_added",
    title: "Internal note added",
    body: note,
    createdBy: await currentUserId(),
  });

  revalidateEmployee(staffId);
  return { success: "Note added." };
}
