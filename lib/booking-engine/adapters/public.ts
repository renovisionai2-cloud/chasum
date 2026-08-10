/**
 * Public booking channel adapter.
 * Public UI / bookAppointment must use BookingFacade — never invent slots.
 * Status: PARTIAL — preview via facade; named-staff create may still use create_public_appointment.
 */
import type { BookingIntent, PreviewSlotsInput } from "@/lib/booking-engine/types";

export const PUBLIC_ADAPTER_STATUS = "PARTIAL" as const;

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
