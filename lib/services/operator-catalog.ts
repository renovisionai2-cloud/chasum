import type { Service } from "@/lib/types/booking";

/** Operator-only catalog. Missing memberships permit primary compatibility only. */
export type OperatorServiceCatalogItem = Service & {
  service_locations?: Array<{ location_id: string }> | null;
};

type OfferedService = Pick<OperatorServiceCatalogItem, "location_id" | "service_locations">;

/** Stage 1 compatibility; long-term offered-at authority is service_locations. */
export function isServiceOfferedAtLocation(
  service: OfferedService,
  locationId: string,
): boolean {
  if (!locationId) return false;
  return service.location_id === locationId ||
    (service.service_locations ?? []).some((link) => link.location_id === locationId);
}

export function filterServicesOfferedAtLocation<T extends OfferedService>(
  services: readonly T[],
  locationId: string,
): T[] {
  return services.filter((service) => isServiceOfferedAtLocation(service, locationId));
}
