import type { BookingChannel } from "@/lib/booking-engine/types";

/**
 * User-facing booking source for business notifications.
 * Labels match the Booking Sheet channel registry (`Public Booking`, `Reception`).
 * Dashboard create uses intent channel `staff`; the Reception workspace is the
 * established dashboard label.
 */
export function bookingSourceLabel(
  channel?: BookingChannel | null,
): string {
  switch (channel) {
    case "public":
      return "Public Booking";
    case "summer":
      return "Summer";
    case "api":
      return "API";
    case "reception":
    case "staff":
    default:
      return "Reception";
  }
}
