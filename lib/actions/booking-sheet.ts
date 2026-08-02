"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getCustomerProfile } from "@/lib/actions/customers";
import { getActiveLocationId } from "@/lib/actions/location";
import { previewAvailableSlots } from "@/lib/booking-engine";
import { addDays, format } from "date-fns";

export type BookingSheetSlot = {
  start: string;
  end: string;
  score: number;
  warnings: string[];
};

export type BookingSheetAvailability = {
  slots: BookingSheetSlot[];
  emptyReason: string | null;
  alternativeStaff: Array<{
    staffId: string;
    name: string;
    slotCount: number;
  }>;
  alternativeDays: Array<{ date: string; label: string; slotCount: number }>;
};

function mergeSlots(rows: BookingSheetSlot[]): BookingSheetSlot[] {
  const byStart = new Map<string, BookingSheetSlot>();
  for (const slot of rows) {
    const key = slot.start.slice(0, 16);
    const prev = byStart.get(key);
    if (!prev || slot.score > prev.score) {
      byStart.set(key, slot);
    }
  }
  return [...byStart.values()].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}

/** Rich availability for Booking Sheet — Booking Engine only. */
export async function previewBookingSheetAvailability(input: {
  serviceId: string;
  /** Empty string = unassigned — union openings across staffOptions. */
  staffId: string;
  locationId: string;
  date: string;
  excludeAppointmentId?: string;
  staffOptions?: Array<{ id: string; name: string }>;
  /** When set (e.g. duration override), availability uses this length. */
  durationMinutes?: number;
}): Promise<BookingSheetAvailability> {
  const business = await getOrCreateBusiness();
  const locationId = input.locationId || (await getActiveLocationId());

  if (!input.serviceId || !locationId) {
    return {
      slots: [],
      emptyReason: "Choose a service to see open times.",
      alternativeStaff: [],
      alternativeDays: [],
    };
  }

  const staffPool =
    input.staffId.trim().length > 0
      ? [{ id: input.staffId, name: "Selected" }]
      : (input.staffOptions ?? []).slice(0, 12);

  if (staffPool.length === 0) {
    return {
      slots: [],
      emptyReason: input.staffId
        ? "Choose a service and employee to see open times."
        : "No employees are assigned to this service yet. Add staff or choose another service.",
      alternativeStaff: [],
      alternativeDays: [],
    };
  }

  const collected: BookingSheetSlot[] = [];
  let primaryEmpty: string | null = null;

  for (const member of staffPool) {
    const result = await previewAvailableSlots({
      channel: "staff",
      businessId: business.id,
      locationId,
      serviceId: input.serviceId,
      staffId: member.id,
      date: input.date,
      excludeAppointmentId: input.excludeAppointmentId,
      durationMinutes: input.durationMinutes,
    });
    for (const s of result.slots) {
      collected.push({
        start: s.start,
        end: s.end,
        score: s.score,
        warnings: s.warnings.map((w) => w.message ?? w.code),
      });
    }
    if (
      input.staffId &&
      member.id === input.staffId &&
      result.slots.length === 0
    ) {
      primaryEmpty =
        result.emptyReason?.message ??
        result.conflicts?.[0]?.message ??
        "No available times for this employee on the selected date.";
    }
  }

  const slots = mergeSlots(collected);
  const emptyReason =
    slots.length === 0
      ? (primaryEmpty ??
        (input.staffId
          ? "No available times for this employee on the selected date."
          : "No times are available on this date. Try another day or employee."))
      : null;

  const alternativeStaff: BookingSheetAvailability["alternativeStaff"] = [];
  if (input.staffId) {
    for (const member of (input.staffOptions ?? []).slice(0, 6)) {
      if (member.id === input.staffId) continue;
      const alt = await previewAvailableSlots({
        channel: "staff",
        businessId: business.id,
        locationId,
        serviceId: input.serviceId,
        staffId: member.id,
        date: input.date,
        excludeAppointmentId: input.excludeAppointmentId,
        durationMinutes: input.durationMinutes,
      });
      if (alt.slots.length > 0) {
        alternativeStaff.push({
          staffId: member.id,
          name: member.name,
          slotCount: alt.slots.length,
        });
      }
    }
    alternativeStaff.sort((a, b) => b.slotCount - a.slotCount);
  }

  const dayStaffId = input.staffId || staffPool[0]?.id;
  const alternativeDays: BookingSheetAvailability["alternativeDays"] = [];
  if (dayStaffId) {
    const base = new Date(`${input.date}T12:00:00`);
    for (let i = 1; i <= 3; i++) {
      const day = addDays(base, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const alt = await previewAvailableSlots({
        channel: "staff",
        businessId: business.id,
        locationId,
        serviceId: input.serviceId,
        staffId: dayStaffId,
        date: dateStr,
        excludeAppointmentId: input.excludeAppointmentId,
        durationMinutes: input.durationMinutes,
      });
      if (alt.slots.length > 0) {
        alternativeDays.push({
          date: dateStr,
          label: format(day, "EEE, MMM d"),
          slotCount: alt.slots.length,
        });
      }
    }
  }

  return { slots, emptyReason, alternativeStaff, alternativeDays };
}

/** Lazy customer snapshot for Booking Sheet CRM panel. */
export async function getBookingSheetCustomerSnapshot(customerId: string) {
  const profile = await getCustomerProfile(customerId);
  if (!profile) return null;

  const outstanding = (profile.upcoming ?? []).filter((a) => {
    const deposit = Number(
      (a as { deposit_cents?: number }).deposit_cents ?? 0,
    );
    const price =
      (a.service as { price?: number } | null)?.price != null
        ? Math.round(Number((a.service as { price?: number }).price) * 100)
        : Number((a as { price_cents?: number | null }).price_cents ?? 0);
    return price > 0 && deposit < price && a.status !== "cancelled";
  }).length;

  return {
    customer: profile.customer,
    lastVisit: profile.metrics.lastVisit,
    upcomingCount: profile.metrics.upcomingCount,
    outstandingBalanceCount: outstanding,
    upcoming: (profile.upcoming ?? []).slice(0, 3).map((a) => ({
      id: a.id,
      start: a.start_time,
      serviceName: (a.service as { name?: string } | null)?.name ?? "Service",
      status: a.status,
    })),
    historyPreview: (profile.history ?? []).slice(0, 5).map((a) => ({
      id: a.id,
      start: a.start_time,
      serviceName: (a.service as { name?: string } | null)?.name ?? "Service",
      status: a.status,
    })),
    communicationsCount: profile.communications?.history?.length ?? 0,
  };
}
