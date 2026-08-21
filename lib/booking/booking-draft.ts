/**
 * Structured booking draft for transferring state between surfaces
 * (Quick Appointment → Booking Sheet, Next Slot → Sheet, etc.).
 * IDs are authoritative — never reconstruct from display labels.
 */

import type { DurationSource } from "@/lib/booking/resolved-duration";

export type BookingDraft = {
  customerId?: string | null;
  serviceId?: string | null;
  packageId?: string | null;
  locationId?: string | null;
  /** Empty string = unassigned. */
  staffId?: string | null;
  date?: string | null;
  /** ISO start time when known. */
  startIso?: string | null;
  /** Resolved duration minutes when known. */
  durationMinutes?: number | null;
  durationSource?: DurationSource | null;
  /** True when durationMinutes is an explicit override vs service default. */
  durationIsOverride?: boolean;
  notes?: string | null;
  bookingSource?: string | null;
};

export function bookingDraftFromPartial(
  partial: BookingDraft,
): BookingDraft {
  return {
    customerId: partial.customerId ?? null,
    serviceId: partial.serviceId ?? null,
    packageId: partial.packageId ?? null,
    locationId: partial.locationId ?? null,
    staffId: partial.staffId ?? null,
    date: partial.date ?? null,
    startIso: partial.startIso ?? null,
    durationMinutes: partial.durationMinutes ?? null,
    durationSource: partial.durationSource ?? null,
    durationIsOverride: partial.durationIsOverride ?? false,
    notes: partial.notes ?? null,
    bookingSource: partial.bookingSource ?? null,
  };
}

/** Merge drafts; later values win when defined (including empty string staff). */
export function mergeBookingDraft(
  base: BookingDraft,
  overlay: BookingDraft,
): BookingDraft {
  const out: BookingDraft = { ...base };
  for (const key of Object.keys(overlay) as (keyof BookingDraft)[]) {
    const value = overlay[key];
    if (value !== undefined) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}
