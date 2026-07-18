/**
 * Summer tools — ONLY Booking Engine, Availability Engine, CRM, and module knowledge.
 * No direct appointment SQL. No invented slots or prices.
 */

import { loadBusinessKnowledge } from "@/lib/ai-receptionist/knowledge";
import type { BusinessKnowledge } from "@/lib/ai-receptionist/types";
import {
  summerCancelBooking,
  summerCreateBooking,
  summerPreviewAvailableSlots,
  summerRescheduleBooking,
} from "@/lib/booking-engine/adapters/summer";
import type { BookingConflictReport } from "@/lib/booking-engine/types";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { getSummerCrmSnapshot } from "@/lib/crm/ai-knowledge";
import { touchCustomerActivity } from "@/lib/crm/service";
import { createClient } from "@/lib/supabase/server";
import { addDays, format } from "date-fns";
import type {
  SummerAppointmentCard,
  SummerBookingOption,
  SummerConflictExplanation,
} from "@/lib/summer/types";

export async function summerLoadKnowledge(locationId?: string | null) {
  return loadBusinessKnowledge({ locationId });
}

export async function summerLookupCustomer(input: {
  businessId: string;
  email?: string | null;
  phone?: string | null;
  customerId?: string | null;
}) {
  if (input.customerId) {
    const snap = await getSummerCrmSnapshot(input.businessId, input.customerId);
    return snap;
  }

  const supabase = await createClient();
  let customerId: string | null = null;

  if (input.email?.trim()) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", input.businessId)
      .ilike("email", input.email.trim())
      .maybeSingle();
    customerId = (data?.id as string | undefined) ?? null;
  }

  if (!customerId && input.phone?.trim()) {
    const digits = input.phone.replace(/\D/g, "");
    if (digits.length >= 7) {
      const { data } = await supabase
        .from("customers")
        .select("id, phone")
        .eq("business_id", input.businessId)
        .limit(80);
      const match = (data ?? []).find((c) =>
        String(c.phone ?? "")
          .replace(/\D/g, "")
          .includes(digits),
      );
      customerId = (match?.id as string | undefined) ?? null;
    }
  }

  if (!customerId) return null;
  return getSummerCrmSnapshot(input.businessId, customerId);
}

export async function summerPreviewOptions(input: {
  businessId: string;
  locationId: string;
  serviceId: string;
  staffId: string;
  daysAhead?: number;
  knowledge: BusinessKnowledge;
}): Promise<{
  options: SummerBookingOption[];
  conflicts: SummerConflictExplanation[];
}> {
  const service = input.knowledge.services.find((s) => s.id === input.serviceId);
  const staff = input.knowledge.employees.find((e) => e.id === input.staffId);
  const location = input.knowledge.locations.find((l) => l.id === input.locationId);
  const options: SummerBookingOption[] = [];
  const conflicts: SummerConflictExplanation[] = [];
  const days = input.daysAhead ?? 7;

  for (let i = 0; i < days && options.length < 8; i++) {
    const date = format(addDays(new Date(), i), "yyyy-MM-dd");
    const preview = await summerPreviewAvailableSlots({
      businessId: input.businessId,
      locationId: input.locationId,
      serviceId: input.serviceId,
      staffId: input.staffId,
      date,
    });

    if (preview.conflicts?.length) {
      for (const c of preview.conflicts.slice(0, 2)) {
        conflicts.push({
          code: c.code,
          message: c.message,
        });
      }
    }

    for (const slot of preview.slots.slice(0, 3)) {
      if (options.length >= 8) break;
      const start = slot.start;
      options.push({
        id: `${slot.staffId}-${start}`,
        startIso: start,
        endIso: slot.end,
        dateLabel: format(parseISO(start), "EEE, MMM d"),
        timeLabel: formatTime(parseISO(start)),
        serviceId: input.serviceId,
        serviceName: service?.name ?? "Service",
        staffId: input.staffId,
        staffName: staff?.name ?? "Team member",
        locationId: input.locationId,
        locationName: location?.name,
        price: service?.price,
      });
    }
  }

  return { options, conflicts };
}

/** Preview across eligible staff for a service (Availability Engine only). */
export async function summerPreviewForService(input: {
  businessId: string;
  locationId: string;
  serviceId: string;
  preferredStaffId?: string | null;
  knowledge: BusinessKnowledge;
}): Promise<{
  options: SummerBookingOption[];
  conflicts: SummerConflictExplanation[];
}> {
  const eligible = input.knowledge.employees.filter(
    (e) =>
      e.isActive !== false &&
      e.serviceIds.includes(input.serviceId) &&
      e.acceptOnlineBookings !== false,
  );

  const ordered = [
    ...eligible.filter((e) => e.id === input.preferredStaffId),
    ...eligible.filter((e) => e.id !== input.preferredStaffId),
  ].slice(0, 4);

  const allOptions: SummerBookingOption[] = [];
  const conflicts: SummerConflictExplanation[] = [];

  for (const staff of ordered) {
    const { options, conflicts: c } = await summerPreviewOptions({
      businessId: input.businessId,
      locationId: input.locationId,
      serviceId: input.serviceId,
      staffId: staff.id,
      daysAhead: 5,
      knowledge: input.knowledge,
    });
    allOptions.push(...options);
    conflicts.push(...c);
    if (allOptions.length >= 8) break;
  }

  return {
    options: allOptions.slice(0, 8),
    conflicts: conflicts.slice(0, 4),
  };
}

export async function summerConfirmBooking(input: {
  businessId: string;
  locationId: string;
  serviceId: string;
  staffId: string;
  customerId: string;
  startIso: string;
  notes?: string | null;
}): Promise<
  | { ok: true; appointmentId: string }
  | { ok: false; conflicts: BookingConflictReport[]; error: string }
> {
  const result = await summerCreateBooking({
    businessId: input.businessId,
    locationId: input.locationId,
    serviceId: input.serviceId,
    staffId: input.staffId,
    customerId: input.customerId,
    requestedStart: input.startIso,
    notes: input.notes ?? "Booked by Summer",
    requestedStatus: "confirmed",
  });

  if (result.phase === "success" && result.data?.appointmentId) {
    await touchCustomerActivity(input.businessId, input.customerId);
    return { ok: true, appointmentId: result.data.appointmentId };
  }

  return {
    ok: false,
    conflicts: result.conflicts ?? [],
    error: result.error ?? "Could not create booking.",
  };
}

export async function summerConfirmReschedule(input: {
  businessId: string;
  appointmentId: string;
  startIso: string;
  staffId?: string;
  locationId?: string;
  customerId?: string | null;
}): Promise<
  | { ok: true; appointmentId: string }
  | { ok: false; conflicts: BookingConflictReport[]; error: string }
> {
  const result = await summerRescheduleBooking({
    businessId: input.businessId,
    appointmentId: input.appointmentId,
    requestedStart: input.startIso,
    staffId: input.staffId,
    locationId: input.locationId,
  });

  if (result.phase === "success") {
    if (input.customerId) {
      await touchCustomerActivity(input.businessId, input.customerId);
    }
    return { ok: true, appointmentId: input.appointmentId };
  }

  return {
    ok: false,
    conflicts: result.conflicts ?? [],
    error: result.error ?? "Could not reschedule.",
  };
}

export async function summerConfirmCancel(input: {
  businessId: string;
  appointmentId: string;
  customerId?: string | null;
  reason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await summerCancelBooking({
    businessId: input.businessId,
    appointmentId: input.appointmentId,
    reason: input.reason ?? "Cancelled by Summer",
  });

  if (result.phase === "success") {
    if (input.customerId) {
      await touchCustomerActivity(input.businessId, input.customerId);
    }
    return { ok: true };
  }

  return { ok: false, error: result.error ?? "Could not cancel appointment." };
}

export function upcomingToCards(
  upcoming: Array<{
    id: string;
    start: string;
    serviceName: string;
    staffName: string | null;
  }>,
): SummerAppointmentCard[] {
  return upcoming.map((a) => ({
    id: a.id,
    startIso: a.start,
    serviceName: a.serviceName,
    staffName: a.staffName,
    status: "upcoming",
  }));
}
