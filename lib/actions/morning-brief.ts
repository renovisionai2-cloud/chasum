"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getLocations, getLocationScope } from "@/lib/actions/location";
import {
  countDailyStatuses,
  isActiveBooking,
  paymentReadinessFromStatus,
  sortAppointmentsChronologically,
  type DailyStatusCounts,
} from "@/lib/dashboard/appointment-ops";
import {
  businessDayBounds,
  countAppointmentsToday,
} from "@/lib/dashboard/appointments-today";
import { formatAppointmentEmailClock } from "@/lib/communications/appointment-datetime";
import { withLocationFilter } from "@/lib/location/constants";
import { createClient } from "@/lib/supabase/server";

export type ReceptionAttentionItem = {
  id: string;
  title: string;
  why: string;
  href: string;
};

export type MorningBriefData = {
  dateLabel: string;
  locationLabel: string;
  locationScopeNote: string;
  todayAppointments: number;
  nextAppointmentClock: string | null;
  nextAppointmentCustomer: string | null;
  statusCounts: DailyStatusCounts;
  staffWorking: number;
  waitlistCount: number;
  attention: ReceptionAttentionItem[];
  /** @deprecated Misleading unique capacity — omit from UI; kept for type compat */
  availableSlots: number | null;
  todayRevenue: number;
  noShows: number;
  outstandingPayments: number;
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
    availableSlots: number | null;
    overdueCustomers: number;
  };
};

/**
 * Reception daily operating brief for the Day View Control Center.
 * Uses the same LocationScope cookie as Calendar appointment queries.
 * Does not invent unique availability slot totals.
 */
export async function getMorningBrief(): Promise<MorningBriefData> {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const locations = await getLocations();
  const supabase = await createClient();

  const now = new Date();
  const locale = {
    timezone: business.timezone,
    currency: business.currency,
  };
  const { dayStart: todayStart, dayEnd: todayEnd } = businessDayBounds(
    now,
    locale,
  );
  const dateLabel = new Intl.DateTimeFormat("en-CA", {
    timeZone: business.timezone || "America/Toronto",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const locationLabel =
    scope.mode === "all"
      ? "All locations"
      : (locations.find((l) => l.id === scope.locationId)?.name ?? "Location");
  const locationScopeNote =
    scope.mode === "all"
      ? "Counts match calendar location scope (all locations)."
      : "Counts match calendar location scope for this location.";

  const dow = now.getDay();

  let todayQuery = supabase
    .from("appointments")
    .select(
      `id, customer_id, status, staff_id, start_time, payment_status,
         price_cents, deposit_cents, amount_paid_cents,
         customer:customers(name),
         service:services(name, price)`,
    )
    .eq("business_id", business.id)
    .gte("start_time", todayStart.toISOString())
    .lte("start_time", todayEnd.toISOString())
    .order("start_time");
  todayQuery = withLocationFilter(todayQuery, scope);

  let pendingQuery = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("status", "pending")
    .gte("start_time", now.toISOString());
  pendingQuery = withLocationFilter(pendingQuery, scope);

  let staffQuery = supabase
    .from("staff")
    .select("id, name, is_active, staff_services(service_id)")
    .eq("business_id", business.id)
    .eq("is_active", true);
  staffQuery = withLocationFilter(staffQuery, scope);

  const [
    { data: todayAppts },
    { count: pendingCount },
    { count: waitlistCount },
    { data: staff },
    { data: workingHours },
    { count: failedComms },
    { data: changeLog },
  ] = await Promise.all([
    todayQuery,
    pendingQuery,
    supabase
      .from("waitlists")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "waiting"),
    staffQuery,
    supabase
      .from("staff_working_hours")
      .select("staff_id")
      .eq("day_of_week", dow)
      .eq("is_working", true),
    supabase
      .from("notification_logs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "failed")
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),
    supabase
      .from("appointment_change_log")
      .select("action")
      .eq("business_id", business.id)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),
  ]);

  const rows = (todayAppts ?? []) as Array<{
    id: string;
    customer_id: string | null;
    status: string;
    staff_id: string | null;
    start_time: string;
    payment_status?: string | null;
    price_cents?: number | null;
    deposit_cents?: number | null;
    amount_paid_cents?: number | null;
    customer?:
      | { name?: string | null }
      | { name?: string | null }[]
      | null;
  }>;

  const todayAppointments = countAppointmentsToday(rows, now, locale);
  const statusCounts = countDailyStatuses(rows);
  const activeRows = rows.filter((a) => isActiveBooking(a.status));
  const noShows = statusCounts.noShow;

  const customersToday = new Set(
    activeRows.map((a) => a.customer_id).filter(Boolean),
  ).size;

  const outstandingPayments = activeRows.filter((a) => {
    const ready = paymentReadinessFromStatus(a.payment_status);
    return ready === "payment_due" || ready === "balance_due";
  }).length;

  const chronological = sortAppointmentsChronologically(activeRows);
  const next = chronological.find(
    (a) => new Date(a.start_time).getTime() >= now.getTime(),
  );
  const nextCustomer = next?.customer
    ? Array.isArray(next.customer)
      ? next.customer[0]?.name
      : next.customer.name
    : null;

  const workingStaffIds = new Set(
    (workingHours ?? []).map((h) => h.staff_id as string),
  );
  const staffList = staff ?? [];
  const staffWorking =
    workingStaffIds.size > 0
      ? staffList.filter((s) => workingStaffIds.has(s.id)).length
      : staffList.length;

  const attention: ReceptionAttentionItem[] = [];
  if ((pendingCount ?? 0) > 0) {
    attention.push({
      id: "pending",
      title:
        (pendingCount ?? 0) === 1
          ? "1 appointment awaiting confirmation"
          : `${pendingCount} appointments awaiting confirmation`,
      why: "Pending bookings may need a call or confirmation before the visit.",
      href: "/dashboard/calendar?view=day",
    });
  }
  if (statusCounts.unassigned > 0) {
    attention.push({
      id: "unassigned",
      title:
        statusCounts.unassigned === 1
          ? "1 unassigned appointment today"
          : `${statusCounts.unassigned} unassigned appointments today`,
      why: "Assign an employee before the visit so the floor is clear.",
      href: "/dashboard/calendar?view=day",
    });
  }
  if (outstandingPayments > 0) {
    attention.push({
      id: "payment",
      title:
        outstandingPayments === 1
          ? "1 appointment needs payment attention"
          : `${outstandingPayments} appointments need payment attention`,
      why: "Deposit or balance still due — open Payments or the appointment drawer.",
      href: "/dashboard/payments",
    });
  }
  if (failedComms != null && failedComms > 0) {
    attention.push({
      id: "comms",
      title:
        failedComms === 1
          ? "1 message failed today"
          : `${failedComms} messages failed today`,
      why: "Customers may not have received a confirmation or reminder.",
      href: "/dashboard/notifications",
    });
  }
  if (noShows > 0) {
    attention.push({
      id: "noshow",
      title: noShows === 1 ? "1 no-show today" : `${noShows} no-shows today`,
      why: "Recorded separately from active appointments.",
      href: "/dashboard/calendar?view=day",
    });
  }

  let recommendation =
    todayAppointments === 0
      ? "No active appointments on the board for this location scope today."
      : "Keep confirming pending bookings and watch payment attention items.";
  if ((pendingCount ?? 0) > 0) {
    recommendation = `${pendingCount} confirmation${(pendingCount ?? 0) === 1 ? "" : "s"} waiting — clear the queue first.`;
  } else if (outstandingPayments > 0) {
    recommendation = `${outstandingPayments} appointment${outstandingPayments === 1 ? "" : "s"} still need payment collection.`;
  } else if (statusCounts.unassigned > 0) {
    recommendation = "Assign employees to unassigned visits before they start.";
  }

  return {
    dateLabel,
    locationLabel,
    locationScopeNote,
    todayAppointments,
    nextAppointmentClock: next
      ? formatAppointmentEmailClock(next.start_time, {
          businessTimezone: business.timezone,
        })
      : null,
    nextAppointmentCustomer: nextCustomer ?? null,
    statusCounts,
    staffWorking,
    waitlistCount: waitlistCount ?? 0,
    attention,
    availableSlots: null,
    todayRevenue: 0,
    noShows,
    outstandingPayments,
    pendingConfirmations: pendingCount ?? 0,
    customersToday,
    summer: {
      bookingsToday: (changeLog ?? []).filter((l) => l.action === "create")
        .length,
      reschedulesToday: (changeLog ?? []).filter(
        (l) => l.action === "reschedule",
      ).length,
      confirmationsToday: activeRows.filter((a) => a.status === "confirmed")
        .length,
    },
    chase: {
      revenueDeltaPct: null,
      recommendation,
      availableSlots: null,
      overdueCustomers: outstandingPayments,
    },
  };
}
