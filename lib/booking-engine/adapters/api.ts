/**
 * Future API channel adapter.
 */
import type { BookingIntent, PreviewSlotsInput } from "@/lib/booking-engine/types";

export function apiCreateIntent(
  input: Omit<BookingIntent, "channel">,
): BookingIntent {
  return { ...input, channel: "api" };
}

export function apiPreviewInput(
  input: Omit<PreviewSlotsInput, "channel">,
): PreviewSlotsInput {
  return { ...input, channel: "api" };
}
