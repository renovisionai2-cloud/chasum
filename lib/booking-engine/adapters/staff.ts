/**
 * Staff / calendar channel adapter.
 * Server actions should call BookingFacade; this helper builds intents.
 */
import type {
  BookingIntent,
  CancelIntent,
  RescheduleIntent,
  ResizeIntent,
  UpdateBookingIntent,
} from "@/lib/booking-engine/types";

export function staffCreateIntent(
  input: Omit<BookingIntent, "channel">,
): BookingIntent {
  return { ...input, channel: "staff" };
}

export function receptionCreateIntent(
  input: Omit<BookingIntent, "channel">,
): BookingIntent {
  return { ...input, channel: "reception" };
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
