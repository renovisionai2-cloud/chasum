/**
 * Authoritative appointment duration resolution for the whole Chasum platform.
 *
 * Booking interval (slot start grid) is a separate concept — never use it as
 * service duration. A 10-minute service on a 5-minute interval still lasts 10.
 */

export const MIN_BOOKING_DURATION_MINUTES = 5;

export type DurationSource =
  | "appointment"
  | "override"
  | "package_item"
  | "service"
  | "unresolved";

export type ResolvedDuration = {
  /** Positive minutes when known; null when not yet resolvable. */
  minutes: number | null;
  source: DurationSource;
  /** Service catalog duration when known (for “custom vs default” UI). */
  serviceDefaultMinutes: number | null;
};

export type ResolveBookingDurationInput = {
  /** Editing: duration from saved end − start. */
  appointmentDurationMinutes?: number | null;
  /** Explicit authorized override for this booking only. */
  overrideMinutes?: number | null;
  /** Package / package-item duration when the offer defines one. */
  packageItemDurationMinutes?: number | null;
  /** Selected service catalog duration. */
  serviceDurationMinutes?: number | null;
};

function positiveMinutes(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < MIN_BOOKING_DURATION_MINUTES) return null;
  return Math.round(n);
}

/**
 * Resolve duration with an explicit hierarchy. Never falls back to the
 * booking interval or a silent “30”.
 */
export function resolveBookingDuration(
  input: ResolveBookingDurationInput,
): ResolvedDuration {
  const serviceDefault = positiveMinutes(input.serviceDurationMinutes);

  const fromAppointment = positiveMinutes(input.appointmentDurationMinutes);
  if (fromAppointment != null) {
    return {
      minutes: fromAppointment,
      source: "appointment",
      serviceDefaultMinutes: serviceDefault,
    };
  }

  const fromOverride = positiveMinutes(input.overrideMinutes);
  if (fromOverride != null) {
    return {
      minutes: fromOverride,
      source: "override",
      serviceDefaultMinutes: serviceDefault,
    };
  }

  const fromPackage = positiveMinutes(input.packageItemDurationMinutes);
  if (fromPackage != null) {
    return {
      minutes: fromPackage,
      source: "package_item",
      serviceDefaultMinutes: serviceDefault,
    };
  }

  if (serviceDefault != null) {
    return {
      minutes: serviceDefault,
      source: "service",
      serviceDefaultMinutes: serviceDefault,
    };
  }

  return {
    minutes: null,
    source: "unresolved",
    serviceDefaultMinutes: null,
  };
}

/** Duration implied by saved appointment start/end ISO strings. */
export function durationFromAppointmentTimes(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): number | null {
  if (!startIso || !endIso) return null;
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  return positiveMinutes(Math.round((end - start) / 60_000));
}

/**
 * End time for display / integrity checks.
 * Returns null when duration is unresolved (do not invent an end).
 */
export function endIsoFromStartAndDuration(
  startIso: string,
  durationMinutes: number | null,
): string | null {
  const mins = positiveMinutes(durationMinutes);
  if (mins == null) return null;
  const start = Date.parse(startIso);
  if (!Number.isFinite(start)) return null;
  return new Date(start + mins * 60_000).toISOString();
}

/**
 * True when form duration disagrees with the resolved service/appointment
 * duration in a way that should block confirmation.
 */
export function durationIntegrityConflict(input: {
  formDurationMinutes: number | null | undefined;
  resolved: ResolvedDuration;
}): boolean {
  const form = positiveMinutes(input.formDurationMinutes);
  const resolved = input.resolved.minutes;
  if (form == null && resolved == null) return false;
  if (form == null || resolved == null) return true;
  return form !== resolved;
}
