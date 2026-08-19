/**
 * Client-safe notification status labels (no server imports).
 */

export type BookingNotificationChannel =
  | "customer_email"
  | "customer_sms"
  | "business_email"
  | "staff_email"
  | "payment_receipt"
  | "customer_refund_email"
  | "business_refund_email";

export type NotificationChannelStatus =
  | "sent"
  | "delivered"
  | "pending"
  | "queued"
  | "failed"
  | "not_enabled"
  | "not_configured"
  | "not_included"
  | "no_recipient"
  | "skipped"
  | "not_requested"
  | "not_recorded"
  | "not_applicable";

export function formatNotificationStatus(
  status: NotificationChannelStatus,
): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "delivered":
      return "Delivered";
    case "pending":
      return "Pending";
    case "queued":
      return "Queued";
    case "failed":
      return "Failed";
    case "not_enabled":
      return "Not enabled";
    case "not_configured":
      return "Not configured";
    case "not_included":
      return "Not included in plan";
    case "no_recipient":
      return "No recipient";
    case "skipped":
      return "Skipped";
    case "not_requested":
      return "Not requested";
    case "not_recorded":
      return "Not recorded";
    case "not_applicable":
      return "Not applicable";
  }
}
