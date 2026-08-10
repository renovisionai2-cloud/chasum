/**
 * BookingFacade — the single public booking-engine contract.
 *
 * Surfaces (staff, Reception, public, Summer, future API) converge here.
 * TypeScript orchestrates; Postgres RPCs remain authoritative for slots/conflicts.
 *
 * Method names match the Chapter 5 architecture:
 * previewSlots / create / update / reschedule / resize / cancel
 *
 * Underlying implementations are the existing engine functions — no second slot engine.
 */

import {
  composeAvailabilityContext,
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
import {
  queryAppointmentsInRange,
  queryUtilizationProjection,
} from "@/lib/booking-engine/queries";

export const BookingFacade = {
  /** Authoritative slot preview — delegates to get_available_slots RPC. */
  previewSlots: previewAvailableSlots,
  /** Soft validate before mutation — delegates to validate_appointment_slot when staff assigned. */
  validate: validateBooking,
  /** Compose Business / Location / Service / Employee scheduling inputs. */
  composeContext: composeAvailabilityContext,
  create: createBooking,
  update: updateBooking,
  reschedule: rescheduleBooking,
  resize: resizeBooking,
  cancel: cancelBooking,
  /** Calendar range reads — not a second availability engine. */
  range: queryAppointmentsInRange,
  /**
   * Utilization projection — truthful aggregates only when data exists.
   * Do not invent capacity metrics for Chase.
   */
  utilization: queryUtilizationProjection,
} as const;

export type BookingFacadeApi = typeof BookingFacade;
