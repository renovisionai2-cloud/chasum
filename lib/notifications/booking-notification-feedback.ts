/**
 * First-send vs resend result copy for booking/ops notifications.
 * Client-safe — no server imports.
 */

import type { BookingNotificationChannel } from "@/lib/notifications/status-labels";
import { isRecordedSuccessStatus } from "@/lib/notifications/booking-channel-status";

export type BookingNotificationSendKind = "first" | "resend";

export function bookingNotificationSendKind(input: {
  priorRecordedSent: boolean;
}): BookingNotificationSendKind {
  return input.priorRecordedSent ? "resend" : "first";
}

const CHANNEL_COPY: Partial<
  Record<BookingNotificationChannel, { sent: string; resent: string; failed: string }>
> = {
  customer_email: {
    sent: "Customer confirmation sent.",
    resent: "Customer confirmation resent.",
    failed: "Customer confirmation could not be sent.",
  },
  business_email: {
    sent: "Business confirmation sent.",
    resent: "Business confirmation resent.",
    failed: "Business confirmation could not be sent.",
  },
  staff_email: {
    sent: "Staff notification sent.",
    resent: "Staff notification resent.",
    failed: "Staff notification could not be sent.",
  },
  business_refund_email: {
    sent: "Business refund notification sent.",
    resent: "Business refund notification resent.",
    failed: "Business refund notification could not be sent.",
  },
};

export function bookingChannelNotificationFeedback(input: {
  channel: BookingNotificationChannel;
  kind: BookingNotificationSendKind;
  resultStatus: string;
  detail?: string | null;
}): { success?: string; error?: string } {
  const copy = CHANNEL_COPY[input.channel];
  if (isRecordedSuccessStatus(input.resultStatus)) {
    if (!copy) {
      return {
        success:
          input.kind === "resend"
            ? "Notification resent."
            : "Notification sent.",
      };
    }
    return {
      success: input.kind === "resend" ? copy.resent : copy.sent,
    };
  }
  const detail = String(input.detail ?? "").trim();
  return {
    error: detail || copy?.failed || "Notification could not be sent.",
  };
}
