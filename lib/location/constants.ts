export const LOCATION_SCOPE_COOKIE = "chasum_location_scope";
export const ALL_LOCATIONS = "ALL";

export type LocationScope =
  | { mode: "single"; locationId: string }
  | { mode: "all" };

export function parseLocationScope(
  cookieValue: string | null,
  defaultLocationId: string,
): LocationScope {
  if (cookieValue === ALL_LOCATIONS) {
    return { mode: "all" };
  }
  if (cookieValue) {
    return { mode: "single", locationId: cookieValue };
  }
  return { mode: "single", locationId: defaultLocationId };
}

/** Apply location filter to a Supabase query builder when scope is single-location. */
export function withLocationFilter<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  scope: LocationScope,
  column = "location_id",
): T {
  if (scope.mode === "single") {
    return query.eq(column, scope.locationId);
  }
  return query;
}
