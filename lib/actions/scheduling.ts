"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId, getLocationScope } from "@/lib/actions/location";
import {
  previewAvailableSlots,
  validateBooking,
} from "@/lib/booking-engine";

/**
 * Thin server-action adapters over the Booking Engine.
 * Slot authority remains SQL RPCs; TypeScript orchestrates via the facade.
 */
export async function fetchAvailableSlots(
  businessId: string,
  serviceId: string,
  staffId: string,
  date: string,
  excludeAppointmentId?: string,
  locationId?: string,
): Promise<string[]> {
  if (!locationId) return [];

  const result = await previewAvailableSlots({
    channel: "staff",
    businessId,
    locationId,
    serviceId,
    staffId,
    date,
    excludeAppointmentId,
  });

  return result.slots.map((slot) => slot.start);
}

export async function getDashboardAvailableSlots(
  serviceId: string,
  staffId: string,
  date: string,
  excludeAppointmentId?: string,
  locationId?: string,
): Promise<string[]> {
  const business = await getOrCreateBusiness();
  const resolvedLocationId = locationId || (await getActiveLocationId());
  return fetchAvailableSlots(
    business.id,
    serviceId,
    staffId,
    date,
    excludeAppointmentId,
    resolvedLocationId,
  );
}

export async function getPublicAvailableSlots(
  slug: string,
  serviceId: string,
  staffId: string,
  date: string,
  locationId?: string,
): Promise<string[]> {
  const { getBusinessBySlug } = await import("@/lib/actions/business");
  const business = await getBusinessBySlug(slug);
  if (!business || !locationId) return [];

  const result = await previewAvailableSlots({
    channel: "public",
    businessId: business.id,
    locationId,
    serviceId,
    staffId,
    date,
  });

  return result.slots.map((slot) => slot.start);
}

export async function validateAppointmentSlot(params: {
  businessId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
  locationId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!params.locationId) {
    return { ok: false, error: "Location is required." };
  }

  const result = await validateBooking({
    channel: "staff",
    businessId: params.businessId,
    locationId: params.locationId,
    serviceId: params.serviceId,
    staffId: params.staffId,
    requestedStart: params.startTime,
    requestedEnd: params.endTime,
    excludeAppointmentId: params.excludeAppointmentId,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.conflicts[0]?.message ?? "This time slot is not available.",
    };
  }

  return { ok: true };
}

export async function getDashboardLocationScope() {
  return getLocationScope();
}
