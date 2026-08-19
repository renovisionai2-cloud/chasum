import {
  ALL_LOCATIONS,
  type LocationScope,
} from "@/lib/location/constants";

/**
 * After the active business changes, keep a location cookie only when it
 * still belongs to the new tenant. Never reuse another tenant's location id.
 */
export function locationCookieAfterBusinessSwitch(input: {
  previousCookie: string | null;
  locationIds: string[];
  defaultLocationId: string | null;
}): string | null {
  const previous = input.previousCookie?.trim() || null;
  const ids = input.locationIds.filter(Boolean);

  if (previous === ALL_LOCATIONS && ids.length > 1) {
    return ALL_LOCATIONS;
  }
  if (previous && previous !== ALL_LOCATIONS && ids.includes(previous)) {
    return previous;
  }
  return input.defaultLocationId;
}

/**
 * Read-path guard: a stale location cookie from another tenant must not
 * remain the active scope. Does not write cookies.
 */
export function resolveLocationScopeForBusiness(input: {
  cookieValue: string | null;
  locationIds: string[];
  defaultLocationId: string;
}): LocationScope {
  const cookie = input.cookieValue?.trim() || null;
  const ids = input.locationIds.filter(Boolean);

  if (cookie === ALL_LOCATIONS && ids.length > 1) {
    return { mode: "all" };
  }
  if (cookie && cookie !== ALL_LOCATIONS && ids.includes(cookie)) {
    return { mode: "single", locationId: cookie };
  }
  return { mode: "single", locationId: input.defaultLocationId };
}
