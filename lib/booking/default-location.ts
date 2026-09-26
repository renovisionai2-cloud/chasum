type BookingLocation = {
  id: string;
  is_default?: boolean | null;
};

export function resolveBookingLocationId(input: {
  locations: readonly BookingLocation[];
  appointmentLocationId?: string | null;
  draftLocationId?: string | null;
  activeLocationId?: string | null;
  preferenceLocationId?: string | null;
}): string {
  const {
    locations,
    appointmentLocationId,
    draftLocationId,
    activeLocationId,
    preferenceLocationId,
  } = input;

  // Existing appointment truth is authoritative, including historical locations
  // that may no longer be selectable for a new booking.
  if (appointmentLocationId) return appointmentLocationId;

  // Explicit cross-surface drafts beat the current workspace scope.
  if (draftLocationId) return draftLocationId;

  const hasLocation = (id: string | null | undefined) =>
    Boolean(id && locations.some((location) => location.id === id));

  // In a single-Location workspace, a new booking should naturally start there.
  if (hasLocation(activeLocationId)) return activeLocationId as string;

  // All-Locations / neutral surfaces retain the user's saved preference.
  if (hasLocation(preferenceLocationId)) return preferenceLocationId as string;

  return (
    locations.find((location) => location.is_default)?.id ??
    locations[0]?.id ??
    ""
  );
}
