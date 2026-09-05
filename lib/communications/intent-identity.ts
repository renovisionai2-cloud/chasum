import { createHash, randomUUID } from "node:crypto";

/** Stable occurrence identity; the ledger scopes by tenant/channel/template and binds the recipient. */
function occurrenceId(kind: string, entityId: string): string {
  const bytes = createHash("sha256")
    .update(JSON.stringify(["chasum-send-occurrence-v1", kind, entityId]))
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function initialBookingIntentId(appointmentId: string): string {
  return occurrenceId("booking-created", appointmentId);
}

export function originalReceiptIntentId(receiptId: string): string {
  return occurrenceId("receipt-original", receiptId);
}

/** Repeated scheduling of the same reminder is one occurrence, even across jobs. */
export function scheduledReminderIntentId(appointmentId: string, scheduledAt: Date): string {
  return occurrenceId("appointment-reminder", JSON.stringify([appointmentId, scheduledAt.toISOString()]));
}

/** A retried fanout parent must retain each child communication's identity. */
export function waitlistChildIntentId(parentJobId: string, waitlistEntryId: string): string {
  return occurrenceId("waitlist-child", JSON.stringify([parentJobId, waitlistEntryId]));
}

/** A new business event or explicit resend, never a worker retry. */
export function newSendIntentId(): string {
  return randomUUID();
}
