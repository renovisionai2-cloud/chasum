/**
 * Read-only CRM projections for Summer + Chase.
 * Agents may read preferences and history; they must not mutate CRM directly.
 * Booking changes still go through the Booking Engine.
 */

import { loadCrmProfile } from "@/lib/crm/service";
import { displayCustomerName } from "@/lib/crm/display";
import type { CrmProfile } from "@/lib/crm/types";
import { createClient } from "@/lib/supabase/server";

export type SummerCrmSnapshot = {
  customerId: string;
  displayName: string;
  preferredName: string | null;
  preferredEmployeeName: string | null;
  preferredLocationName: string | null;
  preferredServices: string[];
  tags: string[];
  crmStatus: string;
  isVip: boolean;
  marketingConsent: boolean;
  lastVisit: string | null;
  nextAppointment: string | null;
  upcomingCount: number;
  lifetimeVisits: number;
  lifetimeSpend: number;
  /** Non-private notes only */
  allowedNotes: Array<{ body: string; noteType: string; pinned: boolean }>;
  upcomingAppointments: Array<{
    id: string;
    start: string;
    serviceName: string;
    staffName: string | null;
  }>;
};

export type ChaseCrmAnalytics = {
  overdueFollowUp: Array<{
    id: string;
    name: string;
    lastVisit: string | null;
    daysSince: number;
  }>;
  highValue: Array<{
    id: string;
    name: string;
    lifetimeSpend: number;
    visits: number;
  }>;
  inactive: Array<{ id: string; name: string; lastActivity: string | null }>;
  retention: {
    activeCustomers: number;
    vipCount: number;
    repeatBookingRate: number;
    averageLifetimeSpend: number;
  };
};

function daysBetween(iso: string | null, now = Date.now()) {
  if (!iso) return null;
  return Math.floor((now - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

/** Summer-safe CRM read for one customer. */
export async function getSummerCrmSnapshot(
  businessId: string,
  customerId: string,
): Promise<SummerCrmSnapshot | null> {
  const profile = await loadCrmProfile(businessId, customerId);
  if (!profile) return null;

  const c = profile.customer;
  const preferredServices = Array.from(
    new Set(
      profile.appointments.completed
        .map((a) => a.service?.name)
        .filter((n): n is string => Boolean(n)),
    ),
  ).slice(0, 5);

  return {
    customerId: c.id,
    displayName: displayCustomerName(c),
    preferredName: c.preferred_name ?? null,
    preferredEmployeeName:
      profile.assignedStaff?.name ?? profile.insights.preferredEmployeeName,
    preferredLocationName:
      profile.preferredLocation?.name ?? profile.insights.preferredLocationName,
    preferredServices,
    tags: c.tags ?? [],
    crmStatus: String(c.crm_status ?? "active"),
    isVip: Boolean(c.is_vip),
    marketingConsent: Boolean(
      (c as { marketing_consent?: boolean }).marketing_consent,
    ),
    lastVisit: profile.insights.lastVisit,
    nextAppointment: profile.insights.nextAppointment,
    upcomingCount: profile.insights.upcomingCount,
    lifetimeVisits: profile.insights.completedAppointments,
    lifetimeSpend: profile.insights.lifetimeRevenue,
    allowedNotes: profile.notes
      .filter((n) => !n.isPrivate)
      .slice(0, 12)
      .map((n) => ({
        body: n.body,
        noteType: n.noteType ?? "general",
        pinned: n.isPinned,
      })),
    upcomingAppointments: profile.appointments.upcoming.slice(0, 5).map((a) => ({
      id: a.id,
      start: a.start_time,
      serviceName: a.service?.name ?? "Service",
      staffName: a.staff?.name ?? null,
    })),
  };
}

/** Chase CRM analytics — retention, overdue follow-up, high-value. */
export async function getChaseCrmAnalytics(
  businessId: string,
): Promise<ChaseCrmAnalytics> {
  const supabase = await createClient();
  const now = Date.now();
  const inactiveCutoff = now - 60 * 24 * 60 * 60 * 1000;

  const [{ data: customers }, { data: appointments }] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, name, preferred_name, first_name, last_name, crm_status, is_vip, last_activity_at, updated_at",
      )
      .eq("business_id", businessId)
      .limit(500),
    supabase
      .from("appointments")
      .select("id, customer_id, start_time, status, service:services(price)")
      .eq("business_id", businessId)
      .neq("status", "cancelled")
      .limit(5000),
  ]);

  const rows = customers ?? [];
  const appts = appointments ?? [];

  const spendByCustomer = new Map<
    string,
    { spend: number; visits: number; lastVisit: string | null }
  >();
  for (const a of appts) {
    const cid = a.customer_id as string;
    const cur = spendByCustomer.get(cid) ?? {
      spend: 0,
      visits: 0,
      lastVisit: null,
    };
    if (a.status === "completed") {
      const price = (a.service as { price?: number } | null)?.price ?? 0;
      cur.spend += Number(price);
      cur.visits += 1;
    }
    const start = a.start_time as string;
    if (
      new Date(start).getTime() < now &&
      (!cur.lastVisit || new Date(start) > new Date(cur.lastVisit))
    ) {
      cur.lastVisit = start;
    }
    spendByCustomer.set(cid, cur);
  }

  const overdueFollowUp: ChaseCrmAnalytics["overdueFollowUp"] = [];
  const inactive: ChaseCrmAnalytics["inactive"] = [];
  const highValue: ChaseCrmAnalytics["highValue"] = [];

  let activeCustomers = 0;
  let vipCount = 0;
  let repeaters = 0;
  let totalSpend = 0;

  for (const c of rows) {
    const status = (c.crm_status as string) ?? "active";
    if (status === "active" || status === "vip") activeCustomers += 1;
    if (c.is_vip || status === "vip") vipCount += 1;

    const stats = spendByCustomer.get(c.id as string);
    const spend = stats?.spend ?? 0;
    const visits = stats?.visits ?? 0;
    totalSpend += spend;
    if (visits >= 2) repeaters += 1;

    const name = displayCustomerName(
      c as Parameters<typeof displayCustomerName>[0],
    );
    const lastActivity =
      (c.last_activity_at as string | null) ??
      stats?.lastVisit ??
      (c.updated_at as string | null);
    const days = daysBetween(stats?.lastVisit ?? lastActivity, now);

    if (days != null && days >= 45 && days < 120 && status !== "archived") {
      overdueFollowUp.push({
        id: c.id as string,
        name,
        lastVisit: stats?.lastVisit ?? null,
        daysSince: days,
      });
    }

    const activityMs = lastActivity ? new Date(lastActivity).getTime() : 0;
    if (activityMs > 0 && activityMs < inactiveCutoff && status !== "archived") {
      inactive.push({
        id: c.id as string,
        name,
        lastActivity,
      });
    }

    if (spend >= 200 || visits >= 5) {
      highValue.push({
        id: c.id as string,
        name,
        lifetimeSpend: spend,
        visits,
      });
    }
  }

  overdueFollowUp.sort((a, b) => b.daysSince - a.daysSince);
  highValue.sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);
  inactive.sort((a, b) =>
    String(a.lastActivity).localeCompare(String(b.lastActivity)),
  );

  const withVisits = rows.filter(
    (c) => (spendByCustomer.get(c.id as string)?.visits ?? 0) > 0,
  ).length;

  return {
    overdueFollowUp: overdueFollowUp.slice(0, 12),
    highValue: highValue.slice(0, 12),
    inactive: inactive.slice(0, 12),
    retention: {
      activeCustomers,
      vipCount,
      repeatBookingRate:
        withVisits > 0 ? Math.round((repeaters / withVisits) * 100) : 0,
      averageLifetimeSpend:
        rows.length > 0
          ? Math.round((totalSpend / rows.length) * 100) / 100
          : 0,
    },
  };
}

export type { CrmProfile };
