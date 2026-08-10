/**
 * Booking Engine Foundation — public facade.
 *
 * THE only write/read API for bookings across staff, reception, public, Summer, and API.
 * TypeScript orchestrates; SQL RPCs validate.
 *
 * Prefer `BookingFacade` for new call sites (Chapter 5 Phase 5.0 contract).
 * Named function exports remain for existing imports.
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
  SlotAvailabilityReason,
  SlotCandidate,
  SlotWarning,
  UpdateBookingIntent,
  ValidateBookingResult,
} from "@/lib/booking-engine/types";

export { BookingFacade, type BookingFacadeApi } from "@/lib/booking-engine/facade";

export {
  clearAvailabilityCache,
  composeAvailabilityContext,
  distinguishesIntervalFromDuration,
  getAvailabilityExtensions,
  previewAvailableSlots,
  registerAvailabilityExtensions,
  resetAvailabilityExtensions,
  resolveRequestedStatus,
  resolveSchedulingPolicy,
  validateBooking,
  applyPolicyChecks,
  type SchedulingPolicy,
} from "@/lib/booking-engine/availability";

export {
  conflictFromCode,
  explainConflict,
  explainConflicts,
  explanationForCode,
  findRoomConflicts,
  isUnmappedConflict,
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
