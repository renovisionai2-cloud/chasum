/**
 * Summer AI adapter.
 * Summer MUST call BookingFacade only — never insert into Supabase directly,
 * never calculate slots locally.
 * Status: ACTIVE (wrappers); new write product enablement is not Phase 5.0 scope.
 */
import { BookingFacade } from "@/lib/booking-engine/facade";
import type {
  BookingIntent,
  CancelIntent,
  PreviewSlotsInput,
  RescheduleIntent,
  ResizeIntent,
  UpdateBookingIntent,
} from "@/lib/booking-engine/types";

export const SUMMER_ADAPTER_STATUS = "ACTIVE" as const;

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
  return BookingFacade.create(summerCreateIntent(input));
}

export async function summerUpdateBooking(
  input: Omit<UpdateBookingIntent, "channel">,
) {
  return BookingFacade.update({ ...input, channel: "summer" });
}

export async function summerRescheduleBooking(
  input: Omit<RescheduleIntent, "channel">,
) {
  return BookingFacade.reschedule({ ...input, channel: "summer" });
}

export async function summerResizeBooking(
  input: Omit<ResizeIntent, "channel">,
) {
  return BookingFacade.resize({ ...input, channel: "summer" });
}

export async function summerCancelBooking(
  input: Omit<CancelIntent, "channel">,
) {
  return BookingFacade.cancel({ ...input, channel: "summer" });
}

export async function summerPreviewAvailableSlots(
  input: Omit<PreviewSlotsInput, "channel">,
) {
  return BookingFacade.previewSlots(summerPreviewInput(input));
}

export async function summerValidateBooking(
  input: Omit<BookingIntent, "channel">,
) {
  return BookingFacade.validate(summerCreateIntent(input));
}
