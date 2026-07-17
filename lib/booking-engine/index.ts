/**
 * Booking Engine Foundation — public facade.
 *
 * THE only write/read API for bookings across staff, reception, public, Summer, and API.
 * TypeScript orchestrates; SQL RPCs validate.
 */

export type {
  AppointmentCommercial,
  AvailabilityContext,
  BookingChannel,
  BookingConflict,
  BookingConflictCode,
  BookingConflictReport,
  BookingDomainEvent,
  BookingDomainEventType,
  BookingIntent,
  BookingResource,
  BookingResourceType,
  CalendarViewMode,
  CancelIntent,
  ConflictKind,
  MutationPhase,
  MutationResult,
  PortalAppointment,
  PreviewSlotsInput,
  PreviewSlotsResult,
  RescheduleIntent,
  ResizeIntent,
  SlotCandidate,
  UpdateBookingIntent,
  ValidateBookingResult,
} from "@/lib/booking-engine/types";

export {
  composeAvailabilityContext,
  previewAvailableSlots,
  resolveRequestedStatus,
  validateBooking,
} from "@/lib/booking-engine/availability";

export {
  conflictFromCode,
  findRoomConflicts,
  logAppointmentChange,
  mapRpcErrorToConflict,
  netAppointmentTotalCents,
} from "@/lib/booking-engine/conflicts";

export {
  cancelBooking,
  createBooking,
  rescheduleBooking,
  resizeBooking,
  updateBooking,
} from "@/lib/booking-engine/mutations";

export {
  queryAppointmentsInRange,
  queryUtilizationProjection,
} from "@/lib/booking-engine/queries";

export {
  createBookingEvent,
  emitBookingEvent,
  onBookingEvent,
} from "@/lib/booking-engine/events";

export * from "@/lib/booking-engine/adapters";
