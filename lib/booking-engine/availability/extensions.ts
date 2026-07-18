/**
 * Extension points for future Availability Engine features.
 * Do NOT implement Google/Outlook sync, travel, recurring, or waitlist here —
 * only stable hooks so those modules can plug in later.
 */

import type {
  AvailabilityContext,
  PreviewSlotsInput,
  SlotCandidate,
} from "@/lib/booking-engine/types";

export type AvailabilityExtensionContext = {
  input: PreviewSlotsInput;
  context: AvailabilityContext;
  /** Raw authoritative starts from SQL RPC */
  rpcStarts: string[];
};

/**
 * Resolve resources required for a slot (rooms, equipment).
 * Default: none. Resource scheduling will replace this.
 */
export type ResolveSlotResources = (
  ctx: AvailabilityExtensionContext,
  startIso: string,
) => string[] | Promise<string[]>;

/**
 * Adjust score after base scoring (priority / scarcity).
 * Travel time, multi-TZ preference, waitlist optimization plug in here.
 */
export type AdjustSlotScore = (
  candidate: SlotCandidate,
  ctx: AvailabilityExtensionContext,
) => number | Promise<number>;

/**
 * Filter or annotate candidates after enrichment.
 * Recurring series expansion and external calendar overlays plug in here
 * (external busy is already enforced in SQL via external_events).
 */
export type PostProcessSlots = (
  slots: SlotCandidate[],
  ctx: AvailabilityExtensionContext,
) => SlotCandidate[] | Promise<SlotCandidate[]>;

export type AvailabilityExtensions = {
  resolveSlotResources?: ResolveSlotResources;
  adjustSlotScore?: AdjustSlotScore;
  postProcessSlots?: PostProcessSlots;
};

let extensions: AvailabilityExtensions = {};

export function registerAvailabilityExtensions(
  next: AvailabilityExtensions,
): void {
  extensions = { ...extensions, ...next };
}

export function getAvailabilityExtensions(): AvailabilityExtensions {
  return extensions;
}

export function resetAvailabilityExtensions(): void {
  extensions = {};
}
