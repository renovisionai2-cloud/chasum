"use server";

import { addMinutes, parseISO } from "date-fns";
import { getBusinessBySlug } from "@/lib/actions/business";
import { getPublicAvailableSlots } from "@/lib/actions/scheduling";
import { isPublicBookingAllowed } from "@/lib/booking/access";
import { createClient } from "@/lib/supabase/server";
import type {
  PublicBookingState,
  StaffWithServices,
} from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export type PublicSlotOption = {
  start: string;
  staffId: string;
  staffName: string;
};

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
 * Never invents times; empty when nobody is free. Sorted by engine score then time.
 */
export async function getPublicSlotOptions(input: {
  slug: string;
  serviceId: string;
  date: string;
  locationId?: string;
  staffId?: string | null;
  staff: Pick<StaffWithServices, "id" | "name" | "staff_services" | "location_id">[];
}): Promise<PublicSlotOption[]> {
  const business = await getBusinessBySlug(input.slug);
  if (!business || !input.locationId) return [];

  const eligible = input.staff.filter((member) => {
    if (input.locationId && member.location_id !== input.locationId) return false;
    if (input.staffId && member.id !== input.staffId) return false;
    return member.staff_services.some((ss) => ss.service_id === input.serviceId);
  });

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
        staffId: member.id,
        staffName: member.name,
        score: slot.score,
      });
    }
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      new Date(a.start).getTime() - new Date(b.start).getTime() ||
      a.staffName.localeCompare(b.staffName),
  );

  return scored.map(({ start, staffId, staffName }) => ({
    start,
    staffId,
    staffName,
  }));
}

/** Returning customer prefill — exact email match within the tenant only. */
export async function lookupPublicCustomer(
  slug: string,
  email: string,
): Promise<{ found: boolean; name?: string; phone?: string | null }> {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) return { found: false };

  const business = await getBusinessBySlug(slug);
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
  const staffId = formData.get("staff_id") as string;
  const startTime = formData.get("start_time") as string;
  const customerName = (formData.get("customer_name") as string)?.trim();
  const customerEmail = (formData.get("customer_email") as string)?.trim();
  const customerPhone = (formData.get("customer_phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const inviteCode = (formData.get("invite_code") as string) || null;

  if (!slug || !serviceId || !staffId || !startTime || !customerName || !customerEmail) {
    return { error: "Please fill in all required fields." };
  }

  const business = await getBusinessBySlug(slug);
  if (!business) return { error: "Business not found." };

  if (!isPublicBookingAllowed(business, inviteCode)) {
    return { error: "Public booking is not available for this business." };
  }

  const supabase = await createClient();
  const appointmentStatus =
    business.public_booking_mode === "request_approval" ? "pending" : "confirmed";

  const [{ data: service }, { data: staffMember }, locationResult] =
    await Promise.all([
      supabase
        .from("services")
        .select("duration_minutes, name, price, online_booking")
        .eq("id", serviceId)
        .eq("business_id", business.id)
        .eq("is_active", true)
        .single(),
      supabase
        .from("staff")
        .select("id, name")
        .eq("id", staffId)
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
    ]);

  if (!service) return { error: "Service not available." };
  if (service.online_booking === false) {
    return { error: "This service is not available for online booking." };
  }
  if (!staffMember) return { error: "Provider not available." };

  const start = parseISO(startTime);
  const end = addMinutes(start, service.duration_minutes);

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
    return { error: customerError?.message ?? "Failed to save customer details." };
  }

  const { data: appointmentId, error: appointmentError } = await supabase.rpc(
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
    const message = appointmentError.message.includes("Time slot")
      ? "This time slot is no longer available."
      : appointmentError.message;
    return { error: message };
  }

  let emailQueued = false;
  if (appointmentId) {
    const { handleAppointmentEvent } = await import(
      "@/lib/integrations/notifications/orchestrator"
    );
    await handleAppointmentEvent(
      appointmentId as string,
      appointmentStatus === "pending" ? "created" : "confirmed",
    );
    emailQueued = appointmentStatus === "confirmed";
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/staff");

  const id = appointmentId as string;
  const reference = bookingReference(id);

  return {
    success:
      appointmentStatus === "pending"
        ? `Your ${service.name} request was submitted. We will confirm shortly.`
        : `Your ${service.name} appointment is confirmed.`,
    appointmentId: id,
    reference,
    emailQueued,
    summary: {
      serviceName: service.name,
      staffName: staffMember.name,
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
