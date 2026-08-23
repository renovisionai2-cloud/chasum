"use server";

import { addMinutes, parseISO } from "date-fns";
import { headers } from "next/headers";
import { getPublicBusinessBySlug } from "@/lib/booking/slug-alias-lookup";
import { getPublicAvailableSlots } from "@/lib/actions/scheduling";
import { isPublicBookingAllowed } from "@/lib/booking/access";
import { captureBookingFailure } from "@/lib/observability/logger";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type {
  PublicBookingState,
  StaffWithServices,
} from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export type PublicSlotOption = {
  start: string;
  /** Null when the customer chose “Any available staff” (unassigned). */
  staffId: string | null;
  staffName: string | null;
};

async function publicRateLimit(
  action: "publicBooking" | "publicSlots" | "publicLookup",
  slug: string,
): Promise<string | null> {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const preset = RATE_LIMITS[action];
  const result = checkRateLimit({
    key: `public:${action}:${slug}:${ip}`,
    ...preset,
  });
  if (!result.allowed) {
    return "Too many requests. Please wait a moment and try again.";
  }
  return null;
}

export async function getAvailableSlots(
  slug: string,
  serviceId: string,
  staffId: string,
  date: string,
  locationId?: string,
) {
  return getPublicAvailableSlots(slug, serviceId, staffId, date, locationId);
}

/**
 * Real slots only — merges Availability Engine results across eligible staff.
 * Never invents times; empty when nobody is free.
 * When staffId is omitted, returns the union of openings (deduped by start time).
 */
export async function getPublicSlotOptions(input: {
  slug: string;
  serviceId: string;
  date: string;
  locationId?: string;
  staffId?: string | null;
  staff: Pick<StaffWithServices, "id" | "name" | "staff_services" | "location_id">[];
}): Promise<PublicSlotOption[]> {
  const limited = await publicRateLimit("publicSlots", input.slug);
  if (limited) return [];

  const business = await getPublicBusinessBySlug(input.slug);
  if (!business || !input.locationId) return [];

  const anyAvailable = !input.staffId;

  const eligible = input.staff.filter((member) => {
    if (input.locationId && member.location_id !== input.locationId) return false;
    if (input.staffId && member.id !== input.staffId) return false;
    return member.staff_services.some((ss) => ss.service_id === input.serviceId);
  });

  if (eligible.length === 0) return [];

  const { previewAvailableSlots } = await import("@/lib/booking-engine");

  const scored: Array<PublicSlotOption & { score: number }> = [];

  for (const member of eligible) {
    const result = await previewAvailableSlots({
      channel: "public",
      businessId: business.id,
      locationId: input.locationId,
      serviceId: input.serviceId,
      staffId: member.id,
      date: input.date,
    });
    for (const slot of result.slots) {
      scored.push({
        start: slot.start,
        staffId: anyAvailable ? null : member.id,
        staffName: anyAvailable ? null : member.name,
        score: slot.score,
      });
    }
  }

  // Deduplicate identical start times when multiple employees are free.
  const byStart = new Map<string, (typeof scored)[number]>();
  for (const row of scored) {
    const key = row.start.slice(0, 16);
    const prev = byStart.get(key);
    if (!prev || row.score > prev.score) {
      byStart.set(key, row);
    }
  }

  const merged = [...byStart.values()].sort(
    (a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime() ||
      b.score - a.score,
  );

  return merged.map(({ start, staffId, staffName }) => ({
    start,
    staffId,
    staffName,
  }));
}

/** Returning customer prefill — exact email match within the tenant only. */
export async function lookupPublicCustomer(
  slug: string,
  email: string,
): Promise<{ found: boolean; name?: string; phone?: string | null; error?: string }> {
  const limited = await publicRateLimit("publicLookup", slug);
  if (limited) return { found: false, error: limited };

  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) return { found: false };

  const business = await getPublicBusinessBySlug(slug);
  if (!business) return { found: false };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_booking_customer", {
    p_business_id: business.id,
    p_email: trimmed,
  });

  if (error || !data?.length) return { found: false };

  const row = Array.isArray(data) ? data[0] : data;
  return {
    found: true,
    name: row.name as string,
    phone: (row.phone as string | null) ?? null,
  };
}

function bookingReference(appointmentId: string): string {
  return `CHS-${appointmentId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function bookAppointment(
  _prev: PublicBookingState,
  formData: FormData,
): Promise<PublicBookingState> {
  const slug = formData.get("slug") as string;
  const locationId = (formData.get("location_id") as string) || null;
  const serviceId = formData.get("service_id") as string;
  const staffIdRaw = String(formData.get("staff_id") ?? "").trim();
  const anyStaff =
    formData.get("any_staff") === "1" ||
    formData.get("any_staff") === "true" ||
    !staffIdRaw;
  const staffId = anyStaff ? "" : staffIdRaw;
  const startTime = formData.get("start_time") as string;
  const customerName = (formData.get("customer_name") as string)?.trim();
  const customerEmail = (formData.get("customer_email") as string)?.trim();
  const customerPhone = (formData.get("customer_phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const inviteCode = (formData.get("invite_code") as string) || null;

  if (!slug || !serviceId || !startTime || !customerName || !customerEmail) {
    return { error: "Please fill in all required fields." };
  }
  if (!anyStaff && !staffId) {
    return { error: "Please choose a staff member or Any available staff." };
  }

  const limited = await publicRateLimit("publicBooking", slug);
  if (limited) return { error: limited };

  const business = await getPublicBusinessBySlug(slug);
  if (!business) return { error: "Business not found." };

  if (!isPublicBookingAllowed(business, inviteCode)) {
    return { error: "Public booking is not available for this business." };
  }

  const supabase = await createClient();
  const appointmentStatus =
    business.public_booking_mode === "request_approval" ? "pending" : "confirmed";

  const [{ data: service }, locationResult, taxRatesResult] = await Promise.all([
    supabase
      .from("services")
      .select(
        "duration_minutes, name, price, online_booking, deposit_cents, deposit_required, tax_rate_bps",
      )
      .eq("id", serviceId)
      .eq("business_id", business.id)
      .eq("is_active", true)
      .single(),
    locationId
      ? supabase
          .from("locations")
          .select("name")
          .eq("id", locationId)
          .eq("business_id", business.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("tax_rates")
      .select("id, name, rate_bps, inclusive, is_default, is_active")
      .eq("business_id", business.id)
      .eq("is_active", true),
  ]);

  if (!service) return { error: "Service not available." };
  if (service.online_booking === false) {
    return { error: "This service is not available for online booking." };
  }

  const { resolveBookingFinancials } = await import(
    "@/lib/commerce/booking-financials"
  );
  const publicFinancials = resolveBookingFinancials({
    catalogPriceCents: Math.round(Number(service.price) * 100),
    serviceTaxRateBps: service.tax_rate_bps ?? null,
    taxRates: (taxRatesResult.data ?? []) as Parameters<
      typeof resolveBookingFinancials
    >[0]["taxRates"],
    depositRequiredCents: service.deposit_cents,
    depositRequired: service.deposit_required,
  });

  let staffMember: { id: string; name: string } | null = null;
  if (!anyStaff) {
    const { data } = await supabase
      .from("staff")
      .select("id, name")
      .eq("id", staffId)
      .eq("business_id", business.id)
      .eq("is_active", true)
      .single();
    staffMember = data;
    if (!staffMember) return { error: "Provider not available." };
  }

  const start = parseISO(startTime);
  const end = addMinutes(start, service.duration_minutes);

  // Any-available: require at least one eligible employee free at this start.
  if (anyStaff) {
    if (!locationId) {
      return { error: "Location is required to book." };
    }
    const { data: linked } = await supabase
      .from("staff_services")
      .select("staff_id, staff!inner(id, name, is_active, location_id)")
      .eq("service_id", serviceId);
    const eligibleIds = (linked ?? [])
      .map((row) => {
        const st = row.staff as unknown as {
          id: string;
          name: string;
          is_active: boolean;
          location_id: string | null;
        } | null;
        if (!st?.is_active) return null;
        if (st.location_id && st.location_id !== locationId) return null;
        return st.id;
      })
      .filter((id): id is string => Boolean(id));

    if (eligibleIds.length === 0) {
      return {
        error:
          "This service has no eligible staff for online booking. Please contact the business.",
      };
    }

    const { previewAvailableSlots } = await import("@/lib/booking-engine");
    const dateStr = startTime.slice(0, 10);
    let someoneFree = false;
    for (const eid of eligibleIds.slice(0, 12)) {
      const result = await previewAvailableSlots({
        channel: "public",
        businessId: business.id,
        locationId,
        serviceId,
        staffId: eid,
        date: dateStr,
      });
      if (
        result.slots.some(
          (s) => Math.abs(parseISO(s.start).getTime() - start.getTime()) < 1000,
        )
      ) {
        someoneFree = true;
        break;
      }
    }
    if (!someoneFree) {
      return { error: "This time slot is no longer available." };
    }
  }

  const { data: customerId, error: customerError } = await supabase.rpc(
    "upsert_booking_customer",
    {
      p_business_id: business.id,
      p_name: customerName,
      p_email: customerEmail,
      p_phone: customerPhone,
    },
  );

  if (customerError || !customerId) {
    await captureBookingFailure(
      customerError ?? new Error("customer upsert failed"),
      { slug, channel: "public" },
    );
    return { error: customerError?.message ?? "Failed to save customer details." };
  }

  let appointmentId: string | null = null;

  if (anyStaff) {
    const { assertNamedStaffRequired } = await import(
      "@/lib/booking/optional-staff"
    );
    const blocked = assertNamedStaffRequired(null, "public");
    if (blocked) {
      return { error: blocked };
    }

    const { createBooking } = await import("@/lib/booking-engine");
    const result = await createBooking({
      channel: "public",
      businessId: business.id,
      locationId: locationId!,
      serviceId,
      staffId: null,
      customerId: customerId as string,
      requestedStart: start.toISOString(),
      notes,
      requestedStatus: appointmentStatus,
      priceCents: publicFinancials.subtotalCents,
      taxCents: publicFinancials.taxCents,
      depositCents: publicFinancials.depositRequiredCents,
    });
    if (result.phase !== "success" || !result.data?.appointmentId) {
      await captureBookingFailure(
        new Error(result.error ?? "unassigned public booking failed"),
        { slug, channel: "public" },
      );
      const msg = result.error ?? "";
      return {
        error: msg.includes("Time slot")
          ? "This time slot is no longer available."
          : msg || "Could not complete booking. Please try another time.",
      };
    }
    appointmentId = result.data.appointmentId;
  } else {
    const { data, error: appointmentError } = await supabase.rpc(
      "create_public_appointment",
      {
        p_business_id: business.id,
        p_service_id: serviceId,
        p_staff_id: staffId,
        p_customer_id: customerId,
        p_start_time: start.toISOString(),
        p_end_time: end.toISOString(),
        p_notes: notes,
        p_location_id: locationId,
        p_status: appointmentStatus,
      },
    );

    if (appointmentError) {
      await captureBookingFailure(appointmentError, {
        slug,
        channel: "public",
      });
      const message = appointmentError.message.includes("Time slot")
        ? "This time slot is no longer available."
        : appointmentError.message;
      return { error: message };
    }
    appointmentId = data as string;
  }

  let emailQueued = false;
  let notifications: PublicBookingState["notifications"];
  if (appointmentId) {
    const { handleAppointmentEvent } = await import(
      "@/lib/integrations/notifications/orchestrator"
    );
    await handleAppointmentEvent(
      appointmentId,
      appointmentStatus === "pending" ? "created" : "confirmed",
    );
    try {
      const { deliverBookingNotifications } = await import(
        "@/lib/notifications/booking-delivery"
      );
      const report = await deliverBookingNotifications(appointmentId);
      notifications = report.items;
      emailQueued = report.items.some(
        (i) => i.channel === "customer_email" && i.status === "sent",
      );
    } catch {
      emailQueued = appointmentStatus === "confirmed";
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/staff");

  const id = appointmentId as string;
  const reference = bookingReference(id);
  const staffDisplayName = anyStaff
    ? "Any available staff"
    : (staffMember?.name ?? "To be assigned");

  return {
    success:
      appointmentStatus === "pending"
        ? `Your ${service.name} request was submitted. We will confirm shortly.`
        : `Your ${service.name} appointment is confirmed.`,
    appointmentId: id,
    reference,
    emailQueued,
    notifications,
    summary: {
      serviceName: service.name,
      staffName: staffDisplayName,
      staffUnassigned: anyStaff,
      locationName: locationResult.data?.name ?? null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      customerName,
      customerEmail,
      durationMinutes: service.duration_minutes,
      price: Number(service.price),
    },
  };
}
