import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import { getAppUrl } from "@/lib/env";
import type { BusinessKnowledge } from "@/lib/ai-receptionist/types";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

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
 * Request-deduped via React cache().
 */
export const loadBusinessKnowledge = cache(async function loadBusinessKnowledge(input?: {
  locationId?: string | null;
}): Promise<BusinessKnowledge> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const locationId = input?.locationId ?? (await getActiveLocationId());

  const richServices = await supabase
    .from("services")
    .select(
      "id, name, description, duration_minutes, cleanup_minutes, price, category, location_id, is_active, buffer_before_minutes, buffer_after_minutes, booking_visibility, confirmation_mode, staff_services(staff_id)",
    )
    .eq("business_id", business.id)
    .eq("is_active", true);

  const servicesRes = richServices.error
    ? await supabase
        .from("services")
        .select(
          "id, name, description, duration_minutes, price, category, location_id, is_active, buffer_before_minutes, buffer_after_minutes, staff_services(staff_id)",
        )
        .eq("business_id", business.id)
        .eq("is_active", true)
    : richServices;

  const [hoursRes, locationsRes, staffRes] = await Promise.all([
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
      .from("staff")
      .select(
        "id, name, title, is_active, location_id, accept_online_bookings, staff_services(service_id), staff_working_hours(day_of_week, is_working, start_time, end_time)",
      )
      .eq("business_id", business.id)
      .eq("is_active", true),
  ]);

  const services = (servicesRes.data ?? []).filter(
    (s) => !locationId || !s.location_id || s.location_id === locationId,
  );
  const employees = (staffRes.error
    ? (
        await supabase
          .from("staff")
          .select(
            "id, name, title, is_active, location_id, staff_services(service_id)",
          )
          .eq("business_id", business.id)
          .eq("is_active", true)
      ).data
    : staffRes.data) ?? [];

  const mappedEmployees = employees
    .filter((s) => !locationId || !s.location_id || s.location_id === locationId)
    .map((s) => {
      const row = s as Record<string, unknown>;
      const hours =
        (row.staff_working_hours as
          | {
              day_of_week: number;
              is_working: boolean;
              start_time: string;
              end_time: string;
            }[]
          | null) ?? [];
      const hoursSummary = hours
        .filter((h) => h.is_working)
        .map(
          (h) =>
            `${DAY_LABELS[h.day_of_week] ?? h.day_of_week} ${String(h.start_time).slice(0, 5)}–${String(h.end_time).slice(0, 5)}`,
        )
        .join("; ");
      return {
        id: row.id as string,
        name: row.name as string,
        title: (row.title as string | null) ?? null,
        serviceIds: (
          (row.staff_services as { service_id: string }[] | null) ?? []
        ).map((link) => link.service_id),
        isActive: Boolean(row.is_active ?? true),
        locationId: (row.location_id as string | null) ?? null,
        acceptOnlineBookings: row.accept_online_bookings !== false,
        workingHoursSummary: hoursSummary || undefined,
      };
    });

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
    services: services.map((s) => {
      const row = s as Record<string, unknown>;
      const staffLinks =
        (row.staff_services as { staff_id: string }[] | null) ?? [];
      return {
        id: row.id as string,
        name: row.name as string,
        description: (row.description as string | null) ?? null,
        durationMinutes: Number(row.duration_minutes ?? 0),
        cleanupMinutes: Number(row.cleanup_minutes ?? 0),
        price: Number(row.price ?? 0),
        category: (row.category as string | null) ?? null,
        bufferBeforeMinutes: Number(row.buffer_before_minutes ?? 0),
        bufferAfterMinutes: Number(row.buffer_after_minutes ?? 0),
        employeeIds: staffLinks.map((link) => link.staff_id),
        bookingVisibility:
          (row.booking_visibility as string | null) ?? undefined,
        confirmationMode: (row.confirmation_mode as string | null) ?? undefined,
      };
    }),
    employees: mappedEmployees,
  };
});

export function knowledgeToPromptBlock(knowledge: BusinessKnowledge): string {
  const hours = knowledge.hours
    .map((h) =>
      h.isOpen
        ? `${h.dayLabel}: ${h.openTime}–${h.closeTime}`
        : `${h.dayLabel}: closed`,
    )
    .join("\n");

  const services = knowledge.services
    .map((s) => {
      const providers =
        s.employeeIds && s.employeeIds.length > 0
          ? knowledge.employees
              .filter((e) => s.employeeIds?.includes(e.id))
              .map((e) => e.name)
              .join(", ")
          : "";
      return `- ${s.name} (${s.durationMinutes} min, $${s.price.toFixed(2)}${
        s.category ? `, ${s.category}` : ""
      }${s.cleanupMinutes ? `, cleanup ${s.cleanupMinutes}m` : ""})${
        s.description ? `: ${s.description}` : ""
      }${providers ? ` [staff: ${providers}]` : ""}`;
    })
    .join("\n");

  const staff = knowledge.employees
    .map((e) => {
      const hours = e.workingHoursSummary
        ? ` · hours: ${e.workingHoursSummary}`
        : "";
      const online =
        e.acceptOnlineBookings === false ? " · online booking off" : "";
      return `- ${e.name}${e.title ? ` (${e.title})` : ""}${hours}${online}`;
    })
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
