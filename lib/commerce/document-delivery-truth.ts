/**
 * Phase 6.2B — never present Sent unless delivery was actually recorded.
 * Queued / pending / unknown are not Sent. Email failure must not imply
 * the commerce action was rolled back.
 */

export type CommerceDeliveryStatus =
  | "sent"
  | "failed"
  | "no_recipient"
  | "never_sent"
  | "queued";

export function recordedDeliveryStatus(input: {
  hasRecipient: boolean;
  logStatus?: string | null;
  rowEmailStatus?: string | null;
}): CommerceDeliveryStatus {
  if (!input.hasRecipient) return "no_recipient";
  const log = String(input.logStatus ?? "").toLowerCase();
  if (log === "sent" || log === "delivered") return "sent";
  if (log === "failed") return "failed";
  const row = String(input.rowEmailStatus ?? "").toLowerCase();
  if (row === "sent") return "sent";
  if (row === "failed") return "failed";
  if (row === "queued") return "queued";
  return "never_sent";
}

export function deliveryStatusLabel(status: CommerceDeliveryStatus): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "no_recipient":
      return "No recipient";
    case "queued":
      return "Queued";
    default:
      return "Never sent";
  }
}

export function isRecordedSent(status: CommerceDeliveryStatus): boolean {
  return status === "sent";
}
