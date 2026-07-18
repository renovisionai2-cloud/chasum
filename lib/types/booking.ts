export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type PublicBookingMode =
  | "staff_only"
  | "request_approval"
  | "public"
  | "invite_only";

export const PUBLIC_BOOKING_MODES: {
  value: PublicBookingMode;
  label: string;
  description: string;
}[] = [
  {
    value: "public",
    label: "Public booking",
    description: "Anyone with your link can book available times.",
  },
  {
    value: "request_approval",
    label: "Request approval",
    description: "Clients submit requests; you confirm before they are final.",
  },
  {
    value: "staff_only",
    label: "Staff only",
    description: "No public booking — schedule from the dashboard only.",
  },
  {
    value: "invite_only",
    label: "Invite only",
    description: "Public page requires your invite code in the URL.",
  },
];

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
  subscription_status?:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "paused";
  billing_interval?: "monthly" | "yearly";
  trial_starts_at?: string | null;
  trial_ends_at?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  booking_policy?: string | null;
  description?: string | null;
  industry?: string | null;
  tax_number?: string | null;
  currency?: string;
  legal_name?: string | null;
  business_type?: string | null;
  language?: string;
  favicon_url?: string | null;
  brand_color?: string;
  accent_color?: string;
  email_signature?: string | null;
  booking_page_branding?: Record<string, unknown> | null;
  min_notice_minutes?: number;
  cancellation_window_hours?: number;
  reschedule_policy?: string | null;
  allow_double_booking?: boolean;
  waitlist_enabled?: boolean;
  online_booking_enabled?: boolean;
  booking_confirmation_mode?: "auto" | "manual" | "request_approval";
  owner_notifications_enabled?: boolean;
  staff_notifications_enabled?: boolean;
  email_notifications_enabled?: boolean;
  sms_notifications_enabled?: boolean;
  reminder_hours_before?: number;
  notification_email?: string | null;
  ai_settings?: Record<string, unknown> | null;
  public_booking_mode?: PublicBookingMode;
  booking_invite_code?: string | null;
  social_links?: BusinessSocialLinks | null;
  created_at: string;
  updated_at: string;
};

export type BusinessSocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
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
  monthly_price_cents?: number | null;
  yearly_price_cents?: number | null;
  sort_order?: number;
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
  category_id?: string | null;
  duration_minutes: number;
  cleanup_minutes?: number;
  price: number;
  color: string;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  is_active: boolean;
  online_booking: boolean;
  taxable?: boolean;
  deposit_required?: boolean;
  deposit_cents?: number;
  tax_rate_bps?: number;
  sort_order?: number;
  booking_visibility?: "online" | "hidden" | "internal";
  confirmation_mode?: "inherit" | "auto_confirm" | "require_approval";
  online_payment_required?: boolean;
  max_appointments_per_day?: number | null;
  min_booking_notice_minutes?: number | null;
  max_booking_days_ahead?: number | null;
  image_url?: string | null;
  preparation_instructions: string | null;
  internal_notes: string | null;
  cancellation_policy: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceLocationAssignment = {
  service_id: string;
  location_id: string;
  is_primary: boolean;
};

export type ServiceStaffAssignment = {
  service_id: string;
  staff_id: string;
  price_override: number | null;
};

export type ServiceBlackout = {
  id: string;
  business_id: string;
  service_id: string;
  location_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};

export type Staff = {
  id: string;
  business_id: string;
  location_id: string;
  default_location_id?: string | null;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  email: string | null;
  phone?: string | null;
  title: string | null;
  photo_url: string | null;
  biography: string | null;
  qualifications: string | null;
  color: string;
  is_active: boolean;
  department_id?: string | null;
  employment_status?: string;
  role_key?: string;
  custom_role_id?: string | null;
  permissions?: string[];
  hire_date?: string | null;
  termination_date?: string | null;
  notes?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  pay_type?: string;
  hourly_rate_cents?: number | null;
  salary_cents?: number | null;
  commission_rate_bps?: number | null;
  payroll_notes?: string | null;
  user_id?: string | null;
  max_appointments_per_day?: number | null;
  min_break_minutes?: number;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  accept_online_bookings?: boolean;
  accept_new_clients?: boolean;
  accept_walk_ins?: boolean;
  priority_scheduling?: number;
  overtime_eligible?: boolean;
  created_at: string;
  updated_at: string;
};

export type StaffDocument = {
  id: string;
  business_id: string;
  staff_id: string;
  name: string;
  category?: string;
  file_url: string;
  file_type: string | null;
  expires_on?: string | null;
  issued_by?: string | null;
  created_at: string;
};

export type StaffWithServices = Staff & {
  staff_services: {
    service_id: string;
    price_override?: number | null;
    duration_override_minutes?: number | null;
  }[];
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
  lunch_start_time?: string | null;
  lunch_end_time?: string | null;
  overtime_eligible?: boolean;
};

export type StaffVacation = {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  kind?: string;
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
  address?: string | null;
  notes: string | null;
  tags: string[];
  referral_source: string | null;
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  photo_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  preferred_communication_method?: string | null;
  crm_status?: string;
  assigned_staff_id?: string | null;
  preferred_location_id?: string | null;
  is_vip?: boolean;
  anniversary_date?: string | null;
  loyalty_status?: string;
  marketing_consent?: boolean;
  marketing_consent_at?: string | null;
  membership_id?: string | null;
  last_activity_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerDocumentCategory =
  | "general"
  | "waiver"
  | "consent"
  | "intake"
  | "photo"
  | "id"
  | "insurance"
  | "other";

export type CustomerDocument = {
  id: string;
  business_id: string;
  customer_id: string;
  name: string;
  file_url: string;
  file_type: string | null;
  category?: CustomerDocumentCategory | string | null;
  signature_status?: string | null;
  signed_at?: string | null;
  created_at: string;
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
  recurring_rule_id?: string | null;
  external_event_id?: string | null;
  room_id?: string | null;
  color?: string | null;
  price_cents?: number | null;
  tax_cents?: number;
  discount_cents?: number;
  deposit_cents?: number;
  invoice_number?: string | null;
  internal_notes?: string | null;
  custom_fields?: Record<string, unknown>;
  travel_minutes?: number;
  timezone?: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentWithRelations = Appointment & {
  service: Pick<Service, "id" | "name" | "color" | "duration_minutes" | "buffer_before_minutes" | "buffer_after_minutes">;
  staff: Pick<Staff, "id" | "name" | "color" | "photo_url">;
  customer: Pick<Customer, "id" | "name" | "email" | "phone">;
  location?: Pick<Location, "id" | "name">;
};

export type CalendarView =
  | "day"
  | "week"
  | "month"
  | "agenda"
  | "timeline"
  | "resource"
  | "locations"
  | "employees";

export type ActionState = {
  error?: string;
  success?: string;
};

export type PublicBookingSummary = {
  serviceName: string;
  staffName: string;
  locationName: string | null;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  durationMinutes: number;
  price: number;
};

export type PublicBookingState = ActionState & {
  appointmentId?: string;
  reference?: string;
  summary?: PublicBookingSummary;
  emailQueued?: boolean;
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
  "Medical",
  "Massage",
  "Hair",
  "Automotive",
  "Photography",
  "Cleaning",
  "Ultrasound",
  "Consultation",
  "Treatment",
  "Follow-up",
  "Package",
  "Other",
] as const;

export const SERVICE_CATEGORY_PRESETS: {
  name: string;
  icon: string;
  color: string;
}[] = [
  { name: "Medical", icon: "stethoscope", color: "#2563EB" },
  { name: "Massage", icon: "sparkles", color: "#7C3AED" },
  { name: "Hair", icon: "scissors", color: "#DB2777" },
  { name: "Automotive", icon: "wrench", color: "#EA580C" },
  { name: "Photography", icon: "camera", color: "#0891B2" },
  { name: "Cleaning", icon: "sparkle", color: "#16A34A" },
  { name: "General", icon: "layers", color: "#64748B" },
];

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
