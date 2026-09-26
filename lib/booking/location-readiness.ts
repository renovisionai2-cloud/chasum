import { isStaffEligibleForLocation } from "@/lib/booking/eligible-staff";
import {
  filterServicesOfferedAtLocation,
  type OperatorServiceCatalogItem,
} from "@/lib/services/operator-catalog";

type ReadinessStaff = {
  id: string;
  is_active?: boolean | null;
  accept_online_bookings?: boolean | null;
  location_id?: string | null;
  staff_locations?: Array<{ location_id: string }> | null;
  staff_services?: Array<{ service_id: string }> | null;
};

export type LocationBookingReadinessState =
  | "ready"
  | "no-services"
  | "no-staff"
  | "no-service-staff-overlap";

export type LocationBookingReadiness = {
  state: LocationBookingReadinessState;
  offeredServiceCount: number;
  bookableStaffCount: number;
  matchedStaffCount: number;
};

export function getLocationBookingReadiness(
  services: readonly OperatorServiceCatalogItem[],
  staff: readonly ReadinessStaff[],
  locationId?: string | null,
): LocationBookingReadiness {
  const activeServices = services.filter((service) => service.is_active !== false);
  const offeredServices = locationId
    ? filterServicesOfferedAtLocation(activeServices, locationId)
    : activeServices;
  const offeredIds = new Set(offeredServices.map((service) => service.id));

  const bookableStaff = staff.filter((member) => {
    if (member.is_active === false || member.accept_online_bookings === false) {
      return false;
    }
    return !locationId || isStaffEligibleForLocation(member, locationId);
  });

  const matchingStaff = bookableStaff.filter((member) =>
    (member.staff_services ?? []).some((link) => offeredIds.has(link.service_id)),
  );

  const state: LocationBookingReadinessState =
    offeredServices.length === 0
      ? "no-services"
      : bookableStaff.length === 0
        ? "no-staff"
        : matchingStaff.length === 0
          ? "no-service-staff-overlap"
          : "ready";

  return {
    state,
    offeredServiceCount: offeredServices.length,
    bookableStaffCount: bookableStaff.length,
    matchedStaffCount: matchingStaff.length,
  };
}
