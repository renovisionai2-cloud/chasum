import type {
  EmployeeRoleKey,
  EmploymentStatus,
  PayType,
  PermissionKey,
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

export type EmployeePerformance = {
  completedAppointments: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  lifetimeRevenue: number;
  completionRate: number;
  noShowRate: number;
};

export type EmployeeProfile = {
  id: string;
  business_id: string;
  location_id: string;
  name: string;
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
  created_at: string;
  updated_at: string;
  department?: Pick<Department, "id" | "name" | "color"> | null;
  location?: { id: string; name: string } | null;
  staff_services: { service_id: string }[];
  staff_locations: StaffLocationAssignment[];
  hours: StaffWorkingHours[];
  vacations: StaffVacation[];
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
