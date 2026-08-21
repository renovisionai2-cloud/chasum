/**
 * Explicit booking surface modes — never infer from labels alone.
 */

export type BookingMode =
  | "new"
  | "draft"
  | "confirmed"
  | "edit"
  | "reschedule";

export function bookingModeFromContext(input: {
  appointmentId?: string | null;
  confirmedAppointmentId?: string | null;
  isRescheduleProposal?: boolean;
  hasUnsavedDraft?: boolean;
}): BookingMode {
  if (input.isRescheduleProposal && input.appointmentId) {
    return "reschedule";
  }
  if (input.confirmedAppointmentId) {
    return "confirmed";
  }
  if (input.appointmentId) {
    return "edit";
  }
  if (input.hasUnsavedDraft) {
    return "draft";
  }
  return "new";
}
