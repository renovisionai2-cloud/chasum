/**
 * Booking Sheet channel registry — every surface books through this experience.
 * Mutations still go through Booking Engine / public RPCs; this is the UI contract.
 */

export type BookingSheetChannel =
  | "staff"
  | "reception"
  | "public"
  | "summer"
  | "api"
  | "mobile";

export type BookingSheetMode = "create" | "edit";

export const BOOKING_SHEET_CHANNELS: Record<
  BookingSheetChannel,
  { label: string; usesEngine: boolean; notes: string }
> = {
  staff: {
    label: "Calendar",
    usesEngine: true,
    notes: "createAppointment / updateAppointment → createBooking / updateBooking",
  },
  reception: {
    label: "Reception",
    usesEngine: true,
    notes: "Same staff mutations; channel tag reception in future intents",
  },
  public: {
    label: "Public Booking",
    usesEngine: true,
    notes: "Slots via previewAvailableSlots(public); write via bookAppointment RPC",
  },
  summer: {
    label: "Summer AI",
    usesEngine: true,
    notes: "Must call Summer adapter / Booking Engine — never invent slots",
  },
  api: {
    label: "API",
    usesEngine: true,
    notes: "Server routes validate then mutate; UI sheet not required",
  },
  mobile: {
    label: "Mobile",
    usesEngine: true,
    notes: "Reuses Booking Sheet bottom-sheet layout",
  },
};
