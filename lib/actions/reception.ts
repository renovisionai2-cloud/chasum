"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import { fetchAvailableSlots } from "@/lib/actions/scheduling";
import { createClient } from "@/lib/supabase/server";
import { format, addDays } from "date-fns";

export type ReceptionBrief = {
  todayAppointments: number;
  todayRevenue: number;
  customersToday: number;
  openTimeSlots: number;
  pendingConfirmations: number;
};

export type NextAvailableSlot = {
  start: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  date: string;
} | null;

/** Real metrics only for the reception Business Brief strip. */
export async function getReceptionBrief(): Promise<ReceptionBrief> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const dateStr = format(now, "yyyy-MM-dd");

  const [
    { data: todayAppts },
    { count: pendingCount },
    { data: services },
    { data: staff },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, customer_id, status, service:services(price)",
      )
      .eq("business_id", business.id)
      .eq("location_id", locationId)
      .neq("status", "cancelled")
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("location_id", locationId)
      .eq("status", "pending")
      .gte("start_time", now.toISOString()),
    supabase
      .from("services")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("location_id", locationId)
      .eq("is_active", true)
      .limit(3),
    supabase
      .from("staff")
      .select("id, name, staff_services(service_id)")
      .eq("business_id", business.id)
      .eq("location_id", locationId)
      .eq("is_active", true)
      .limit(5),
  ]);

  const rows = todayAppts ?? [];
  const customersToday = new Set(
    rows.map((a) => a.customer_id).filter(Boolean),
  ).size;

  const todayRevenue = rows
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => {
      const service = a.service as { price?: number } | { price?: number }[] | null;
      const price = Array.isArray(service)
        ? service[0]?.price
        : service?.price;
      return sum + Number(price ?? 0);
    }, 0);

  let openTimeSlots = 0;
  const serviceList = services ?? [];
  const staffList = staff ?? [];

  for (const service of serviceList.slice(0, 2)) {
    for (const member of staffList) {
      const links = member.staff_services as { service_id: string }[] | null;
      if (!(links ?? []).some((ss) => ss.service_id === service.id)) continue;
      const slots = await fetchAvailableSlots(
        business.id,
        service.id,
        member.id,
        dateStr,
        undefined,
        locationId,
      );
      openTimeSlots += slots.filter(
        (iso) => new Date(iso).getTime() >= now.getTime(),
      ).length;
      if (openTimeSlots > 200) break;
    }
    if (openTimeSlots > 200) break;
  }

  return {
    todayAppointments: rows.length,
    todayRevenue,
    customersToday,
    openTimeSlots,
    pendingConfirmations: pendingCount ?? 0,
  };
}

/** First real open slot from get_available_slots — never invents times. */
export async function getNextAvailableSlot(input?: {
  serviceId?: string;
  staffId?: string;
  daysAhead?: number;
}): Promise<NextAvailableSlot> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("location_id", locationId)
      .eq("is_active", true),
    supabase
      .from("staff")
      .select("id, name, staff_services(service_id)")
      .eq("business_id", business.id)
      .eq("location_id", locationId)
      .eq("is_active", true),
  ]);

  if (!services?.length || !staff?.length) return null;

  const service =
    (input?.serviceId
      ? services.find((s) => s.id === input.serviceId)
      : null) ?? services[0];

  const eligible = staff.filter((member) => {
    if (input?.staffId && member.id !== input.staffId) return false;
    const links = member.staff_services as { service_id: string }[] | null;
    return (links ?? []).some((ss) => ss.service_id === service.id);
  });

  if (!eligible.length) return null;

  const days = Math.min(Math.max(input?.daysAhead ?? 7, 1), 14);
  const now = Date.now();

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const day = addDays(new Date(), dayOffset);
    const dateStr = format(day, "yyyy-MM-dd");

    for (const member of eligible) {
      const slots = await fetchAvailableSlots(
        business.id,
        service.id,
        member.id,
        dateStr,
        undefined,
        locationId,
      );
      const next = slots.find((iso) => new Date(iso).getTime() >= now);
      if (next) {
        return {
          start: next,
          staffId: member.id,
          staffName: member.name,
          serviceId: service.id,
          serviceName: service.name,
          date: dateStr,
        };
      }
    }
  }

  return null;
}
