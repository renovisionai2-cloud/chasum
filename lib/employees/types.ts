import type {
  EmployeeRoleKey,
  EmploymentStatus,
  PayType,
  PermissionKey,
  VacationKind,
} from "@/lib/employees/roles";
import type {
  StaffDocument,
  StaffVacation,
  StaffWorkingHours,
} from "@/lib/types/booking";

export type Department = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomRole = {
  id: string;
  business_id: string;
  key: string;
  label: string;
  description: string | null;
  permissions: PermissionKey[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type StaffActivityEvent = {
  id: string;
  business_id: string;
  staff_id: string;
  event_type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

export type StaffLocationAssignment = {
  location_id: string;
  is_primary: boolean;
  location?: { id: string; name: string } | null;
};

export type StaffServiceAssignment = {
  service_id: string;
  price_override: number | null;
  duration_override_minutes: number | null;
};

export type StaffHourSegment = {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  segment_type: "work" | "lunch" | "break";
  sort_order: number;
  created_at: string;
};

export type StaffClosure = {
  id: string;
  business_id: string;
  staff_id: string;
  location_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};

export type EmployeePerformance = {
  completedAppointments: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  lifetimeRevenue: number;
  completionRate: number;
  noShowRate: number;
};

export type EmployeeBookingRules = {
  max_appointments_per_day: number | null;
  min_break_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  accept_online_bookings: boolean;
  accept_new_clients: boolean;
  accept_walk_ins: boolean;
  priority_scheduling: number;
  overtime_eligible: boolean;
};

export type EmployeeProfile = {
  id: string;
  business_id: string;
  location_id: string;
  default_location_id: string | null;
  name: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  photo_url: string | null;
  biography: string | null;
  qualifications: string | null;
  color: string;
  is_active: boolean;
  department_id: string | null;
  employment_status: EmploymentStatus;
  role_key: EmployeeRoleKey;
  custom_role_id: string | null;
  permissions: PermissionKey[];
  hire_date: string | null;
  termination_date: string | null;
  notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  pay_type: PayType;
  hourly_rate_cents: number | null;
  salary_cents: number | null;
  commission_rate_bps: number | null;
  payroll_notes: string | null;
  user_id: string | null;
  booking_rules: EmployeeBookingRules;
  created_at: string;
  updated_at: string;
  department?: Pick<Department, "id" | "name" | "color"> | null;
  location?: { id: string; name: string } | null;
  staff_services: StaffServiceAssignment[];
  staff_locations: StaffLocationAssignment[];
  hours: (StaffWorkingHours & {
    lunch_start_time?: string | null;
    lunch_end_time?: string | null;
    overtime_eligible?: boolean;
  })[];
  hour_segments: StaffHourSegment[];
  vacations: (StaffVacation & { kind?: VacationKind })[];
  closures: StaffClosure[];
  documents: StaffDocument[];
  activity: StaffActivityEvent[];
  performance: EmployeePerformance;
  availabilityBlocks: {
    id: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
    notes: string | null;
  }[];
};
