/**
 * Summer AI adapter.
 * Summer MUST call BookingFacade only — never insert into Supabase directly,
 * never calculate slots locally.
 */
import {
  previewAvailableSlots,
  validateBooking,
} from "@/lib/booking-engine/availability";
import {
  cancelBooking,
  createBooking,
  rescheduleBooking,
  resizeBooking,
  updateBooking,
} from "@/lib/booking-engine/mutations";
import type {
  BookingIntent,
  CancelIntent,
  PreviewSlotsInput,
  RescheduleIntent,
  ResizeIntent,
  UpdateBookingIntent,
} from "@/lib/booking-engine/types";

export function summerCreateIntent(
  input: Omit<BookingIntent, "channel">,
): BookingIntent {
  return { ...input, channel: "summer" };
}

export function summerPreviewInput(
  input: Omit<PreviewSlotsInput, "channel">,
): PreviewSlotsInput {
  return { ...input, channel: "summer" };
}

export async function summerCreateBooking(
  input: Omit<BookingIntent, "channel">,
) {
  return createBooking(summerCreateIntent(input));
}

export async function summerUpdateBooking(
  input: Omit<UpdateBookingIntent, "channel">,
) {
  return updateBooking({ ...input, channel: "summer" });
}

export async function summerRescheduleBooking(
  input: Omit<RescheduleIntent, "channel">,
) {
  return rescheduleBooking({ ...input, channel: "summer" });
}

export async function summerResizeBooking(
  input: Omit<ResizeIntent, "channel">,
) {
  return resizeBooking({ ...input, channel: "summer" });
}

export async function summerCancelBooking(
  input: Omit<CancelIntent, "channel">,
) {
  return cancelBooking({ ...input, channel: "summer" });
}

export async function summerPreviewAvailableSlots(
  input: Omit<PreviewSlotsInput, "channel">,
) {
  return previewAvailableSlots(summerPreviewInput(input));
}

export async function summerValidateBooking(
  input: Omit<BookingIntent, "channel">,
) {
  return validateBooking(summerCreateIntent(input));
}
