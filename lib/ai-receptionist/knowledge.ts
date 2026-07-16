import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import { getAppUrl } from "@/lib/env";
import type { BusinessKnowledge } from "@/lib/ai-receptionist/types";
import { createClient } from "@/lib/supabase/server";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatAddress(parts: {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
}): string | null {
  const line = [
    parts.address_line1,
    parts.address_line2,
    [parts.city, parts.state].filter(Boolean).join(", "),
    parts.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
  return line || null;
}

/**
 * Load grounded business knowledge from Chasum data.
 * Never invent hours, services, staff, or policies.
 */
export async function loadBusinessKnowledge(input?: {
  locationId?: string | null;
}): Promise<BusinessKnowledge> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const locationId = input?.locationId ?? (await getActiveLocationId());

  const [
    hoursRes,
    locationsRes,
    servicesRes,
    staffRes,
  ] = await Promise.all([
    supabase
      .from("business_hours")
      .select("day_of_week, is_open, open_time, close_time")
      .eq("business_id", business.id)
      .order("day_of_week"),
    supabase
      .from("locations")
      .select(
        "id, name, phone, is_default, address_line1, address_line2, city, state, postal_code",
      )
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("services")
      .select(
        "id, name, description, duration_minutes, price, category, location_id, is_active",
      )
      .eq("business_id", business.id)
      .eq("is_active", true),
    supabase
      .from("staff")
      .select(
        "id, name, title, is_active, location_id, staff_services(service_id)",
      )
      .eq("business_id", business.id)
      .eq("is_active", true),
  ]);

  const services = (servicesRes.data ?? []).filter(
    (s) => !locationId || !s.location_id || s.location_id === locationId,
  );
  const employees = (staffRes.data ?? [])
    .filter((s) => !locationId || !s.location_id || s.location_id === locationId)
    .map((s) => ({
      id: s.id as string,
      name: s.name as string,
      title: (s.title as string | null) ?? null,
      serviceIds: (
        (s.staff_services as { service_id: string }[] | null) ?? []
      ).map((link) => link.service_id),
    }));

  return {
    businessId: business.id,
    businessName: business.name,
    slug: business.slug,
    timezone: business.timezone,
    phone: business.phone ?? null,
    email: business.email ?? null,
    website: business.website ?? null,
    description: business.description ?? null,
    cancellationPolicy: business.cancellation_policy ?? null,
    bookingPolicy: business.booking_policy ?? null,
    address: formatAddress(business),
    bookingUrl: `${getAppUrl()}/book/${business.slug}`,
    hours: (hoursRes.data ?? []).map((h) => ({
      dayOfWeek: h.day_of_week as number,
      dayLabel: DAY_LABELS[h.day_of_week as number] ?? `Day ${h.day_of_week}`,
      isOpen: Boolean(h.is_open),
      openTime: String(h.open_time).slice(0, 5),
      closeTime: String(h.close_time).slice(0, 5),
    })),
    locations: (locationsRes.data ?? []).map((l) => ({
      id: l.id as string,
      name: l.name as string,
      phone: (l.phone as string | null) ?? null,
      address: formatAddress(l),
      isDefault: Boolean(l.is_default),
    })),
    services: services.map((s) => ({
      id: s.id as string,
      name: s.name as string,
      description: (s.description as string | null) ?? null,
      durationMinutes: Number(s.duration_minutes ?? 0),
      price: Number(s.price ?? 0),
      category: (s.category as string | null) ?? null,
    })),
    employees,
  };
}

export function knowledgeToPromptBlock(knowledge: BusinessKnowledge): string {
  const hours = knowledge.hours
    .map((h) =>
      h.isOpen
        ? `${h.dayLabel}: ${h.openTime}–${h.closeTime}`
        : `${h.dayLabel}: closed`,
    )
    .join("\n");

  const services = knowledge.services
    .map(
      (s) =>
        `- ${s.name} (${s.durationMinutes} min, $${s.price.toFixed(2)}${
          s.category ? `, ${s.category}` : ""
        })${s.description ? `: ${s.description}` : ""}`,
    )
    .join("\n");

  const staff = knowledge.employees
    .map((e) => `- ${e.name}${e.title ? ` (${e.title})` : ""}`)
    .join("\n");

  const locations = knowledge.locations
    .map(
      (l) =>
        `- ${l.name}${l.address ? `: ${l.address}` : ""}${
          l.phone ? ` · ${l.phone}` : ""
        }`,
    )
    .join("\n");

  return [
    `Business: ${knowledge.businessName}`,
    knowledge.description ? `About: ${knowledge.description}` : null,
    `Timezone: ${knowledge.timezone}`,
    knowledge.phone ? `Phone: ${knowledge.phone}` : null,
    knowledge.email ? `Email: ${knowledge.email}` : null,
    knowledge.address ? `Address: ${knowledge.address}` : null,
    `Booking URL: ${knowledge.bookingUrl}`,
    "",
    "Hours:",
    hours || "Not configured",
    "",
    "Locations:",
    locations || "Single location",
    "",
    "Services:",
    services || "None listed",
    "",
    "Employees:",
    staff || "None listed",
    "",
    knowledge.cancellationPolicy
      ? `Cancellation policy: ${knowledge.cancellationPolicy}`
      : null,
    knowledge.bookingPolicy ? `Booking policy: ${knowledge.bookingPolicy}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
