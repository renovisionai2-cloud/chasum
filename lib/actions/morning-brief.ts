"use server";
import { readFinancialAggregate, singleFinancialAmount } from "@/lib/commerce/financial-aggregate";
import type { FinancialAmount } from "@/lib/commerce/financial-aggregate/types";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import { fetchAvailableSlots } from "@/lib/actions/scheduling";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export type MorningBriefData = {
  todayAppointments: number;
  todayRevenue: FinancialAmount;
  staffWorking: number;
  availableSlots: number;
  waitlistCount: number;
  noShows: number;
  outstandingPayments: number | null;
  pendingConfirmations: number;
  customersToday: number;
  summer: {
    bookingsToday: number;
    reschedulesToday: number;
    confirmationsToday: number;
  };
  chase: {
    revenueDeltaPct: number | null;
    recommendation: string;
    availableSlots: number;
    overdueCustomers: number | null;
  };
};

/**
 * Compact Morning Brief for the Day View Control Center.
 * Uses Booking/Availability engines for open slots; no invented availability.
 */
export async function getMorningBrief(): Promise<MorningBriefData> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const dateStr = format(now, "yyyy-MM-dd");
  const dow = now.getDay();


  const [
    { data: todayAppts },
    { count: pendingCount },
    { count: waitlistCount },
    { data: services },
    { data: staff },
    { data: workingHours },
    { data: changeLog },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, customer_id, status, price_cents, deposit_cents, service:services(price)",
      )
      .eq("business_id", business.id)
      .eq("location_id", locationId)
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
      .from("waitlists")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "waiting"),
    supabase
      .from("services")
      .select("id")
      .eq("business_id", business.id)
      .eq("location_id", locationId)
      .eq("is_active", true)
      .limit(3),
    supabase
      .from("staff")
      .select("id, name, staff_services(service_id)")
      .eq("business_id", business.id)
      .eq("location_id", locationId)
      .eq("is_active", true),
    supabase
      .from("staff_working_hours")
      .select("staff_id, is_working")
      .eq("day_of_week", dow)
      .eq("is_working", true),
    supabase
      .from("appointment_change_log")
      .select("action")
      .eq("business_id", business.id)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())
      .limit(200),
  ]);

  const rows = todayAppts ?? [];
  const activeRows = rows.filter((a) => a.status !== "cancelled");
  const noShows = rows.filter((a) => a.status === "no_show").length;
  const customersToday = new Set(
    activeRows.map((a) => a.customer_id).filter(Boolean),
  ).size;

  const todayRevenue = singleFinancialAmount(await readFinancialAggregate({ period: "today", locationId }));

  const outstandingPayments = null; // Derived caches do not authorize recollection.

  const workingStaffIds = new Set(
    (workingHours ?? []).map((h) => h.staff_id as string),
  );
  const staffList = staff ?? [];
  const staffWorking =
    workingStaffIds.size > 0
      ? staffList.filter((s) => workingStaffIds.has(s.id)).length
      : staffList.length;

  let availableSlots = 0;
  const serviceList = services ?? [];
  for (const service of serviceList.slice(0, 2)) {
    for (const member of staffList.slice(0, 5)) {
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
      availableSlots += slots.filter(
        (iso) => new Date(iso).getTime() >= now.getTime(),
      ).length;
      if (availableSlots > 200) break;
    }
    if (availableSlots > 200) break;
  }

  const logs = changeLog ?? [];
  const summer = {
    bookingsToday: logs.filter((l) => l.action === "create").length,
    reschedulesToday: logs.filter((l) => l.action === "reschedule").length,
    confirmationsToday: activeRows.filter((a) => a.status === "confirmed")
      .length,
  };

  const yesterdayCollected = singleFinancialAmount(await readFinancialAggregate({ period: "yesterday", locationId }));
  const revenueDeltaPct = todayRevenue.state === "EXACT" && yesterdayCollected.state === "EXACT" && todayRevenue.currency === yesterdayCollected.currency && yesterdayCollected.cents > 0
    ? Math.round((todayRevenue.cents - yesterdayCollected.cents) * 100 / yesterdayCollected.cents) : null;

  let recommendation =
    activeRows.length === 0
      ? availableSlots > 0
        ? `No appointments yet today — ${availableSlots} open slots are ready when bookings come in.`
        : "No appointments on the board yet. Confirm hours and staff availability if you expect walk-ins."
      : "Schedule looks steady — keep confirming pending bookings.";
  if (activeRows.length > 0 && availableSlots >= 5 && activeRows.length < staffWorking * 2) {
    recommendation = `${format(now, "EEEE")} looks underbooked — ${availableSlots} open slots remain.`;
  } else if ((pendingCount ?? 0) > 3) {
    recommendation = `${pendingCount} confirmations waiting — clear the queue first.`;
  } else if (revenueDeltaPct != null && revenueDeltaPct >= 10) {
    recommendation = `Collected money is up ${revenueDeltaPct}% vs yesterday — protect high-value slots.`;
  }

  return {
    todayAppointments: activeRows.length,
    todayRevenue,
    staffWorking,
    availableSlots,
    waitlistCount: waitlistCount ?? 0,
    noShows,
    outstandingPayments,
    pendingConfirmations: pendingCount ?? 0,
    customersToday,
    summer,
    chase: {
      revenueDeltaPct,
      recommendation,
      availableSlots,
      overdueCustomers: outstandingPayments,
    },
  };
}
