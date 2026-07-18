/**
 * Communications Platform contracts.
 * All outbound email/SMS/notifications flow through this module.
 */

export type CommChannel = "email" | "sms" | "in_app";

export type DeliveryStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "failed"
  | "retrying"
  | "cancelled"
  | "skipped";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type EmailTemplateKey =
  | "appointment.confirmation"
  | "appointment.reminder"
  | "appointment.reschedule"
  | "appointment.cancellation"
  | "commerce.invoice"
  | "commerce.receipt"
  | "commerce.deposit_request"
  | "auth.welcome"
  | "auth.password_reset"
  | "staff.invitation"
  | "business.invitation"
  | "marketing.campaign"
  | "appointment.staff"
  | "appointment.business"
  | "custom";

export type SmsTemplateKey =
  | "appointment.reminder"
  | "appointment.confirmation"
  | "appointment.cancellation"
  | "appointment.reschedule"
  | "commerce.deposit_reminder"
  | "appointment.late_arrival"
  | "custom";

export type RenderedTemplate = {
  key: string;
  subject?: string;
  html?: string;
  text: string;
};

export type BrandingContext = {
  businessName: string;
  primaryColor?: string | null;
  logoUrl?: string | null;
  supportEmail?: string | null;
  optOutFooter?: string | null;
};

export type AppointmentTemplateContext = {
  businessId: string;
  businessName: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerId?: string | null;
  staffName: string;
  serviceName: string;
  startTime: string;
  endTime?: string | null;
  appointmentId?: string;
  notes?: string | null;
  amountCents?: number | null;
  invoiceNumber?: string | null;
  receiptNumber?: string | null;
  previousStartTime?: string | null;
  customMessage?: string | null;
  branding?: BrandingContext;
};

export type QueueNotificationInput = {
  businessId: string;
  channel: CommChannel;
  templateKey: string;
  recipient?: string;
  appointmentId?: string;
  customerId?: string | null;
  payload?: Record<string, unknown>;
  scheduledAt?: Date;
  maxAttempts?: number;
  priority?: NotificationPriority;
};

export type SendResult = {
  ok: boolean;
  skipped?: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
};

export type CommunicationsPreferences = {
  businessId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  marketingEmailEnabled: boolean;
  reminderHoursBefore: number;
  notificationEmail: string | null;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  optOutFooter: string | null;
};

export type CustomerCommPreferences = {
  customerId: string;
  email: boolean;
  sms: boolean;
  marketing: boolean;
  preferredMethod: string | null;
};

export type ChaseCommunicationsMetrics = {
  sentToday: number;
  failedToday: number;
  deliverySuccessRate: number | null;
  smsFailures: number;
  unsentQueued: number;
  bounceOrFailRate: number | null;
};

export type NotificationCenterItem = {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};
