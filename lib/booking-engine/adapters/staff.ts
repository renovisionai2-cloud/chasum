/**
 * Staff / calendar channel adapter.
 * Server actions should call BookingFacade; this helper builds intents.
 *
 * Reception intents live in adapters/reception.ts (PARTIAL).
 */
import type {
  BookingIntent,
  CancelIntent,
  PreviewSlotsInput,
  RescheduleIntent,
  ResizeIntent,
  UpdateBookingIntent,
} from "@/lib/booking-engine/types";

export const STAFF_ADAPTER_STATUS = "ACTIVE" as const;

export function staffCreateIntent(
  input: Omit<BookingIntent, "channel">,
): BookingIntent {
  return { ...input, channel: "staff" };
}

export function staffPreviewInput(
  input: Omit<PreviewSlotsInput, "channel">,
): PreviewSlotsInput {
  return { ...input, channel: "staff" };
}

export function staffUpdateIntent(
  input: Omit<UpdateBookingIntent, "channel">,
): UpdateBookingIntent {
  return { ...input, channel: "staff" };
}

export function staffRescheduleIntent(
  input: Omit<RescheduleIntent, "channel">,
): RescheduleIntent {
  return { ...input, channel: "staff" };
}

export function staffResizeIntent(
  input: Omit<ResizeIntent, "channel">,
): ResizeIntent {
  return { ...input, channel: "staff" };
}

export function staffCancelIntent(
  input: Omit<CancelIntent, "channel">,
): CancelIntent {
  return { ...input, channel: "staff" };
}
