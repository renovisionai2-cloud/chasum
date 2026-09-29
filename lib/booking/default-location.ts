import type { LocationScope } from "@/lib/location/constants";

type BookingLocation = {
  id: string;
  is_default?: boolean | null;
  is_active?: boolean;
};

export function resolveBookingLocationId(input: {
  locations: readonly BookingLocation[];
  scope: LocationScope;
  appointmentLocationId?: string | null;
  draftLocationId?: string | null;
  preferenceLocationId?: string | null;
}): string {
  const { locations, scope, appointmentLocationId, draftLocationId } = input;

  // Saved appointments and explicit drafts remain authoritative.
  if (appointmentLocationId) return appointmentLocationId;
  if (draftLocationId) return draftLocationId;

  const activeLocations = locations.filter((location) => location.is_active !== false);
  if (activeLocations.length === 1) return activeLocations[0].id;
  if (scope.mode === "single") return scope.locationId;

  // Multi-location ALL requires an explicit choice, never a saved preference,
  // Business default, or first catalog row.
  return "";
}
