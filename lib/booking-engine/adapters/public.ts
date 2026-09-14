/**
 * Public booking channel adapter.
 * Public UI / bookAppointment must use BookingFacade — never invent slots.
 *
 * Privileged persistence is explicit: only this adapter constructs the
 * public_rpc strategy. Channel "public" alone does not bypass RLS.
 */
import type { PublicRpcBookingPersistence } from "@/lib/booking-engine/persistence";
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

/** Trusted public server boundary only — do not use from API or Summer. */
export function publicBookingPersistence(input: {
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
}): PublicRpcBookingPersistence {
  return {
    kind: "public_rpc",
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
  };
}
