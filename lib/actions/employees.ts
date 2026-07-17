"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  composeDisplayName,
  isEmployeeRoleKey,
  isPermissionKey,
  permissionsForRole,
  type EmployeeRoleKey,
  type PermissionKey,
} from "@/lib/employees/roles";
import {
  getEmployeeProfile,
  listCustomRoles,
  listDepartments,
  logStaffActivity,
} from "@/lib/employees/service";
import type { CustomRole, Department, EmployeeProfile } from "@/lib/employees/types";
import { isMissingSchemaError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

function revalidateEmployee(staffId?: string) {
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/services");
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

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalInt(formData: FormData, name: string): number | null {
  const raw = emptyToNull(formData.get(name));
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function checked(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}

export async function getDepartments(): Promise<Department[]> {
  const business = await getOrCreateBusiness();
  return listDepartments(business.id);
}

export async function getCustomRoles(): Promise<CustomRole[]> {
  const business = await getOrCreateBusiness();
  return listCustomRoles(business.id);
}

export async function getEmployeeDirectory() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select(
      `*, staff_services(service_id, price_override, duration_override_minutes), location:locations!staff_location_id_fkey(id, name), department:departments(id, name, color)`,
    )
    .eq("business_id", business.id)
    .order("name");

  if (error) {
    const fallback = await supabase
      .from("staff")
      .select(
        "*, staff_services(service_id), location:locations!staff_location_id_fkey(id, name)",
      )
      .eq("business_id", business.id)
      .order("name");
    if (fallback.error) {
      const bare = await supabase
        .from("staff")
        .select("*, staff_services(service_id)")
        .eq("business_id", business.id)
        .order("name");
      if (bare.error) throw new Error(bare.error.message);
      return bare.data ?? [];
    }
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
    customPermissions.length > 0
      ? customPermissions
      : role === "custom"
        ? []
        : permissionsForRole(role);

  const locationIds = formData.getAll("location_ids") as string[];
  const serviceIds = formData.getAll("service_ids") as string[];
  const primaryLocation =
    emptyToNull(formData.get("location_id")) || locationIds[0] || null;
  const defaultLocationId =
    emptyToNull(formData.get("default_location_id")) || primaryLocation;

  if (!primaryLocation) return { error: "Primary location is required." };

  const firstName = emptyToNull(formData.get("first_name"));
  const lastName = emptyToNull(formData.get("last_name"));
  const preferredName = emptyToNull(formData.get("preferred_name"));
  const legacyName = emptyToNull(formData.get("name"));
  const name = composeDisplayName({
    firstName,
    lastName,
    preferredName,
    name: legacyName,
  });
  if (!name) return { error: "Name is required." };

  const fullPayload = {
    name,
    first_name: firstName,
    last_name: lastName,
    preferred_name: preferredName,
    email: emptyToNull(formData.get("email")),
    phone: emptyToNull(formData.get("phone")),
    title: emptyToNull(formData.get("title")),
    photo_url: emptyToNull(formData.get("photo_url")),
    biography: emptyToNull(formData.get("biography")),
    qualifications: emptyToNull(formData.get("qualifications")),
    color: (formData.get("color") as string) || "#3b82f6",
    location_id: primaryLocation,
    default_location_id: defaultLocationId,
    department_id: emptyToNull(formData.get("department_id")),
    employment_status: (formData.get("employment_status") as string) || "active",
    role_key: role === "staff" ? "employee" : role,
    custom_role_id: emptyToNull(formData.get("custom_role_id")),
    permissions,
    hire_date: emptyToNull(formData.get("hire_date")),
    termination_date: emptyToNull(formData.get("termination_date")),
    notes: emptyToNull(formData.get("notes")),
    emergency_contact_name: emptyToNull(formData.get("emergency_contact_name")),
    emergency_contact_phone: emptyToNull(
      formData.get("emergency_contact_phone"),
    ),
    emergency_contact_relationship: emptyToNull(
      formData.get("emergency_contact_relationship"),
    ),
    pay_type: (formData.get("pay_type") as string) || "hourly",
    hourly_rate_cents: centsFromDollars(formData.get("hourly_rate")),
    salary_cents: centsFromDollars(formData.get("salary")),
    commission_rate_bps: bpsFromPercent(formData.get("commission_rate")),
    payroll_notes: emptyToNull(formData.get("payroll_notes")),
    is_active: formData.get("is_active") === "true",
    ...(formData.get("booking_rules_present") === "1"
      ? {
          max_appointments_per_day: optionalInt(
            formData,
            "max_appointments_per_day",
          ),
          min_break_minutes: optionalInt(formData, "min_break_minutes") ?? 0,
          buffer_before_minutes:
            optionalInt(formData, "buffer_before_minutes") ?? 0,
          buffer_after_minutes:
            optionalInt(formData, "buffer_after_minutes") ?? 0,
          accept_online_bookings: checked(formData, "accept_online_bookings"),
          accept_new_clients: checked(formData, "accept_new_clients"),
          accept_walk_ins: checked(formData, "accept_walk_ins"),
          priority_scheduling:
            optionalInt(formData, "priority_scheduling") ?? 0,
          overtime_eligible: checked(formData, "overtime_eligible"),
        }
      : {}),
  };

  let { error } = await supabase
    .from("staff")
    .update(fullPayload)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error && isMissingSchemaError(error.message)) {
    const legacy = {
      name: fullPayload.name,
      email: fullPayload.email,
      phone: fullPayload.phone,
      title: fullPayload.title,
      photo_url: fullPayload.photo_url,
      biography: fullPayload.biography,
      qualifications: fullPayload.qualifications,
      color: fullPayload.color,
      location_id: fullPayload.location_id,
      department_id: fullPayload.department_id,
      employment_status: fullPayload.employment_status,
      role_key: fullPayload.role_key === "owner" ? "admin" : fullPayload.role_key,
      permissions: fullPayload.permissions,
      hire_date: fullPayload.hire_date,
      termination_date: fullPayload.termination_date,
      notes: fullPayload.notes,
      emergency_contact_name: fullPayload.emergency_contact_name,
      emergency_contact_phone: fullPayload.emergency_contact_phone,
      emergency_contact_relationship: fullPayload.emergency_contact_relationship,
      pay_type: fullPayload.pay_type,
      hourly_rate_cents: fullPayload.hourly_rate_cents,
      salary_cents: fullPayload.salary_cents,
      commission_rate_bps: fullPayload.commission_rate_bps,
      payroll_notes: fullPayload.payroll_notes,
      is_active: fullPayload.is_active,
    };
    const retry = await supabase
      .from("staff")
      .update(legacy)
      .eq("id", id)
      .eq("business_id", business.id);
    error = retry.error;
    if (!error) {
      // continue with assignments; surface migration hint in success later
    }
  }

  if (error) {
    return {
      error:
        error.message.includes("department") ||
        error.message.includes("role_key") ||
        error.message.includes("owner")
          ? "Could not save employee profile. Apply migration 025_employees_module if you have not yet."
          : error.message,
    };
  }

  // Preserve price/duration overrides when reassigning services
  const existingLinks = await supabase
    .from("staff_services")
    .select("service_id, price_override, duration_override_minutes")
    .eq("staff_id", id);
  const existingByService = new Map(
    ((existingLinks.data ?? []) as {
      service_id: string;
      price_override: number | null;
      duration_override_minutes: number | null;
    }[]).map((row) => [row.service_id, row]),
  );

  await supabase.from("staff_services").delete().eq("staff_id", id);
  if (serviceIds.length > 0) {
    const rows = serviceIds.map((serviceId) => {
      const priceRaw = emptyToNull(formData.get(`price_override_${serviceId}`));
      const durationRaw = emptyToNull(
        formData.get(`duration_override_${serviceId}`),
      );
      const existing = existingByService.get(serviceId);
      const priceOverride =
        priceRaw != null && Number.isFinite(Number(priceRaw))
          ? Number(priceRaw)
          : (existing?.price_override ?? null);
      const durationOverride =
        durationRaw != null && Number.isFinite(Number(durationRaw))
          ? Math.trunc(Number(durationRaw))
          : (existing?.duration_override_minutes ?? null);
      return {
        staff_id: id,
        service_id: serviceId,
        price_override: priceOverride,
        duration_override_minutes: durationOverride,
      };
    });

    const { error: linkError } = await supabase.from("staff_services").insert(rows);
    if (linkError && linkError.message.includes("duration_override")) {
      const fallback = rows.map(({ staff_id, service_id, price_override }) => ({
        staff_id,
        service_id,
        price_override,
      }));
      const retry = await supabase.from("staff_services").insert(fallback);
      if (retry.error && retry.error.message.includes("price_override")) {
        await supabase.from("staff_services").insert(
          fallback.map(({ staff_id, service_id }) => ({ staff_id, service_id })),
        );
      }
    } else if (linkError && linkError.message.includes("price_override")) {
      await supabase.from("staff_services").insert(
        rows.map(({ staff_id, service_id }) => ({ staff_id, service_id })),
      );
    }
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

export async function bulkUpdateEmployeeStatus(
  staffIds: string[],
  isActive: boolean,
): Promise<ActionState> {
  if (staffIds.length === 0) return { error: "Select at least one employee." };
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("staff")
    .update({
      is_active: isActive,
      employment_status: isActive ? "active" : "terminated",
    })
    .eq("business_id", business.id)
    .in("id", staffIds);

  if (error) return { error: error.message };

  const userId = await currentUserId();
  for (const staffId of staffIds) {
    await logStaffActivity({
      businessId: business.id,
      staffId,
      eventType: isActive ? "activated" : "deactivated",
      title: isActive ? "Employee activated" : "Employee deactivated",
      createdBy: userId,
    });
  }

  revalidateEmployee();
  return {
    success: isActive
      ? `Activated ${staffIds.length} employee(s).`
      : `Deactivated ${staffIds.length} employee(s).`,
  };
}

export async function upsertCustomRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = emptyToNull(formData.get("id"));
  const label = emptyToNull(formData.get("label"));
  if (!label) return { error: "Role name is required." };

  const key =
    emptyToNull(formData.get("key")) ||
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40);

  const permissions = (formData.getAll("permissions") as string[]).filter(
    isPermissionKey,
  );

  const payload = {
    business_id: business.id,
    key,
    label,
    description: emptyToNull(formData.get("description")),
    permissions,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") !== "false",
  };

  const { error } = id
    ? await supabase
        .from("custom_roles")
        .update(payload)
        .eq("id", id)
        .eq("business_id", business.id)
    : await supabase.from("custom_roles").insert(payload);

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return {
        error: "Apply migration 025_employees_module to enable custom roles.",
      };
    }
    if (error.code === "23505") return { error: "Role key already exists." };
    return { error: error.message };
  }

  revalidateEmployee();
  return { success: id ? "Custom role updated." : "Custom role created." };
}

export async function createDepartmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Department name is required." };

  const { error } = await supabase.from("departments").insert({
    business_id: business.id,
    name,
    description: emptyToNull(formData.get("description")),
    color: (formData.get("color") as string) || "#64748b",
  });

  if (error) {
    if (error.code === "23505") return { error: "Department already exists." };
    return {
      error: error.message.includes("departments")
        ? "Apply migration 017_employee_management to enable departments."
        : error.message,
    };
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
  if (!staffId) return { error: "Employee id is required." };
  if (!note) return { error: "Note is required." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("staff")
    .select("notes")
    .eq("id", staffId)
    .eq("business_id", business.id)
    .maybeSingle();

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const previous = (current?.notes as string | null) ?? "";
  const next = previous
    ? `${previous}\n\n[${stamp}]\n${note}`
    : `[${stamp}]\n${note}`;

  const { error } = await supabase
    .from("staff")
    .update({ notes: next })
    .eq("id", staffId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  const userId = await currentUserId();
  await logStaffActivity({
    businessId: business.id,
    staffId,
    eventType: "note",
    title: "Note added",
    body: note,
    createdBy: userId,
  });

  revalidateEmployee(staffId);
  return { success: "Note saved." };
}
