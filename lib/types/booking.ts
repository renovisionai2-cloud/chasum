export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  timezone: string;
  appointment_interval_minutes: number;
  booking_limit_days: number;
  cancellation_policy: string | null;
  max_daily_bookings: number | null;
  subscription_plan_key?: string;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  timezone: string | null;
  is_default: boolean;
  is_active: boolean;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LocationSettings = {
  location_id: string;
  appointment_interval_minutes: number;
  booking_limit_days: number;
  max_daily_bookings: number | null;
  cancellation_policy: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LocationHours = {
  id: string;
  location_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
};

export type LocationWithSettings = Location & {
  settings: LocationSettings;
  hours: LocationHours[];
};

export type SubscriptionPlan = {
  plan_key: string;
  name: string;
  max_locations: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type Service = {
  id: string;
  business_id: string;
  location_id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  price: number;
  color: string;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Staff = {
  id: string;
  business_id: string;
  location_id: string;
  name: string;
  email: string | null;
  title: string | null;
  photo_url: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StaffWithServices = Staff & {
  staff_services: { service_id: string }[];
};

export type StaffScheduleMap = Record<
  string,
  { hours: StaffWorkingHours[]; vacations: StaffVacation[] }
>;

export type StaffWorkingHours = {
  id: string;
  staff_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
};

export type StaffVacation = {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
};

export type BusinessHours = {
  id: string;
  business_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
};

export type Holiday = {
  id: string;
  business_id: string;
  location_id: string | null;
  name: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
};

export type Availability = {
  id: string;
  business_id: string;
  location_id: string;
  staff_id: string | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  staff?: Pick<Staff, "id" | "name"> | null;
};

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  business_id: string;
  location_id: string;
  service_id: string;
  staff_id: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentWithRelations = Appointment & {
  service: Pick<Service, "id" | "name" | "color" | "duration_minutes" | "buffer_before_minutes" | "buffer_after_minutes">;
  staff: Pick<Staff, "id" | "name" | "color" | "photo_url">;
  customer: Pick<Customer, "id" | "name" | "email" | "phone">;
  location?: Pick<Location, "id" | "name">;
};

export type CalendarView = "day" | "week" | "month";

export type ActionState = {
  error?: string;
  success?: string;
};

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const SERVICE_CATEGORIES = [
  "General",
  "Consultation",
  "Treatment",
  "Follow-up",
  "Package",
  "Other",
] as const;

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No Show",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "#f59e0b",
  confirmed: "#2563eb",
  cancelled: "#ef4444",
  completed: "#22c55e",
  no_show: "#71717a",
};

export const SERVICE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#4f46e5",
  "#c026d3",
] as const;

export const STAFF_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#d946ef",
] as const;

export const CUSTOMER_TAG_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
] as const;
