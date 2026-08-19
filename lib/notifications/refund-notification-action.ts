/**
 * Communications action availability for refund emails.
 * Client-safe — no server imports.
 */

import { isResendActionStatus } from "@/lib/notifications/booking-channel-status";
import {
  bookingChannelNotificationFeedback,
  bookingNotificationSendKind,
} from "@/lib/notifications/booking-notification-feedback";
import type { NotificationChannelStatus } from "@/lib/notifications/status-labels";

export const BUSINESS_REFUND_SENT_MESSAGE =
  "Business refund notification sent.";
export const BUSINESS_REFUND_RESENT_MESSAGE =
  "Business refund notification resent.";

export type BusinessRefundSendKind = "first" | "resend";

/**
 * First send vs explicit resend from recorded delivery truth *before* this attempt.
 * A prior Sent record means this click is a resend. Not requested / failed /
 * skipped / never-sent remain a first send until a successful delivery exists.
 */
export function businessRefundSendKind(input: {
  priorRecordedSent: boolean;
}): BusinessRefundSendKind {
  return bookingNotificationSendKind(input);
}

export function businessRefundNotificationFeedback(input: {
  kind: BusinessRefundSendKind;
  resultStatus: string;
  detail?: string | null;
}): { success?: string; error?: string } {
  return bookingChannelNotificationFeedback({
    channel: "business_refund_email",
    kind: input.kind,
    resultStatus: input.resultStatus,
    detail: input.detail,
  });
}

export type RefundNotificationAction = {
  canRetry: boolean;
  actionLabel: string | null;
};

/**
 * First send is available when a succeeded refund exists, a business
 * recipient is resolved, email is configured, and delivery was never recorded.
 * Explicit resend is available after a recorded send or failed attempt.
 * Loading status never auto-sends.
 */
export function businessRefundNotificationAction(input: {
  refundExists: boolean;
  status: NotificationChannelStatus;
  hasRecipient: boolean;
  emailConfigured: boolean;
}): RefundNotificationAction {
  if (!input.refundExists) {
    return { canRetry: false, actionLabel: null };
  }
  if (
    !input.hasRecipient ||
    input.status === "no_recipient" ||
    input.status === "not_applicable"
  ) {
    return { canRetry: false, actionLabel: null };
  }
  if (!input.emailConfigured) {
    return { canRetry: false, actionLabel: null };
  }
  if (
    input.status === "not_requested" ||
    input.status === "skipped" ||
    input.status === "not_recorded"
  ) {
    return {
      canRetry: true,
      actionLabel: "Send business refund notification",
    };
  }
  if (isResendActionStatus(input.status)) {
    return {
      canRetry: true,
      actionLabel: "Resend business refund notification",
    };
  }
  return { canRetry: false, actionLabel: null };
}
