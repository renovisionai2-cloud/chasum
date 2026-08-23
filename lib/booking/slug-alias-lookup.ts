import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types/booking";
import {
  resolvePublicBookingSlug,
  type BookingSlugLookup,
  type PublicBookingSlugResolution,
} from "@/lib/booking/slug-aliases";

export function createBookingSlugLookup(
  supabase: Awaited<ReturnType<typeof createClient>>,
): BookingSlugLookup {
  return {
    async findBusinessBySlug(slug: string) {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return (data as Business | null) ?? null;
    },
    async findAlias(slug: string) {
      const { data } = await supabase
        .from("business_slug_aliases")
        .select("business_id")
        .eq("slug", slug)
        .maybeSingle();
      return data as { business_id: string } | null;
    },
    async findBusinessById(id: string) {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      return (data as Business | null) ?? null;
    },
  };
}

/**
 * Public booking resolution: current slug, then one-hop historical alias.
 * Internal/canonical-only callers should keep using getBusinessBySlug().
 */
export async function resolvePublicBookingBySlug(
  slug: string,
): Promise<PublicBookingSlugResolution> {
  const supabase = await createClient();
  return resolvePublicBookingSlug(slug, createBookingSlugLookup(supabase));
}

/**
 * Load the business for a public booking mutation/read.
 * Follows aliases so in-flight forms posted to a retired slug still hit the
 * same immutable business_id. Does not clone tenants or switch context.
 */
export async function getPublicBusinessBySlug(
  slug: string,
): Promise<Business | null> {
  const resolution = await resolvePublicBookingBySlug(slug);
  if (resolution.kind === "missing") return null;
  return resolution.business;
}
