export type AppointmentStatus =
  | "scheduled"
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
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Staff = {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  title: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessHours = {
  id: string;
  business_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
};

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  business_id: string;
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
  service: Pick<Service, "id" | "name" | "color" | "duration_minutes">;
  staff: Pick<Staff, "id" | "name" | "color">;
  customer: Pick<Customer, "id" | "name" | "email" | "phone">;
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

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No Show",
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
