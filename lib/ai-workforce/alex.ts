"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import { fetchAvailableSlots } from "@/lib/actions/scheduling";
import { createClient } from "@/lib/supabase/server";
import { format, addDays } from "date-fns";

export type AlexSlotRecommendation = {
  date: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  slots: string[];
};

/**
 * Alex — AI Scheduler recommendations from the real availability engine only.
 * Never invents times; returns empty when no slots exist.
 */
export async function getAlexAvailabilityRecommendations(input?: {
  serviceId?: string;
  staffId?: string;
  date?: string;
  daysAhead?: number;
}): Promise<{
  recommendations: AlexSlotRecommendation[];
  message: string;
}> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, is_active, location_id")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .eq("location_id", locationId),
    supabase
      .from("staff")
      .select("id, name, is_active, location_id, staff_services(service_id)")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .eq("location_id", locationId),
  ]);

  if (!services?.length || !staff?.length) {
    return {
      recommendations: [],
      message:
        "Alex needs at least one active service and staff member at this location before proposing times.",
    };
  }

  const service =
    (input?.serviceId
      ? services.find((s) => s.id === input.serviceId)
      : null) ?? services[0];

  const eligibleStaff = (staff ?? []).filter((member) => {
    if (input?.staffId && member.id !== input.staffId) return false;
    const links = member.staff_services as { service_id: string }[] | null;
    return (links ?? []).some((ss) => ss.service_id === service.id);
  });

  if (!eligibleStaff.length) {
    return {
      recommendations: [],
      message: `Alex found no staff assigned to ${service.name} at this location.`,
    };
  }

  const startDate = input?.date ? new Date(`${input.date}T12:00:00`) : new Date();
  const days = Math.min(Math.max(input?.daysAhead ?? 3, 1), 7);
  const recommendations: AlexSlotRecommendation[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const day = addDays(startDate, dayOffset);
    const dateStr = format(day, "yyyy-MM-dd");

    for (const member of eligibleStaff.slice(0, 3)) {
      const slots = await fetchAvailableSlots(
        business.id,
        service.id,
        member.id,
        dateStr,
        undefined,
        locationId,
      );

      if (slots.length === 0) continue;

      recommendations.push({
        date: dateStr,
        staffId: member.id,
        staffName: member.name,
        serviceId: service.id,
        serviceName: service.name,
        slots: slots.slice(0, 6),
      });

      if (recommendations.length >= 4) break;
    }
    if (recommendations.length >= 4) break;
  }

  if (recommendations.length === 0) {
    return {
      recommendations: [],
      message:
        "Alex checked the scheduling engine and found no open slots in the next few days for the selected service.",
    };
  }

  const totalSlots = recommendations.reduce((n, r) => n + r.slots.length, 0);
  return {
    recommendations,
    message: `Alex found ${totalSlots} real available slot${totalSlots === 1 ? "" : "s"} from get_available_slots for ${service.name}.`,
  };
}
