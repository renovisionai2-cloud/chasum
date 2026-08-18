/**
 * Usable booking locations — application-level sequencing only.
 * Does not invent resource/room capacity or change staff_locations schema.
 */

export type LocationForBooking = {
  id: string;
  name?: string;
  is_active?: boolean | null;
  is_default?: boolean | null;
};

/** Active locations staff may book into. Inactive rows are not offered. */
export function usableBookingLocations<T extends LocationForBooking>(
  locations: T[],
): T[] {
  return locations.filter((location) => location.is_active !== false);
}

/** True when the business has more than one usable booking location. */
export function locationDecisionRequired(
  locations: LocationForBooking[],
): boolean {
  return usableBookingLocations(locations).length > 1;
}

export type InitialBookingLocation = {
  locationId: string;
  /** Unique-location auto-select uses entry_context. Prefs never skip a multi-location decision. */
  provenance:
    | "appointment"
    | "entry_context"
    | "preference"
    | "none";
  required: boolean;
};

/**
 * Resolve the starting location for New / Existing Appointment.
 * One usable location is auto-selected. Multiple locations require an
 * intentional decision unless appointment or calendar/draft context already
 * supplied one.
 */
export function resolveInitialBookingLocation(input: {
  locations: LocationForBooking[];
  appointmentLocationId?: string | null;
  draftLocationId?: string | null;
  preferenceLocationId?: string | null;
}): InitialBookingLocation {
  const usable = usableBookingLocations(input.locations);
  const required = usable.length > 1;
  const appointmentId = input.appointmentLocationId?.trim() || "";
  if (appointmentId && usable.some((row) => row.id === appointmentId)) {
    return { locationId: appointmentId, provenance: "appointment", required };
  }
  if (usable.length === 1) {
    return {
      locationId: usable[0].id,
      provenance: "entry_context",
      required: false,
    };
  }
  const draftId = input.draftLocationId?.trim() || "";
  if (draftId && usable.some((row) => row.id === draftId)) {
    return { locationId: draftId, provenance: "entry_context", required };
  }
  const prefId = input.preferenceLocationId?.trim() || "";
  if (prefId && usable.some((row) => row.id === prefId)) {
    return { locationId: prefId, provenance: "preference", required };
  }
  return { locationId: "", provenance: "none", required };
}
