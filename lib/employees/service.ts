import {
  isEmployeeRoleKey,
  parsePermissions,
  permissionsForRole,
  type EmployeeRoleKey,
  type EmploymentStatus,
  type PayType,
} from "@/lib/employees/roles";
import type {
  Department,
  EmployeePerformance,
  EmployeeProfile,
  StaffActivityEvent,
  StaffLocationAssignment,
} from "@/lib/employees/types";
import { createClient } from "@/lib/supabase/server";
import type { StaffDocument } from "@/lib/types/booking";

function asEmploymentStatus(value: unknown): EmploymentStatus {
  const allowed: EmploymentStatus[] = [
    "active",
    "onboarding",
    "on_leave",
    "terminated",
    "contractor",
  ];
  if (typeof value === "string" && allowed.includes(value as EmploymentStatus)) {
    return value as EmploymentStatus;
  }
  return "active";
}

function asPayType(value: unknown): PayType {
  const allowed: PayType[] = ["hourly", "salary", "commission", "hybrid"];
  if (typeof value === "string" && allowed.includes(value as PayType)) {
    return value as PayType;
  }
  return "hourly";
}

function asRole(value: unknown): EmployeeRoleKey {
  return isEmployeeRoleKey(value) ? value : "employee";
}

export function mapDepartment(row: Record<string, unknown>): Department {
  return {
    id: String(row.id),
    business_id: String(row.business_id),
    name: String(row.name),
    description: (row.description as string) ?? null,
    color: String(row.color ?? "#64748b"),
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active ?? true),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapActivity(row: Record<string, unknown>): StaffActivityEvent {
  return {
    id: String(row.id),
    business_id: String(row.business_id),
    staff_id: String(row.staff_id),
    event_type: String(row.event_type),
    title: String(row.title),
    body: (row.body as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_by: (row.created_by as string) ?? null,
    created_at: String(row.created_at),
  };
}

function emptyPerformance(): EmployeePerformance {
  return {
    completedAppointments: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    lifetimeRevenue: 0,
    completionRate: 0,
    noShowRate: 0,
  };
}

export async function logStaffActivity(input: {
  businessId: string;
  staffId: string;
  eventType: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_activity").insert({
    business_id: input.businessId,
    staff_id: input.staffId,
    event_type: input.eventType,
    title: input.title,
    body: input.body ?? null,
    metadata: input.metadata ?? {},
    created_by: input.createdBy ?? null,
  });
  if (error) {
    console.error("[employees] activity log failed:", error.message);
  }
}

export async function listDepartments(businessId: string): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[employees] list departments:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapDepartment(row as Record<string, unknown>));
}

async function computePerformance(
  businessId: string,
  staffId: string,
): Promise<EmployeePerformance> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("status, start_time, service:services(price)")
    .eq("business_id", businessId)
    .eq("staff_id", staffId);

  if (error || !data) return emptyPerformance();

  const now = Date.now();
  let completed = 0;
  let upcoming = 0;
  let cancelled = 0;
  let noShow = 0;
  let revenue = 0;

  for (const row of data) {
    const status = row.status as string;
    const start = new Date(row.start_time as string).getTime();
    if (status === "completed") {
      completed += 1;
      const price = (row.service as { price?: number } | null)?.price ?? 0;
      revenue += Number(price);
    } else if (status === "cancelled") {
      cancelled += 1;
    } else if (status === "no_show") {
      noShow += 1;
    } else if (start >= now && status !== "cancelled") {
      upcoming += 1;
    }
  }

  const decided = completed + cancelled + noShow;
  return {
    completedAppointments: completed,
    upcomingAppointments: upcoming,
    cancelledAppointments: cancelled,
    noShowAppointments: noShow,
    lifetimeRevenue: revenue,
    completionRate: decided > 0 ? Math.round((completed / decided) * 1000) / 10 : 0,
    noShowRate: decided > 0 ? Math.round((noShow / decided) * 1000) / 10 : 0,
  };
}

export async function getEmployeeProfile(
  businessId: string,
  staffId: string,
): Promise<EmployeeProfile | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("staff")
    .select(
      `*,
      department:departments(id, name, color),
      location:locations(id, name),
      staff_services(service_id)`,
    )
    .eq("id", staffId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error("[employees] get profile:", error.message);
    return null;
  }

  const record = row as Record<string, unknown>;
  const role = asRole(record.role_key);
  const permissions = parsePermissions(record.permissions);
  const effectivePermissions =
    permissions.length > 0 ? permissions : permissionsForRole(role);

  let locationAssignments: StaffLocationAssignment[] = [];
  const { data: locRows } = await supabase
    .from("staff_locations")
    .select("location_id, is_primary, location:locations(id, name)")
    .eq("staff_id", staffId);

  if (locRows) {
    locationAssignments = locRows.map((item) => {
      const loc = item.location as { id: string; name: string } | { id: string; name: string }[] | null;
      const location = Array.isArray(loc) ? loc[0] : loc;
      return {
        location_id: item.location_id as string,
        is_primary: Boolean(item.is_primary),
        location: location ?? null,
      };
    });
  }

  if (locationAssignments.length === 0 && record.location_id) {
    locationAssignments = [
      {
        location_id: String(record.location_id),
        is_primary: true,
        location: (record.location as { id: string; name: string }) ?? null,
      },
    ];
  }

  const [{ data: hours }, { data: vacations }, { data: documents }, { data: activity }, { data: blocks }] =
    await Promise.all([
      supabase
        .from("staff_working_hours")
        .select("*")
        .eq("staff_id", staffId)
        .order("day_of_week"),
      supabase
        .from("staff_vacations")
        .select("*")
        .eq("staff_id", staffId)
        .order("start_date", { ascending: false }),
      supabase
        .from("staff_documents")
        .select("*")
        .eq("staff_id", staffId)
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
      supabase
        .from("staff_activity")
        .select("*")
        .eq("staff_id", staffId)
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("availability")
        .select("id, start_time, end_time, is_available, notes")
        .eq("staff_id", staffId)
        .eq("business_id", businessId)
        .order("start_time", { ascending: false })
        .limit(40),
    ]);

  const performance = await computePerformance(businessId, staffId);
  const dept = record.department as
    | { id: string; name: string; color: string }
    | { id: string; name: string; color: string }[]
    | null;

  return {
    id: String(record.id),
    business_id: String(record.business_id),
    location_id: String(record.location_id),
    name: String(record.name),
    email: (record.email as string) ?? null,
    phone: (record.phone as string) ?? null,
    title: (record.title as string) ?? null,
    photo_url: (record.photo_url as string) ?? null,
    biography: (record.biography as string) ?? null,
    qualifications: (record.qualifications as string) ?? null,
    color: String(record.color ?? "#3b82f6"),
    is_active: Boolean(record.is_active),
    department_id: (record.department_id as string) ?? null,
    employment_status: asEmploymentStatus(record.employment_status),
    role_key: role,
    permissions: effectivePermissions,
    hire_date: (record.hire_date as string) ?? null,
    termination_date: (record.termination_date as string) ?? null,
    notes: (record.notes as string) ?? null,
    emergency_contact_name: (record.emergency_contact_name as string) ?? null,
    emergency_contact_phone: (record.emergency_contact_phone as string) ?? null,
    emergency_contact_relationship:
      (record.emergency_contact_relationship as string) ?? null,
    pay_type: asPayType(record.pay_type),
    hourly_rate_cents: (record.hourly_rate_cents as number) ?? null,
    salary_cents: (record.salary_cents as number) ?? null,
    commission_rate_bps: (record.commission_rate_bps as number) ?? null,
    payroll_notes: (record.payroll_notes as string) ?? null,
    user_id: (record.user_id as string) ?? null,
    created_at: String(record.created_at),
    updated_at: String(record.updated_at),
    department: Array.isArray(dept) ? dept[0] : dept,
    location: (record.location as { id: string; name: string }) ?? null,
    staff_services: (record.staff_services as { service_id: string }[]) ?? [],
    staff_locations: locationAssignments,
    hours: (hours as EmployeeProfile["hours"]) ?? [],
    vacations: (vacations as EmployeeProfile["vacations"]) ?? [],
    documents: (documents as StaffDocument[]) ?? [],
    activity: (activity ?? []).map((item) =>
      mapActivity(item as Record<string, unknown>),
    ),
    performance,
    availabilityBlocks: (blocks as EmployeeProfile["availabilityBlocks"]) ?? [],
  };
}
