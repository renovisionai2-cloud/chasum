/**
 * Historical communications read-model classification.
 * Client-safe — no server imports. Loading never sends.
 */

import type {
  BookingNotificationChannel,
  NotificationChannelStatus,
} from "@/lib/notifications/status-labels";

/**
 * Map a notification_logs.status value. Unknown raw values fail closed
 * (Failed), never Sent.
 */
export function mapNotificationLogStatus(
  raw: string | null | undefined,
): NotificationChannelStatus {
  const status = String(raw ?? "").toLowerCase();
  if (status === "delivered") return "delivered";
  if (status === "sent") return "sent";
  if (status === "skipped") return "skipped";
  if (status === "queued") return "queued";
  if (status === "pending" || status === "sending") return "pending";
  if (status === "failed") return "failed";
  return "failed";
}

/**
 * Status for a channel that genuinely applies (booking confirmation,
 * staff notification, etc.) when a recipient exists.
 *
 * Missing logs are Not recorded — never Not applicable, and never Skipped
 * unless a log actually recorded a policy skip.
 */
export function historicalApplicableChannelStatus(
  logStatus: string | null | undefined,
): NotificationChannelStatus {
  if (!logStatus) return "not_recorded";
  return mapNotificationLogStatus(logStatus);
}

export function isRecordedSuccessStatus(
  status: NotificationChannelStatus | string,
): boolean {
  return status === "sent" || status === "delivered";
}

/** Prior successful delivery exists → this click is a resend. */
export function isResendActionStatus(
  status: NotificationChannelStatus | string | undefined,
): boolean {
  return (
    status === "sent" ||
    status === "delivered" ||
    status === "failed" ||
    status === "pending" ||
    status === "queued"
  );
}

export function bookingChannelActionLabel(
  channel: BookingNotificationChannel,
  status?: NotificationChannelStatus,
): string {
  const resend = isResendActionStatus(status);
  switch (channel) {
    case "customer_email":
      return resend ? "Resend confirmation" : "Send confirmation";
    case "business_email":
      return resend
        ? "Resend business notification"
        : "Send business notification";
    case "payment_receipt":
      return "Resend payment receipt";
    case "customer_refund_email":
      return resend
        ? "Resend customer refund confirmation"
        : "Send customer refund confirmation";
    case "business_refund_email":
      return resend
        ? "Resend business refund notification"
        : "Send business refund notification";
    case "staff_email":
      return resend ? "Resend staff notification" : "Send staff notification";
    case "customer_sms":
      return resend ? "Resend SMS" : "Send SMS";
    default:
      return resend ? "Resend" : "Send";
  }
}
