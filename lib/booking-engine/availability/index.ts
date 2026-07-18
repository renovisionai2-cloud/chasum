export {
  composeAvailabilityContext,
  resolveRequestedStatus,
} from "@/lib/booking-engine/availability/compose";
export {
  applyPolicyChecks,
  previewAvailableSlots,
  validateBooking,
} from "@/lib/booking-engine/availability/query";
export {
  clearAvailabilityCache,
} from "@/lib/booking-engine/availability/cache";
export {
  registerAvailabilityExtensions,
  getAvailabilityExtensions,
  resetAvailabilityExtensions,
} from "@/lib/booking-engine/availability/extensions";
export { enrichSlotCandidates } from "@/lib/booking-engine/availability/enrich";
export { scoreSlot, compareSlotCandidates } from "@/lib/booking-engine/availability/score";
