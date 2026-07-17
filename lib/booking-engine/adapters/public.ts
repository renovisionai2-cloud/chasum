/**
 * Public booking channel adapter.
 * Public UI / bookAppointment must use BookingFacade — never invent slots.
 */
import type { BookingIntent, PreviewSlotsInput } from "@/lib/booking-engine/types";

export function publicCreateIntent(
  input: Omit<BookingIntent, "channel">,
): BookingIntent {
  return { ...input, channel: "public" };
}

export function publicPreviewInput(
  input: Omit<PreviewSlotsInput, "channel">,
): PreviewSlotsInput {
  return { ...input, channel: "public" };
}
