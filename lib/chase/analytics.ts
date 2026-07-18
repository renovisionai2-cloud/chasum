/**
 * Chase operations snapshot — aggregates existing engines only.
 * Never invents metrics. Never mutates bookings or CRM.
 */

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getMorningBrief } from "@/lib/actions/morning-brief";
import { getActiveLocationId } from "@/lib/actions/location";
import { getReportsBundle } from "@/lib/actions/reports";
import { queryUtilizationProjection } from "@/lib/booking-engine";
import { parseAiSettings } from "@/lib/business/settings";
import { CHASE_FORECAST_HOOKS } from "@/lib/chase/forecast";
import { buildChaseAlerts, buildChaseInsights } from "@/lib/chase/insights";
import type {
  ChaseBookingAnalytics,
  ChaseCustomerAnalytics,
  ChaseEmployeeAnalytics,
  ChaseKpis,
  ChaseOperationsSnapshot,
  ChaseSummerActivity,
  ChaseUpcomingClosure,
} from "@/lib/chase/types";
import { getChaseCrmAnalytics } from "@/lib/crm/ai-knowledge";
import { getChaseCommerceMetrics } from "@/lib/commerce";
import { createClient } from "@/lib/supabase/server";
import { addDays, format, startOfWeek, subDays } from "date-fns";

function pct(n: number, d: number): number | null {
  if (d <= 0) return null;
  return Math.round((n / d) * 1000) / 10;
}

function deltaPct(current: number, previous: number): number | null {
  if (previous > 0) {
    return Math.round(((current - previous) / previous) * 100);
  }
  if (current > 0) return 100;
  return null;
}

async function loadSummerActivity(
  businessId: string,
  dayStart: Date,
  dayEnd: Date,
): Promise<ChaseSummerActivity> {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("appointment_change_log")
    .select("action")
    .eq("business_id", businessId)
    .gte("created_at", dayStart.toISOString())
    .lte("created_at", dayEnd.toISOString())
    .limit(500);

  const rows = logs ?? [];
  const creates = rows.filter((l) => l.action === "create").length;
  const reschedules = rows.filter((l) => l.action === "reschedule").length;
  const cancellations = rows.filter((l) => l.action === "cancel").length;

  // Completed visits today (ops signal for daily summary)
  const { count: completed } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("start_time", dayStart.toISOString())
    .lte("start_time", dayEnd.toISOString());

  return {
    bookingsCompleted: completed ?? 0,
    reschedules,
    cancellations,
    creates,
    note: `${creates} creates · ${reschedules} reschedules · ${cancellations} cancellations · ${completed ?? 0} completed (change log + appointments).`,
  };
}

async function loadUpcomingClosures(
  businessId: string,
  from: Date,
  to: Date,
): Promise<{ closures: ChaseUpcomingClosure[]; vacationSoon: boolean }> {
  const supabase = await createClient();
  const closures: ChaseUpcomingClosure[] = [];
  const fromDate = format(from, "yyyy-MM-dd");
  const toDate = format(to, "yyyy-MM-dd");

  const { data: businessClosures } = await supabase
    .from("business_closures")
    .select("id, name, starts_at, ends_at, closure_type")
    .eq("business_id", businessId)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at")
    .limit(10);

  for (const row of businessClosures ?? []) {
    closures.push({
      id: String(row.id),
      label: `${row.name ?? row.closure_type ?? "Closure"} · ${format(new Date(row.starts_at as string), "MMM d")}`,
      startsAt: String(row.starts_at),
      endsAt: (row.ends_at as string | null) ?? null,
      kind: "business",
    });
  }

  const { data: staffClosures } = await supabase
    .from("staff_closures")
    .select("id, starts_at, ends_at, reason, staff:staff(name)")
    .eq("business_id", businessId)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at")
    .limit(10);

  for (const row of staffClosures ?? []) {
    const staff = row.staff as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(staff) ? staff[0]?.name : staff?.name;
    closures.push({
      id: String(row.id),
      label: `${name ?? "Team member"} · ${row.reason ?? "time off"} · ${format(new Date(row.starts_at as string), "MMM d")}`,
      startsAt: String(row.starts_at),
      endsAt: (row.ends_at as string | null) ?? null,
      kind: "staff",
    });
  }

  const { data: staffIds } = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true);
  const ids = (staffIds ?? []).map((s) => s.id as string);

  if (ids.length > 0) {
    const { data: vacations } = await supabase
      .from("staff_vacations")
      .select("id, staff_id, start_date, end_date, kind, reason, staff:staff(name)")
      .in("staff_id", ids)
      .gte("start_date", fromDate)
      .lte("start_date", toDate)
      .order("start_date")
      .limit(20);

    for (const row of vacations ?? []) {
      const staff = row.staff as { name?: string } | { name?: string }[] | null;
      const name = Array.isArray(staff) ? staff[0]?.name : staff?.name;
      const start = String(row.start_date);
      closures.push({
        id: String(row.id),
        label: `${name ?? "Team member"} · ${row.kind ?? row.reason ?? "vacation"} · ${format(new Date(start), "MMM d")}`,
        startsAt: `${start}T00:00:00.000Z`,
        endsAt: row.end_date ? `${row.end_date}T23:59:59.000Z` : null,
        kind: "staff",
      });
    }
  }

  const weekOut = addDays(from, 7);
  const vacationSoon = closures.some(
    (c) =>
      c.kind === "staff" &&
      new Date(c.startsAt).getTime() <= weekOut.getTime(),
  );

  return { closures: closures.slice(0, 8), vacationSoon };
}

export async function getChaseOperationsSnapshot(): Promise<ChaseOperationsSnapshot> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const priorWeekStart = subDays(weekStart, 7);
  const priorWeekEnd = subDays(weekStart, 1);
  priorWeekEnd.setHours(23, 59, 59, 999);

  const [
    brief,
    reports,
    crm,
    weekUtil,
    priorWeekUtil,
    summer,
    closuresPack,
    commerce,
    { data: bizSettings },
  ] = await Promise.all([
    getMorningBrief(),
    getReportsBundle(),
    getChaseCrmAnalytics(business.id),
    queryUtilizationProjection({
      businessId: business.id,
      startIso: weekStart.toISOString(),
      endIso: todayEnd.toISOString(),
      locationId,
    }),
    queryUtilizationProjection({
      businessId: business.id,
      startIso: priorWeekStart.toISOString(),
      endIso: priorWeekEnd.toISOString(),
      locationId,
    }),
    loadSummerActivity(business.id, todayStart, todayEnd),
    loadUpcomingClosures(business.id, todayStart, addDays(todayStart, 21)),
    getChaseCommerceMetrics(business.id),
    supabase
      .from("businesses")
      .select("ai_settings, name")
      .eq("id", business.id)
      .maybeSingle(),
  ]);

  const chaseCfg = parseAiSettings(bizSettings?.ai_settings).chase;
  const appt = reports.appointments;
  const cust = reports.customers;
  const decided = appt.completed + appt.cancelled + appt.noShows;
  const cancelRate = pct(appt.cancelled, decided);
  const noShowRate = pct(appt.noShows, decided);

  // Staff utilization: booked minutes vs rough capacity (staff × 8h × days in week so far)
  const daysIntoWeek = Math.max(
    1,
    Math.ceil((now.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const staffCount = Math.max(1, reports.employees.length || brief.staffWorking);
  const capacityMinutes = staffCount * 8 * 60 * Math.min(daysIntoWeek, 7);
  const staffUtilizationPct = pct(weekUtil.bookedMinutes, capacityMinutes);

  const revenueWeekDeltaPct = deltaPct(weekUtil.revenue, priorWeekUtil.revenue);

  const kpis: ChaseKpis = {
    todayRevenue: brief.todayRevenue,
    todayAppointments: brief.todayAppointments,
    weekBookings: weekUtil.appointmentCount,
    staffUtilizationPct,
    availableCapacitySlots: brief.availableSlots,
    noShows: appt.noShows,
    cancellationRatePct: cancelRate,
    repeatCustomerRatePct: crm.retention.repeatBookingRate,
    averageBookingValue: appt.averageBookingValue,
    revenueWeekDeltaPct,
  };

  const peakHours = [...appt.peakHours].sort((a, b) => b.value - a.value);
  const quietHours = [...appt.peakHours]
    .filter((p) => p.value > 0)
    .sort((a, b) => a.value - b.value)
    .slice(0, 4);

  const bookings: ChaseBookingAnalytics = {
    peakHours: peakHours.slice(0, 6),
    quietHours,
    busyDays: appt.peakDays.slice(0, 7),
    popularServices: reports.services.mostPopular.slice(0, 6).map((m) => ({
      label: m.label,
      value: m.value,
    })),
    popularEmployees: reports.revenue.byEmployee.slice(0, 6),
    bookingLeadTimeDaysAvg: null, // not computed yet — never invent
    completed: appt.completed,
    cancelled: appt.cancelled,
    noShows: appt.noShows,
  };

  const customers: ChaseCustomerAnalytics = {
    newCustomers: cust.newCustomers,
    returningCustomers: cust.returningCustomers,
    retentionRatePct: cust.retentionRate,
    lifetimeValueAvg: cust.lifetimeValueAvg,
    inactive: crm.inactive.map((c) => ({
      id: c.id,
      name: c.name,
      detail: c.lastActivity
        ? `Last activity ${c.lastActivity.slice(0, 10)}`
        : "Inactive",
    })),
    overdueFollowUp: crm.overdueFollowUp.map((c) => ({
      id: c.id,
      name: c.name,
      daysSince: c.daysSince,
    })),
    highValue: crm.highValue,
    averageVisitFrequency:
      crm.retention.activeCustomers > 0 && weekUtil.completed > 0
        ? Math.round(
            (weekUtil.completed / Math.max(1, crm.retention.activeCustomers)) *
              10,
          ) / 10
        : null,
  };

  const employees: ChaseEmployeeAnalytics = {
    rows: reports.employees.slice(0, 12).map((e) => {
      const util =
        capacityMinutes > 0 && reports.employees.length > 0
          ? pct(
              // approximate share of booked minutes by completed ratio
              Math.round(
                (weekUtil.bookedMinutes * e.completed) /
                  Math.max(1, weekUtil.completed || appt.completed || 1),
              ),
              capacityMinutes / Math.max(1, reports.employees.length),
            )
          : e.productivity > 0
            ? Math.min(100, Math.round(e.productivity))
            : null;
      return {
        id: e.id,
        name: e.name,
        completed: e.completed,
        revenue: e.revenue,
        utilizationPct: util,
        averageServiceMinutes: e.averageServiceMinutes,
        cancellationRatePct: cancelRate,
        noShowRatePct: noShowRate,
        overtimeWarning: (util ?? 0) >= 95 || e.averageServiceMinutes > 120,
      };
    }),
  };

  const topService = reports.services.mostPopular[0]?.label ?? null;
  const topStaffRow = [...employees.rows].sort(
    (a, b) => (b.utilizationPct ?? 0) - (a.utilizationPct ?? 0),
  )[0];
  const quietDay =
    [...appt.peakDays].sort((a, b) => a.value - b.value)[0]?.label ?? null;

  const insights = chaseCfg.recommendations
    ? buildChaseInsights({
        kpis,
        pendingConfirmations: brief.pendingConfirmations,
        outstandingDeposits: brief.outstandingPayments,
        topServiceName: topService,
        topStaffName: topStaffRow?.name ?? null,
        topStaffUtilPct: topStaffRow?.utilizationPct ?? null,
        quietDayLabel: quietDay,
        vipInactiveCount:
          crm.overdueFollowUp.length +
          crm.inactive.filter((_, i) => i < 3).length,
        lowUtilWeekday: quietDay,
      })
    : [];

  const alerts = buildChaseAlerts({
    pendingConfirmations: brief.pendingConfirmations,
    outstandingDeposits: brief.outstandingPayments,
    cancellationRatePct: cancelRate,
    availableSlots: brief.availableSlots,
    todayAppointments: brief.todayAppointments,
    staffWorking: brief.staffWorking,
    revenueWeekDeltaPct,
    upcomingClosures: closuresPack.closures,
    vacationSoon: closuresPack.vacationSoon,
  });

  return {
    businessId: business.id,
    businessName: String(bizSettings?.name ?? business.name),
    generatedAt: now.toISOString(),
    enabled: true, // workspace always readable; settings gate future automation
    kpis,
    insights,
    alerts,
    customers,
    employees,
    bookings,
    summer,
    upcomingClosures: closuresPack.closures,
    forecast: CHASE_FORECAST_HOOKS,
    pendingConfirmations: brief.pendingConfirmations,
    outstandingDeposits:
      commerce.outstandingDepositsCents > 0
        ? Math.round(commerce.outstandingDepositsCents / 100)
        : brief.outstandingPayments,
    commerce,
  };
}
