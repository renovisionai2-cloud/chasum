/**
 * Reports is a force-dynamic RSC page. `getReportsBundle` uses React `cache()`
 * (per-request only). There is no polling and no timed aggregation job.
 *
 * Next.js `revalidatePath` marks the route stale for the *next* navigation or
 * full load. An already-open Reports tab does not live-update.
 *
 * Calendar mutations historically omitted Reports, so a visit immediately after
 * booking could show a prior render until a later navigation. Payments already
 * revalidate this path.
 */
export const REPORTS_DASHBOARD_PATH = "/dashboard/reports";

export const CALENDAR_MUTATION_REVALIDATE_PATHS = [
  "/dashboard/calendar",
  "/dashboard",
  "/dashboard/clients",
  REPORTS_DASHBOARD_PATH,
] as const;

export const BOOKING_ENGINE_MUTATION_REVALIDATE_PATHS = [
  "/dashboard/calendar",
  "/dashboard/automation",
  REPORTS_DASHBOARD_PATH,
] as const;
