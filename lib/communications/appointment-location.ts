/**
 * Customer appointment location truth for communications.
 *
 * Address always comes from the appointment's same-business location row.
 * Presentation owns formatting; callers pass structured fields, never a
 * preformatted database string.
 */

import {
  appointmentTimezoneAbbreviation,
  resolveAppointmentEmailTimezone,
} from "@/lib/communications/appointment-datetime";
import type { AppointmentTemplateContext } from "@/lib/communications/types";

/** PostgREST embed list for appointment → locations. */
export const APPOINTMENT_LOCATION_EMBED =
  "name, timezone, address_line1, address_line2, city, state, postal_code, business_id";

export type AppointmentLocationAddress = {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
};

export type AppointmentLocationRow = {
  name?: string | null;
  timezone?: string | null;
  business_id?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
};

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Keep a location only when its business_id positively matches the appointment.
 * Missing, blank, or foreign business_id fails closed — never infer ownership.
 */
export function sameBusinessLocation<T extends { business_id?: string | null }>(
  location: T | null | undefined,
  appointmentBusinessId: string,
): T | null {
  if (!location) return null;
  const locationBusinessId = trimOrNull(location.business_id);
  const expectedBusinessId = trimOrNull(appointmentBusinessId);
  if (!locationBusinessId || !expectedBusinessId) return null;
  if (locationBusinessId !== expectedBusinessId) return null;
  return location;
}

export function toAppointmentLocationAddress(
  row: AppointmentLocationRow | null | undefined,
): AppointmentLocationAddress | null {
  if (!row) return null;
  const address: AppointmentLocationAddress = {
    addressLine1: trimOrNull(row.address_line1),
    addressLine2: trimOrNull(row.address_line2),
    city: trimOrNull(row.city),
    state: trimOrNull(row.state),
    postalCode: trimOrNull(row.postal_code),
  };
  if (
    !address.addressLine1 &&
    !address.addressLine2 &&
    !address.city &&
    !address.state &&
    !address.postalCode
  ) {
    return null;
  }
  return address;
}

/**
 * Readable customer address. Omits empty parts. Never invents punctuation
 * that would look malformed when components are missing.
 *
 *   123 Main Street
 *   Burlington, ON L7M 1A1
 */
export function formatAppointmentLocationAddress(
  address: AppointmentLocationAddress | null | undefined,
): string | null {
  if (!address) return null;
  const line1 = trimOrNull(address.addressLine1);
  const line2 = trimOrNull(address.addressLine2);
  const city = trimOrNull(address.city);
  const state = trimOrNull(address.state);
  const postal = trimOrNull(address.postalCode);
  const region = [state, postal].filter(Boolean).join(" ");
  const cityLine = [city, region || null].filter(Boolean).join(", ");
  const lines = [line1, line2, cityLine].filter(Boolean) as string[];
  return lines.length ? lines.join("\n") : null;
}

/** line1 AND (city OR postal_code) — never directions from a name-only label. */
export function isDirectionsEligible(
  address: AppointmentLocationAddress | null | undefined,
): boolean {
  if (!address) return false;
  const line1 = trimOrNull(address.addressLine1);
  const city = trimOrNull(address.city);
  const postal = trimOrNull(address.postalCode);
  return Boolean(line1 && (city || postal));
}

export function googleMapsSearchUrl(
  address: AppointmentLocationAddress | null | undefined,
): string | null {
  if (!isDirectionsEligible(address)) return null;
  const formatted = formatAppointmentLocationAddress(address);
  if (!formatted) return null;
  const query = formatted.replace(/\n/g, ", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function customerTimezoneCue(
  ctx: Pick<
    AppointmentTemplateContext,
    "locationTimezone" | "businessTimezone" | "timezone" | "startTime"
  >,
): string | null {
  const locationTimezone = ctx.locationTimezone?.trim() || null;
  const businessTimezone = ctx.businessTimezone?.trim() || null;
  if (!locationTimezone || !businessTimezone) return null;
  if (locationTimezone === businessTimezone) return null;
  const zone = resolveAppointmentEmailTimezone({
    locationTimezone,
    businessTimezone,
    timezone: ctx.timezone,
  });
  const abbrev = appointmentTimezoneAbbreviation(ctx.startTime, zone);
  if (!abbrev) return null;
  return `Times shown in ${abbrev}.`;
}

export function customerLocationHtml(
  ctx: Pick<AppointmentTemplateContext, "locationName" | "locationAddress">,
): string {
  const name = ctx.locationName?.trim() || "";
  const formatted = formatAppointmentLocationAddress(ctx.locationAddress);
  const maps = googleMapsSearchUrl(ctx.locationAddress);
  if (!name && !formatted) return "";

  const parts: string[] = [];
  if (name) parts.push(escapeHtml(name));
  if (formatted) {
    parts.push(escapeHtml(formatted).replace(/\n/g, "<br/>"));
  }
  if (maps) {
    parts.push(
      `<a href="${escapeHtml(maps)}" style="display:inline-block;margin-top:8px;padding:12px 16px;min-height:44px;line-height:20px;border-radius:8px;background:#0b1324;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">Get directions</a>`,
    );
  }
  return parts.join("<br/>");
}

export function customerLocationPlainLines(
  ctx: Pick<AppointmentTemplateContext, "locationName" | "locationAddress">,
): string[] {
  const lines: string[] = [];
  const name = ctx.locationName?.trim() || "";
  if (name) lines.push(`Location: ${name}`);
  const formatted = formatAppointmentLocationAddress(ctx.locationAddress);
  if (formatted) lines.push(`Address: ${formatted}`);
  const maps = googleMapsSearchUrl(ctx.locationAddress);
  if (maps) lines.push(`Directions: ${maps}`);
  return lines;
}

/** Timezone cue + location/address/directions — no Service/Provider/When. */
export function customerArrivalPlainLines(
  ctx: Pick<
    AppointmentTemplateContext,
    | "locationName"
    | "locationAddress"
    | "locationTimezone"
    | "businessTimezone"
    | "timezone"
    | "startTime"
  >,
): string[] {
  const cue = customerTimezoneCue(ctx);
  return [cue, ...customerLocationPlainLines(ctx)].filter(
    (line): line is string => Boolean(line),
  );
}
