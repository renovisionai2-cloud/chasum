/**
 * Public booking slug identity.
 *
 * Canonical URL identity is `businesses.slug`.
 * Historical public identifiers live in `business_slug_aliases`.
 * Authoritative tenant identity is always `businesses.id`.
 *
 * Alias resolution is one hop only:
 *   alias.slug → alias.business_id → businesses.slug (canonical)
 * Never: alias → alias → canonical.
 */

import type { Business } from "@/lib/types/booking";

export type PublicBookingSlugResolution =
  | { kind: "canonical"; business: Business; canonicalSlug: string }
  | {
      kind: "alias";
      business: Business;
      requestedSlug: string;
      canonicalSlug: string;
    }
  | { kind: "missing" };

export type BookingSlugLookup = {
  findBusinessBySlug(slug: string): Promise<Business | null>;
  findAlias(slug: string): Promise<{ business_id: string } | null>;
  findBusinessById(id: string): Promise<Business | null>;
};

export function normalizeBookingSlug(slug: string): string {
  return slug.trim();
}

export function publicBookingPath(
  canonicalSlug: string,
  search?: { location?: string; invite?: string },
): string {
  const params = new URLSearchParams();
  if (search?.location) params.set("location", search.location);
  if (search?.invite) params.set("invite", search.invite);
  const qs = params.toString();
  return qs ? `/book/${canonicalSlug}?${qs}` : `/book/${canonicalSlug}`;
}

export function canonicalBookingUrl(origin: string, canonicalSlug: string): string {
  return `${origin.replace(/\/+$/, "")}/book/${canonicalSlug}`;
}

/**
 * Resolve a public booking slug to a business.
 * Canonical hit wins. Alias hit loads the current business by id.
 * Does not follow alias chains.
 */
export async function resolvePublicBookingSlug(
  rawSlug: string,
  lookup: BookingSlugLookup,
): Promise<PublicBookingSlugResolution> {
  const slug = normalizeBookingSlug(rawSlug);
  if (!slug) return { kind: "missing" };

  const canonical = await lookup.findBusinessBySlug(slug);
  if (canonical) {
    return {
      kind: "canonical",
      business: canonical,
      canonicalSlug: canonical.slug,
    };
  }

  const alias = await lookup.findAlias(slug);
  if (!alias) return { kind: "missing" };

  const business = await lookup.findBusinessById(alias.business_id);
  if (!business) return { kind: "missing" };

  return {
    kind: "alias",
    business,
    requestedSlug: slug,
    canonicalSlug: business.slug,
  };
}

export function resolvedPublicBusiness(
  resolution: PublicBookingSlugResolution,
): Business | null {
  if (resolution.kind === "missing") return null;
  return resolution.business;
}
