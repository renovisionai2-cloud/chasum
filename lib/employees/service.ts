import {
  composeDisplayName,
  isEmployeeRoleKey,
  parsePermissions,
  permissionsForRole,
  type EmployeeRoleKey,
  type EmploymentStatus,
  type PayType,
  type VacationKind,
} from "@/lib/employees/roles";
import type {
  CustomRole,
  Department,
  EmployeePerformance,
  EmployeeProfile,
  StaffActivityEvent,
  StaffClosure,
  StaffHourSegment,
  StaffLocationAssignment,
  StaffServiceAssignment,
} from "@/lib/employees/types";
import {
  appointmentRecognizedCents,
  isActiveBooking,
} from "@/lib/commerce/recognize";
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/supabase/errors";
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
  if (value === "staff") return "employee";
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

export function mapCustomRole(row: Record<string, unknown>): CustomRole {
  return {
    id: String(row.id),
    business_id: String(row.business_id),
    key: String(row.key),
    label: String(row.label),
    description: (row.description as string) ?? null,
    permissions: parsePermissions(row.permissions),
    is_active: Boolean(row.is_active ?? true),
    sort_order: Number(row.sort_order ?? 0),
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
    logQueryError("employees/list-departments", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapDepartment(row as Record<string, unknown>));
}

export async function listCustomRoles(businessId: string): Promise<CustomRole[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_roles")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    logQueryError("employees/list-custom-roles", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapCustomRole(row as Record<string, unknown>));
}

async function computePerformance(
  businessId: string,
  staffId: string,
): Promise<EmployeePerformance> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "status, start_time, price_cents, amount_paid_cents, deposit_cents, payment_status, service:services(price)",
    )
    .eq("business_id", businessId)
    .eq("staff_id", staffId);

  if (error || !data) {
    // Compat: older schemas without commerce columns.
    const fallback = await supabase
      .from("appointments")
      .select("status, start_time, service:services(price)")
      .eq("business_id", businessId)
      .eq("staff_id", staffId);
    if (fallback.error || !fallback.data) return emptyPerformance();
    return computeFromRows(
      fallback.data as {
        status: string;
        start_time: string;
        service: { price?: number } | null;
      }[],
    );
  }

  return computeFromRows(
    data as {
      status: string;
      start_time: string;
      price_cents?: number | null;
      amount_paid_cents?: number | null;
      deposit_cents?: number | null;
      payment_status?: string | null;
      service: { price?: number } | null;
    }[],
  );
}

function computeFromRows(
  data: {
    status: string;
    start_time: string;
    price_cents?: number | null;
    amount_paid_cents?: number | null;
    deposit_cents?: number | null;
    payment_status?: string | null;
    service: { price?: number } | null;
  }[],
): EmployeePerformance {
  const now = Date.now();
  let completed = 0;
  let upcoming = 0;
  let cancelled = 0;
  let noShow = 0;
  let revenue = 0;
  let booked = 0;

  for (const row of data) {
    const status = row.status as string;
    const start = new Date(row.start_time as string).getTime();
    if (status === "cancelled") {
      cancelled += 1;
      continue;
    }
    if (status === "no_show") {
      noShow += 1;
      continue;
    }

    if (isActiveBooking(status)) booked += 1;
    if (status === "completed") completed += 1;
    else if (start >= now) upcoming += 1;

    revenue += appointmentRecognizedCents(row) / 100;
  }

  const decided = completed + cancelled + noShow;
  return {
    completedAppointments: Math.max(completed, booked),
    upcomingAppointments: upcoming,
    cancelledAppointments: cancelled,
    noShowAppointments: noShow,
    lifetimeRevenue: revenue,
    completionRate: decided > 0 ? Math.round((completed / decided) * 1000) / 10 : 0,
    noShowRate: decided > 0 ? Math.round((noShow / decided) * 1000) / 10 : 0,
  };
}

/** Structured employee payload for Summer / Chase (no AI calls). */
export function toEmployeeAiExport(profile: EmployeeProfile) {
  return {
    id: profile.id,
    displayName: composeDisplayName(profile),
    firstName: profile.first_name,
    lastName: profile.last_name,
    preferredName: profile.preferred_name,
    title: profile.title,
    email: profile.email,
    phone: profile.phone,
    isActive: profile.is_active,
    employmentStatus: profile.employment_status,
    role: profile.role_key,
    color: profile.color,
    hireDate: profile.hire_date,
    primaryLocationId: profile.location_id,
    defaultLocationId: profile.default_location_id,
    locationIds: profile.staff_locations.map((l) => l.location_id),
    services: profile.staff_services.map((s) => ({
      serviceId: s.service_id,
      priceOverride: s.price_override,
      durationOverrideMinutes: s.duration_override_minutes,
    })),
    workingHours: profile.hours.map((h) => ({
      dayOfWeek: h.day_of_week,
      isWorking: h.is_working,
      startTime: String(h.start_time).slice(0, 5),
      endTime: String(h.end_time).slice(0, 5),
      lunchStart: h.lunch_start_time
        ? String(h.lunch_start_time).slice(0, 5)
        : null,
      lunchEnd: h.lunch_end_time ? String(h.lunch_end_time).slice(0, 5) : null,
      overtimeEligible: Boolean(h.overtime_eligible),
    })),
    hourSegments: profile.hour_segments.map((s) => ({
      dayOfWeek: s.day_of_week,
      startTime: String(s.start_time).slice(0, 5),
      endTime: String(s.end_time).slice(0, 5),
      type: s.segment_type,
    })),
    vacations: profile.vacations.map((v) => ({
      startDate: v.start_date,
      endDate: v.end_date,
      kind: (v.kind as VacationKind | undefined) ?? "vacation",
      reason: v.reason,
    })),
    closures: profile.closures.map((c) => ({
      startsAt: c.starts_at,
      endsAt: c.ends_at,
      reason: c.reason,
    })),
    bookingRules: profile.booking_rules,
    performance: {
      completedAppointments: profile.performance.completedAppointments,
      lifetimeRevenue: profile.performance.lifetimeRevenue,
      completionRate: profile.performance.completionRate,
      noShowRate: profile.performance.noShowRate,
      upcomingAppointments: profile.performance.upcomingAppointments,
    },
  };
}

export async function getEmployeeProfile(
  businessId: string,
  staffId: string,
): Promise<EmployeeProfile | null> {
  const supabase = await createClient();

  let { data: row, error } = await supabase
    .from("staff")
    .select(
      `*,
      department:departments(id, name, color),
      location:locations!staff_location_id_fkey(id, name),
      staff_services(service_id, price_override, duration_override_minutes)`,
    )
    .eq("id", staffId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    const retry = await supabase
      .from("staff")
      .select(
        `*,
        department:departments(id, name, color),
        location:locations!staff_location_id_fkey(id, name),
        staff_services(service_id)`,
      )
      .eq("id", staffId)
      .eq("business_id", businessId)
      .maybeSingle();
    row = retry.data;
    error = retry.error;
  }

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
      const loc = item.location as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
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

  const [
    { data: hours },
    { data: vacations },
    { data: documents },
    { data: activity },
    { data: blocks },
    segmentsRes,
    closuresRes,
  ] = await Promise.all([
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
    supabase
      .from("staff_hour_segments")
      .select("*")
      .eq("staff_id", staffId)
      .order("day_of_week")
      .order("sort_order"),
    supabase
      .from("staff_closures")
      .select("*")
      .eq("staff_id", staffId)
      .eq("business_id", businessId)
      .order("starts_at", { ascending: false }),
  ]);

  const hourSegments: StaffHourSegment[] = segmentsRes.error
    ? []
    : ((segmentsRes.data ?? []) as StaffHourSegment[]);
  const closures: StaffClosure[] = closuresRes.error
    ? []
    : ((closuresRes.data ?? []) as StaffClosure[]);

  const performance = await computePerformance(businessId, staffId);
  const dept = record.department as
    | { id: string; name: string; color: string }
    | { id: string; name: string; color: string }[]
    | null;

  const serviceLinks = (record.staff_services as StaffServiceAssignment[] | null) ?? [];

  return {
    id: String(record.id),
    business_id: String(record.business_id),
    location_id: String(record.location_id),
    default_location_id: (record.default_location_id as string) ?? null,
    name: String(record.name),
    first_name: (record.first_name as string) ?? null,
    last_name: (record.last_name as string) ?? null,
    preferred_name: (record.preferred_name as string) ?? null,
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
    custom_role_id: (record.custom_role_id as string) ?? null,
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
    booking_rules: {
      max_appointments_per_day:
        (record.max_appointments_per_day as number | null) ?? null,
      min_break_minutes: Number(record.min_break_minutes ?? 0),
      buffer_before_minutes: Number(record.buffer_before_minutes ?? 0),
      buffer_after_minutes: Number(record.buffer_after_minutes ?? 0),
      accept_online_bookings: record.accept_online_bookings !== false,
      accept_new_clients: record.accept_new_clients !== false,
      accept_walk_ins: record.accept_walk_ins !== false,
      priority_scheduling: Number(record.priority_scheduling ?? 0),
      overtime_eligible: Boolean(record.overtime_eligible),
    },
    created_at: String(record.created_at),
    updated_at: String(record.updated_at),
    department: Array.isArray(dept) ? dept[0] : dept,
    location: (record.location as { id: string; name: string }) ?? null,
    staff_services: serviceLinks.map((link) => ({
      service_id: link.service_id,
      price_override:
        link.price_override == null ? null : Number(link.price_override),
      duration_override_minutes:
        link.duration_override_minutes == null
          ? null
          : Number(link.duration_override_minutes),
    })),
    staff_locations: locationAssignments,
    hours: (hours as EmployeeProfile["hours"]) ?? [],
    hour_segments: hourSegments,
    vacations: (vacations as EmployeeProfile["vacations"]) ?? [],
    closures,
    documents: (documents as StaffDocument[]) ?? [],
    activity: (activity ?? []).map((item) =>
      mapActivity(item as Record<string, unknown>),
    ),
    performance,
    availabilityBlocks: (blocks as EmployeeProfile["availabilityBlocks"]) ?? [],
  };
}
