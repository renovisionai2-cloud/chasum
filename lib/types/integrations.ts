export type CalendarProvider = "google" | "outlook" | "apple";

export type NotificationChannel = "email" | "sms" | "in_app";

export type NotificationType =
  | "confirmation"
  | "reminder"
  | "cancellation"
  | "reschedule"
  | "staff"
  | "business"
  | "waitlist";

export type DeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type JobType =
  | "email"
  | "sms"
  | "calendar_sync"
  | "webhook"
  | "reminder"
  | "recurring"
  | "waitlist_notify";

export type WaitlistStatus = "waiting" | "notified" | "booked" | "cancelled";

export type RecurrenceFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export type CalendarConnection = {
  id: string;
  business_id: string;
  staff_id: string | null;
  provider: CalendarProvider;
  provider_account_id: string | null;
  provider_calendar_id: string | null;
  calendar_name: string | null;
  sync_enabled: boolean;
  sync_direction: "inbound" | "outbound" | "two_way";
  ics_secret: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ExternalEvent = {
  id: string;
  calendar_connection_id: string;
  appointment_id: string | null;
  external_event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_busy: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  business_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type NotificationLog = {
  id: string;
  business_id: string;
  channel: NotificationChannel;
  recipient: string;
  template_key: string;
  status: DeliveryStatus;
  sent_at: string | null;
  created_at: string;
};

export type ApiKey = {
  id: string;
  business_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type WebhookEndpoint = {
  id: string;
  business_id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
};

export type RecurringRule = {
  id: string;
  business_id: string;
  service_id: string;
  staff_id: string;
  customer_id: string;
  frequency: RecurrenceFrequency;
  interval_count: number;
  day_of_week: number | null;
  start_date: string;
  end_date: string | null;
  max_occurrences: number | null;
  start_time: string;
  notes: string | null;
  active: boolean;
  created_at: string;
};

export type WaitlistEntry = {
  id: string;
  business_id: string;
  service_id: string;
  staff_id: string | null;
  customer_id: string;
  preferred_date: string;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  status: WaitlistStatus;
  notes: string | null;
  created_at: string;
  customer?: { id: string; name: string; email: string; phone: string | null };
  service?: { id: string; name: string };
  staff?: { id: string; name: string } | null;
};

export type BackgroundJob = {
  id: string;
  business_id: string | null;
  job_type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  scheduled_at: string;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_at: string;
};

export type AppointmentNotificationContext = {
  appointmentId: string;
  businessId: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  staffName: string;
  staffEmail: string | null;
  serviceName: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  status: string;
};

export const WEBHOOK_EVENTS = [
  "appointment.created",
  "appointment.updated",
  "appointment.cancelled",
  "appointment.rescheduled",
  "customer.created",
  "waitlist.notified",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const API_SCOPES = ["read", "write", "webhooks"] as const;

export type ApiScope = (typeof API_SCOPES)[number];
