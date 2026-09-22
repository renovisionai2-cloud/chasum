/**
 * Staff eligibility for booking UI — separate from availability.
 * Dropdown lists everyone who can perform the service at the location;
 * openings are calculated later per selection.
 */

export type StaffLocationEligibility = {
  id: string;
  is_active?: boolean | null;
  location_id?: string | null;
  /** Multi-location assignments when loaded */
  staff_locations?: Array<{ location_id: string }> | null;
  staff_services?: Array<{ service_id: string }> | null;
};

/** Stage-1 works-at truth: primary exact match OR explicit staff_locations membership. */
export function isStaffEligibleForLocation(
  member: StaffLocationEligibility,
  locationId: string | null | undefined,
): boolean {
  if (!locationId) return true;
  if (member.location_id === locationId) return true;
  return (member.staff_locations ?? []).some(
    (row) => row.location_id === locationId,
  );
}

/** Active employees assigned to the service and eligible for the location. */
export function filterEligibleBookingStaff<T extends StaffLocationEligibility>(
  staff: T[],
  input: {
    serviceId?: string | null;
    locationId?: string | null;
  },
): T[] {
  const serviceId = input.serviceId?.trim() || "";
  const locationId = input.locationId?.trim() || "";

  return staff.filter((member) => {
    if (member.is_active === false) return false;
    if (
      serviceId &&
      !(member.staff_services ?? []).some((ss) => ss.service_id === serviceId)
    ) {
      return false;
    }
    if (locationId && !isStaffEligibleForLocation(member, locationId)) {
      return false;
    }
    return true;
  });
}
