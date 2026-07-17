"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  createBooking,
  logAppointmentChange,
} from "@/lib/booking-engine";
import type { BookingResource, PortalAppointment } from "@/lib/booking-engine/types";
import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ActionState } from "@/lib/types/booking";
import { addMinutes, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

function revalidateCalendar() {
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/automation");
}

export async function getBookingResources(): Promise<BookingResource[]> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_resources")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name");

  if (error) {
    logQueryError("booking-resources", error.message);
    return [];
  }
  return (data as BookingResource[]) ?? [];
}

export async function duplicateAppointment(
  appointmentId: string,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data: source, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (error || !source) return { error: "Appointment not found." };

  const start = parseISO(source.start_time as string);
  const end = parseISO(source.end_time as string);
  const durationMin = Math.max(
    5,
    Math.round((end.getTime() - start.getTime()) / 60_000),
  );
  const newStart = addMinutes(start, durationMin + 30);
  const newEnd = addMinutes(newStart, durationMin);

  const result = await createBooking({
    channel: "staff",
    businessId: business.id,
    locationId: source.location_id as string,
    serviceId: source.service_id as string,
    staffId: source.staff_id as string,
    customerId: source.customer_id as string,
    requestedStart: newStart.toISOString(),
    requestedEnd: newEnd.toISOString(),
    durationMinutes: durationMin,
    notes: (source.notes as string | null) ?? null,
    requestedStatus: "pending",
    roomId: (source.room_id as string | null) ?? null,
  });

  if (result.phase !== "success" || !result.data?.appointmentId) {
    return {
      error:
        result.error ??
        result.conflicts?.[0]?.message ??
        "Cannot duplicate into a conflicting slot.",
    };
  }

  await supabase
    .from("appointments")
    .update({
      color: source.color ?? null,
      price_cents: source.price_cents ?? null,
      tax_cents: source.tax_cents ?? 0,
      discount_cents: source.discount_cents ?? 0,
      deposit_cents: source.deposit_cents ?? 0,
      internal_notes: source.internal_notes ?? null,
      custom_fields: source.custom_fields ?? {},
      travel_minutes: source.travel_minutes ?? 0,
    })
    .eq("id", result.data.appointmentId)
    .eq("business_id", business.id);

  await logAppointmentChange({
    businessId: business.id,
    appointmentId: result.data.appointmentId,
    action: "duplicate",
    beforeState: { sourceId: appointmentId },
    afterState: { start_time: newStart.toISOString() },
  });

  revalidateCalendar();
  return { success: "Appointment duplicated." };
}

export async function undoLastAppointmentChange(): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data: entry, error } = await supabase
    .from("appointment_change_log")
    .select("*")
    .eq("business_id", business.id)
    .in("action", ["reschedule", "resize", "update"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !entry) {
    return { error: "Nothing to undo." };
  }

  const before = entry.before_state as Record<string, unknown> | null;
  if (!before?.start_time || !before?.end_time) {
    return { error: "Undo snapshot incomplete." };
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      start_time: before.start_time,
      end_time: before.end_time,
      staff_id: before.staff_id ?? undefined,
      location_id: before.location_id ?? undefined,
    })
    .eq("id", entry.appointment_id)
    .eq("business_id", business.id);

  if (updateError) return { error: updateError.message };

  await supabase
    .from("appointment_change_log")
    .delete()
    .eq("id", entry.id);

  revalidateCalendar();
  return { success: "Change undone." };
}

export async function issueCustomerPortalToken(
  customerId: string,
): Promise<ActionState & { token?: string; url?: string }> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const token = randomBytes(24).toString("hex");
  const expires = new Date();
  expires.setDate(expires.getDate() + 90);

  const { error } = await supabase.from("customer_portal_tokens").insert({
    business_id: business.id,
    customer_id: customerId,
    token,
    expires_at: expires.toISOString(),
  });

  if (error) {
    return {
      error:
        error.message.includes("customer_portal_tokens")
          ? "Apply migration 019_booking_engine_2 to enable the customer portal."
          : error.message,
    };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return {
    success: "Portal link created.",
    token,
    url: `${base}/portal/${token}`,
  };
}

export async function getPortalSession(token: string): Promise<{
  error?: string;
  business?: { id: string; name: string; slug: string; logo_url?: string | null };
  customer?: { id: string; name: string; email: string };
  upcoming?: PortalAppointment[];
  past?: PortalAppointment[];
} | null> {
  if (!token?.trim()) return { error: "Invalid portal link." };

  const service = createServiceClient();
  const { data: row, error } = await service
    .from("customer_portal_tokens")
    .select("*, customer:customers(id, name, email), business:businesses(id, name, slug, logo_url)")
    .eq("token", token.trim())
    .maybeSingle();

  if (error || !row) return { error: "Portal link not found." };
  if (row.expires_at && new Date(row.expires_at as string).getTime() < Date.now()) {
    return { error: "Portal link has expired." };
  }

  await service
    .from("customer_portal_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id);

  const customerId = row.customer_id as string;
  const businessId = row.business_id as string;
  const now = new Date().toISOString();

  const { data: appointments } = await service
    .from("appointments")
    .select(
      `id, start_time, end_time, status, notes, invoice_number, price_cents, deposit_cents,
       service:services(name, price), staff:staff(name), location:locations(name)`,
    )
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .neq("status", "cancelled")
    .order("start_time", { ascending: false })
    .limit(100);

  const rows = (appointments ?? []) as PortalAppointment[];
  const upcoming = rows
    .filter((a) => a.start_time >= now)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const past = rows.filter((a) => a.start_time < now);

  const business = row.business as {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  };
  const customer = row.customer as { id: string; name: string; email: string };

  return {
    business,
    customer,
    upcoming,
    past,
  };
}

export async function portalCancelAppointment(
  token: string,
  appointmentId: string,
): Promise<ActionState> {
  const session = await getPortalSession(token);
  if (session?.error || !session?.customer || !session.business) {
    return { error: session?.error ?? "Invalid portal session." };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("customer_id", session.customer.id)
    .eq("business_id", session.business.id);

  if (error) return { error: error.message };
  return { success: "Appointment cancelled." };
}
