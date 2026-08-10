/**
 * Reception channel adapter.
 *
 * Reception is an operational MODE of Calendar — not a separate booking brain.
 * Status: PARTIAL — intent builders are active; many UI paths still tag channel "staff".
 */

import type {
  BookingIntent,
  CancelIntent,
  PreviewSlotsInput,
  RescheduleIntent,
  ResizeIntent,
  UpdateBookingIntent,
} from "@/lib/booking-engine/types";

export const RECEPTION_ADAPTER_STATUS = "PARTIAL" as const;

export function receptionCreateIntent(
  input: Omit<BookingIntent, "channel">,
): BookingIntent {
  return { ...input, channel: "reception" };
}

export function receptionPreviewInput(
  input: Omit<PreviewSlotsInput, "channel">,
): PreviewSlotsInput {
  return { ...input, channel: "reception" };
}

export function receptionUpdateIntent(
  input: Omit<UpdateBookingIntent, "channel">,
): UpdateBookingIntent {
  return { ...input, channel: "reception" };
}

export function receptionRescheduleIntent(
  input: Omit<RescheduleIntent, "channel">,
): RescheduleIntent {
  return { ...input, channel: "reception" };
}

export function receptionResizeIntent(
  input: Omit<ResizeIntent, "channel">,
): ResizeIntent {
  return { ...input, channel: "reception" };
}

export function receptionCancelIntent(
  input: Omit<CancelIntent, "channel">,
): CancelIntent {
  return { ...input, channel: "reception" };
}
