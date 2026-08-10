/**
 * Future API channel adapter.
 * Status: FUTURE — intent builders only; do not invent rules.
 */
import type { BookingIntent, PreviewSlotsInput } from "@/lib/booking-engine/types";

export const API_ADAPTER_STATUS = "FUTURE" as const;

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
