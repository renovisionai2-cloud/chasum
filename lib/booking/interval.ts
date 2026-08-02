/**
 * Shared booking start-time interval for the whole Chasum platform.
 *
 * Persistence field (existing, no new column required):
 *   businesses.appointment_interval_minutes
 *   location_settings.appointment_interval_minutes  (authoritative for RPC)
 *
 * Resolution order matches get_available_slots SQL:
 *   location → business → DEFAULT_BOOKING_INTERVAL_MINUTES
 */

export const BOOKING_INTERVAL_OPTIONS = [5, 10, 15, 20, 30, 45, 60] as const;

export type BookingIntervalMinutes = (typeof BOOKING_INTERVAL_OPTIONS)[number];

/**
 * Safe fallback when neither location nor business has a usable value.
 * Preserves historical Chasum behaviour for existing tenants.
 */
export const DEFAULT_BOOKING_INTERVAL_MINUTES: BookingIntervalMinutes = 30;

/**
 * Recommended starting point for brand-new businesses during onboarding.
 * Does not change existing saved values.
 */
export const RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES: BookingIntervalMinutes = 15;

export const BOOKING_INTERVAL_SETTING_LABEL = "Booking time interval";

export const BOOKING_INTERVAL_SETTING_DESCRIPTION =
  "Controls how frequently appointments can begin across your calendar and online booking.";

export const BOOKING_INTERVAL_ONBOARDING_HELP =
  "Choose how frequently customers and staff can start appointments.";

/** Short plain-language examples for settings and onboarding. */
export const BOOKING_INTERVAL_EXAMPLES = [
  "Every 5 minutes allows times such as 9:05, 9:10, and 9:15.",
  "Every 15 minutes allows times such as 9:00, 9:15, 9:30, and 9:45.",
  "Every 30 minutes allows times such as 9:00 and 9:30.",
] as const;

export function isBookingIntervalMinutes(
  value: unknown,
): value is BookingIntervalMinutes {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    (BOOKING_INTERVAL_OPTIONS as readonly number[]).includes(value)
  );
}

/** Clamp / normalize arbitrary input to an allowed booking interval. */
export function normalizeBookingIntervalMinutes(
  value: unknown,
  fallback: BookingIntervalMinutes = DEFAULT_BOOKING_INTERVAL_MINUTES,
): BookingIntervalMinutes {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  const rounded = Math.round(n);
  if (isBookingIntervalMinutes(rounded)) return rounded;
  // Nearest allowed option (e.g. legacy free-form 25 → 20).
  let best: BookingIntervalMinutes = fallback;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const option of BOOKING_INTERVAL_OPTIONS) {
    const dist = Math.abs(option - rounded);
    if (dist < bestDist) {
      best = option;
      bestDist = dist;
    }
  }
  return best;
}

export function resolveBookingIntervalMinutes(input: {
  locationInterval?: number | null;
  businessInterval?: number | null;
  fallback?: BookingIntervalMinutes;
}): BookingIntervalMinutes {
  const fallback = input.fallback ?? DEFAULT_BOOKING_INTERVAL_MINUTES;
  if (
    input.locationInterval != null &&
    Number.isFinite(Number(input.locationInterval)) &&
    Number(input.locationInterval) > 0
  ) {
    return normalizeBookingIntervalMinutes(input.locationInterval, fallback);
  }
  if (
    input.businessInterval != null &&
    Number.isFinite(Number(input.businessInterval)) &&
    Number(input.businessInterval) > 0
  ) {
    return normalizeBookingIntervalMinutes(input.businessInterval, fallback);
  }
  return fallback;
}

export function bookingIntervalLabel(minutes: number): string {
  const n = normalizeBookingIntervalMinutes(minutes);
  return `Every ${n} minutes`;
}

/**
 * Snap a Y-offset within an hour row to the nearest interval boundary.
 * Returns minutes past the hour (0 … 60-interval).
 */
export function snapOffsetToIntervalMinutes(
  offsetY: number,
  height: number,
  intervalMinutes: number,
): number {
  const interval = normalizeBookingIntervalMinutes(intervalMinutes);
  if (height <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, offsetY / height));
  const rawMinutes = ratio * 60;
  const snapped = Math.round(rawMinutes / interval) * interval;
  if (snapped >= 60) return 60 - interval;
  return Math.max(0, snapped);
}

/** Snap a Date's minutes/seconds to the configured interval (keeps hour). */
export function snapDateToBookingInterval(
  date: Date,
  intervalMinutes: number,
): Date {
  const interval = normalizeBookingIntervalMinutes(intervalMinutes);
  const next = new Date(date);
  const total = next.getMinutes();
  const snapped = Math.round(total / interval) * interval;
  if (snapped >= 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  } else {
    next.setMinutes(snapped, 0, 0);
  }
  return next;
}

/**
 * True when an ISO/local start already sits on an interval boundary.
 * Used to preserve user-selected calendar times instead of re-rounding.
 */
export function isOnBookingInterval(
  date: Date,
  intervalMinutes: number,
): boolean {
  const interval = normalizeBookingIntervalMinutes(intervalMinutes);
  return date.getMinutes() % interval === 0 && date.getSeconds() === 0;
}
