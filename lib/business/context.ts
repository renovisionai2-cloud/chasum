/**
 * Business Operating Context — shared "memory" foundation for Summer & Chase.
 * Read-only composition of existing Chasum data. Does not call AI.
 */

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getLocationScope, getLocations } from "@/lib/actions/location";
import { listPackages } from "@/lib/actions/business-management";
import { normalizeCurrency } from "@/lib/commerce/money";
import {
  getBusinessLocale,
  getBusinessTimezone,
  normalizeLanguage,
} from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type BusinessOperatingContext = {
  businessId: string;
  businessName: string;
  legalName: string | null;
  profile: {
    currency: string;
    language: string;
    locale: string;
    timezone: string;
    brandColor: string | null;
    accentColor: string | null;
    logoUrl: string | null;
    email: string | null;
    phone: string | null;
    industry: string | null;
  };
  policies: {
    cancellationPolicy: string | null;
    bookingPolicy: string | null;
    minNoticeMinutes: number | null;
    cancellationWindowHours: number | null;
    onlineBookingEnabled: boolean | null;
    waitlistEnabled: boolean | null;
  };
  communication: {
    ownerNotificationsEnabled: boolean | null;
    staffNotificationsEnabled: boolean | null;
    emailSignature: string | null;
  };
  locations: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    timezone: string | null;
  }>;
  catalog: {
    serviceCount: number;
    packageCount: number;
    employeeCount: number;
    services: Array<{ id: string; name: string; price: number; durationMinutes: number }>;
    packages: Array<{ id: string; name: string; priceCents: number; totalVisits: number }>;
  };
  scope: {
    mode: "single" | "all";
    locationId: string | null;
  };
  generatedAt: string;
};

/**
 * Request-deduped business memory for dashboard / future AI consumers.
 */
export const getBusinessOperatingContext = cache(
  async function getBusinessOperatingContext(): Promise<BusinessOperatingContext> {
    const business = await getOrCreateBusiness();
    const [scope, locations, packages, supabase] = await Promise.all([
      getLocationScope(),
      getLocations(),
      listPackages(),
      createClient(),
    ]);

    const [servicesRes, staffRes] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, price, duration_minutes, is_active")
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("name")
        .limit(100),
      supabase
        .from("staff")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("is_active", true),
    ]);

    const currency = normalizeCurrency(business.currency);
    const language = normalizeLanguage(business.language);
    const timezone = getBusinessTimezone({
      timezone: business.timezone,
      currency,
      language,
    });

    const activePackages = (packages ?? []).filter((p) => p.is_active);

    return {
      businessId: business.id,
      businessName: business.name,
      legalName: business.legal_name ?? null,
      profile: {
        currency,
        language,
        locale: getBusinessLocale({ language, currency }),
        timezone,
        brandColor: business.brand_color ?? null,
        accentColor: business.accent_color ?? null,
        logoUrl: business.logo_url ?? null,
        email: business.email ?? null,
        phone: business.phone ?? null,
        industry: business.industry ?? null,
      },
      policies: {
        cancellationPolicy: business.cancellation_policy ?? null,
        bookingPolicy: business.booking_policy ?? null,
        minNoticeMinutes: business.min_notice_minutes ?? null,
        cancellationWindowHours: business.cancellation_window_hours ?? null,
        onlineBookingEnabled: business.online_booking_enabled ?? null,
        waitlistEnabled: business.waitlist_enabled ?? null,
      },
      communication: {
        ownerNotificationsEnabled: business.owner_notifications_enabled ?? null,
        staffNotificationsEnabled: business.staff_notifications_enabled ?? null,
        emailSignature: business.email_signature ?? null,
      },
      locations: locations.map((l) => ({
        id: l.id,
        name: l.name,
        isDefault: Boolean(l.is_default),
        timezone: l.timezone ?? null,
      })),
      catalog: {
        serviceCount: servicesRes.data?.length ?? 0,
        packageCount: activePackages.length,
        employeeCount: staffRes.count ?? 0,
        services: (servicesRes.data ?? []).map((s) => ({
          id: String(s.id),
          name: String(s.name),
          price: Number(s.price ?? 0),
          durationMinutes: Number(s.duration_minutes ?? 0),
        })),
        packages: activePackages.slice(0, 40).map((p) => ({
          id: p.id,
          name: p.name,
          priceCents: p.price_cents,
          totalVisits: p.total_visits,
        })),
      },
      scope: {
        mode: scope.mode === "single" ? "single" : "all",
        locationId: scope.mode === "single" ? scope.locationId : null,
      },
      generatedAt: new Date().toISOString(),
    };
  },
);

/** Compact prompt-safe block for future Summer / Chase (no AI call). */
export function businessContextToPromptBlock(
  ctx: BusinessOperatingContext,
): string {
  const lines = [
    `Business: ${ctx.businessName}`,
    `Currency: ${ctx.profile.currency.toUpperCase()} · Locale: ${ctx.profile.locale} · Timezone: ${ctx.profile.timezone}`,
    `Locations: ${ctx.locations.map((l) => l.name).join(", ") || "none"}`,
    `Services: ${ctx.catalog.serviceCount} · Packages: ${ctx.catalog.packageCount} · Employees: ${ctx.catalog.employeeCount}`,
  ];
  if (ctx.policies.cancellationPolicy) {
    lines.push(`Cancellation: ${ctx.policies.cancellationPolicy}`);
  }
  return lines.join("\n");
}
