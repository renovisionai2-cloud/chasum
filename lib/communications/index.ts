/**
 * Communications Platform — public API.
 * No module should send email/SMS directly; use these entry points.
 */

export type {
  AppointmentTemplateContext,
  BrandingContext,
  ChaseCommunicationsMetrics,
  CommChannel,
  CommunicationsPreferences,
  CustomerCommPreferences,
  DeliveryStatus,
  EmailTemplateKey,
  NotificationCenterItem,
  NotificationPriority,
  QueueNotificationInput,
  RenderedTemplate,
  SendResult,
  SmsTemplateKey,
} from "@/lib/communications/types";

export { sendEmail, sendSMS } from "@/lib/communications/delivery";

export {
  cancelNotification,
  computeBackoffMs,
  queueNotification,
  retryNotification,
} from "@/lib/communications/queue";

export { previewTemplate } from "@/lib/communications/templates";

export {
  channelAllowed,
  deferPastQuietHours,
  isWithinQuietHours,
  loadBusinessCommPreferences,
  loadCustomerCommPreferences,
} from "@/lib/communications/preferences";

export { getChaseCommunicationsMetrics } from "@/lib/communications/analytics";

export {
  getEmailProvider,
  getSmsProvider,
} from "@/lib/communications/providers";
