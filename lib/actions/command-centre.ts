"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getLocationScope } from "@/lib/actions/location";
import {
  endOfBusinessDay,
  hourInBusinessTimezone,
  startOfBusinessDay,
  startOfBusinessMonth,
  startOfBusinessWeek,
} from "@/lib/business/datetime";
import { getCommerceDashboardSnapshot } from "@/lib/commerce/dashboard";
import { formatMoneyCents } from "@/lib/commerce/money";
import {
  buildAttentionItems,
  buildDailySummary,
  buildSummerFacts,
  firstNameFromUser,
  greetingForHour,
  scopeLabel,
  sortScheduleByStart,
  type CommandCentreAttentionItem,
  type CommandCentreSummerFact,
} from "@/lib/dashboard/command-centre";
import {
  buildSetupSteps,
  isSetupComplete,
} from "@/lib/onboarding/setup-progress";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import { formatAppointmentEmailClock } from "@/lib/communications/appointment-datetime";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/types/booking";
import { addDays } from "date-fns";

const APPOINTMENT_STATUSES = new Set<string>([
  "pending",
  "confirmed",
  "arrived",
  "waiting",
  "in_progress",
  "cancelled",
  "completed",
  "no_show",
]);

function asAppointmentStatus(value: string): AppointmentStatus {
  return APPOINTMENT_STATUSES.has(value)
    ? (value as AppointmentStatus)
    : "confirmed";
}

export type CommandCentreScheduleRow = {
  id: string;
  start_time: string;
  status: AppointmentStatus;
  staff_id: string | null;
  payment_status: string | null;
  customer: { id?: string; name?: string | null } | null;
  service: { name?: string | null } | null;
  staff: { name?: string | null } | null;
  location: { name?: string | null } | null;
};

export type CommandCentreActivityRow = {
  id: string;
  kind: "booking" | "customer" | "payment";
  title: string;
  detail: string;
  href: string;
  occurredAt: string;
};

export type CommandCentreSnapshot = {
  businessName: string;
  currency: string;
  timezone: string;
  greeting: string;
  firstName: string;
  dateLabel: string;
  scopeLabel: string | null;
  scopeMode: "all" | "single";
  dailySummary: string;
  setupComplete: boolean;
  appointmentsToday: number | null;
  paymentsCollectedTodayLabel: string | null;
  paymentsCollectedTodayAvailable: boolean;
  paymentsCollectedWeekLabel: string | null;
  paymentsCollectedMonthLabel: string | null;
  outstandingActionsCount: number;
  outstandingDepositsCount: number | null;
  outstandingInvoicesCount: number | null;
  outstandingAppointmentBalancesCount: number | null;
  newCustomersThisMonth: number | null;
  attention: CommandCentreAttentionItem[];
  schedule: CommandCentreScheduleRow[];
  summer: CommandCentreSummerFact[];
  recentActivity: CommandCentreActivityRow[];
  weekDayCounts: { label: string; value: number }[];
  commerceSchemaReady: boolean;
  loadErrors: string[];
  setupSteps: ReturnType<typeof buildSetupSteps>;
  bookingSlug: string;
};

type ApptRow = {
  id: string;
  start_time: string;
  status: string;
  staff_id: string | null;
  payment_status?: string | null;
  created_at?: string;
  customer:
    | { id?: string; name?: string | null }
    | { id?: string; name?: string | null }[]
    | null;
  service: { name?: string | null } | { name?: string | null }[] | null;
  staff: { name?: string | null } | { name?: string | null }[] | null;
  location: { name?: string | null } | { name?: string | null }[] | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function getCommandCentreSnapshot(): Promise<CommandCentreSnapshot> {
  const business = await getOrCreateBusiness();
  const locationScope = await getLocationScope();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currency = business.currency || "CAD";
  const localeInput = {
    timezone: business.timezone,
    currency,
  };
  const now = new Date();
  const dayStart = startOfBusinessDay(now, localeInput);
  const dayEnd = endOfBusinessDay(now, localeInput);
  const weekStart = startOfBusinessWeek(now, localeInput);
  const weekEnd = endOfBusinessDay(addDays(weekStart, 6), localeInput);
  const monthStart = startOfBusinessMonth(now, localeInput);

  const apptMatch =
    locationScope.mode === "single"
      ? { business_id: business.id, location_id: locationScope.locationId }
      : { business_id: business.id };

  const loadErrors: string[] = [];

  const [
    services,
    staff,
    locationsRes,
    todayCountRes,
    todayApptsRes,
    pendingRes,
    cancelledTodayRes,
    newCustomersMonthRes,
    weekSeriesRes,
    recentBookingsRes,
    recentCustomersRes,
    failedCommsRes,
    commerce,
  ] = await Promise.all([
    getServices(),
    getStaff(),
    supabase
      .from("locations")
      .select("id, name")
      .eq("business_id", business.id)
      .limit(20),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptMatch)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString()),
    supabase
      .from("appointments")
      .select(
        `id, start_time, status, staff_id, payment_status,
         customer:customers(id, name),
         service:services(name),
         staff:staff(name),
         location:locations(name)`,
      )
      .match(apptMatch)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString())
      .order("start_time"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptMatch)
      .eq("status", "pending")
      .gte("start_time", now.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptMatch)
      .eq("status", "cancelled")
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString()),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("appointments")
      .select("start_time")
      .match(apptMatch)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString()),
    supabase
      .from("appointments")
      .select(
        `id, start_time, status, created_at,
         customer:customers(name),
         service:services(name),
         location:locations(name)`,
      )
      .match(apptMatch)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("customers")
      .select("id, name, email, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notification_logs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "failed")
      .gte("created_at", dayStart.toISOString())
      .lte("created_at", dayEnd.toISOString()),
    getCommerceDashboardSnapshot(business.id, business.name, {
      currency,
      timezone: business.timezone,
    }).catch((err) => {
      loadErrors.push("payments");
      console.warn("[command-centre] commerce snapshot", err);
      return null;
    }),
  ]);

  if (todayCountRes.error) loadErrors.push("appointments");
  if (failedCommsRes.error) {
    // Soft — table may be missing on older envs
    if (!failedCommsRes.error.message.includes("does not exist")) {
      loadErrors.push("communications");
    }
  }

  const locationIds = (locationsRes.data ?? []).map((l) => l.id);
  let hasHours = false;
  if (locationIds.length > 0) {
    const { data: hoursRows } = await supabase
      .from("location_hours")
      .select("id")
      .in("location_id", locationIds)
      .eq("is_open", true)
      .limit(1);
    hasHours = (hoursRows?.length ?? 0) > 0;
  }

  const setupSteps = buildSetupSteps({
    business,
    serviceCount: services.length,
    staffCount: staff.length,
    hasHours,
  });
  const setupComplete = isSetupComplete(setupSteps);

  const scheduleRaw = (todayApptsRes.data ?? []) as ApptRow[];
  const schedule: CommandCentreScheduleRow[] = sortScheduleByStart(
    scheduleRaw,
  ).map((row) => ({
    id: row.id,
    start_time: row.start_time,
    status: asAppointmentStatus(row.status),
    staff_id: row.staff_id,
    payment_status: row.payment_status ?? null,
    customer: one(row.customer),
    service: one(row.service),
    staff: one(row.staff),
    location: one(row.location),
  }));

  const unassignedTodayCount = schedule.filter((a) => !a.staff_id).length;
  const outstandingBalanceCount = schedule.filter((a) => {
    const ps = a.payment_status;
    return (
      ps === "unpaid" ||
      ps === "deposit_required" ||
      ps === "deposit_paid" ||
      ps === "partially_paid"
    );
  }).length;

  const failedCommunicationsToday = failedCommsRes.error
    ? null
    : (failedCommsRes.count ?? 0);

  const commerceSchemaReady = commerce?.schemaReady ?? false;
  const outstandingDepositsCount = commerce
    ? commerce.outstandingDepositsCount
    : null;
  const outstandingInvoicesCount = commerce
    ? commerce.outstandingInvoicesCount
    : null;
  const outstandingAppointmentBalancesCount = commerce
    ? commerce.outstandingAppointmentBalancesCount
    : null;

  const attention = buildAttentionItems({
    setupComplete,
    failedCommunicationsToday,
    outstandingDepositsCount: outstandingDepositsCount ?? 0,
    outstandingInvoicesCount: outstandingInvoicesCount ?? 0,
    outstandingAppointmentBalancesCount:
      outstandingAppointmentBalancesCount ?? 0,
    unassignedTodayCount,
    pendingConfirmations: pendingRes.error ? 0 : (pendingRes.count ?? 0),
    cancelledTodayCount: cancelledTodayRes.error
      ? 0
      : (cancelledTodayRes.count ?? 0),
    commerceSchemaReady,
  });

  const appointmentsToday = todayCountRes.error
    ? null
    : (todayCountRes.count ?? 0);
  const nextUpcoming = schedule.find(
    (a) => new Date(a.start_time).getTime() >= now.getTime(),
  );
  const nextClock = nextUpcoming
    ? formatAppointmentEmailClock(nextUpcoming.start_time, {
        businessTimezone: business.timezone,
      })
    : null;

  const summer = buildSummerFacts({
    appointmentsToday,
    outstandingBalanceCount,
    failedCommunicationsToday,
    nextAppointmentClock: nextClock,
    pendingConfirmations: pendingRes.error ? 0 : (pendingRes.count ?? 0),
  });

  const selectedLocationName =
    locationScope.mode === "single"
      ? (locationsRes.data ?? []).find((l) => l.id === locationScope.locationId)
          ?.name ?? null
      : null;

  const scope = {
    mode: locationScope.mode as "all" | "single",
    locationName: selectedLocationName,
  };

  const greeting = greetingForHour(hourInBusinessTimezone(now, localeInput));
  const firstName = firstNameFromUser({
    email: user?.email,
    fullName:
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.user_metadata?.name as string | undefined) ??
      null,
  });

  const dateLabel = new Intl.DateTimeFormat("en-CA", {
    timeZone: business.timezone || "America/Toronto",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const weekDayCounts = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const label = new Intl.DateTimeFormat("en-US", {
      timeZone: business.timezone || "America/Toronto",
      weekday: "short",
    }).format(day);
    const dayStartI = startOfBusinessDay(day, localeInput);
    const dayEndI = endOfBusinessDay(day, localeInput);
    const value = (weekSeriesRes.data ?? []).filter((a) => {
      const t = new Date(a.start_time).getTime();
      return t >= dayStartI.getTime() && t <= dayEndI.getTime();
    }).length;
    return { label, value };
  });

  const recentActivity: CommandCentreActivityRow[] = [];
  for (const row of (recentBookingsRes.data ?? []) as ApptRow[]) {
    const customer = one(row.customer);
    const service = one(row.service);
    recentActivity.push({
      id: `booking-${row.id}`,
      kind: "booking",
      title: `${customer?.name ?? "Customer"} · ${service?.name ?? "Service"}`,
      detail: row.status,
      href: "/dashboard/calendar",
      occurredAt: row.created_at ?? row.start_time,
    });
  }
  for (const c of recentCustomersRes.data ?? []) {
    recentActivity.push({
      id: `customer-${c.id}`,
      kind: "customer",
      title: c.name,
      detail: c.email ?? "Customer added",
      href: `/dashboard/clients/${c.id}`,
      occurredAt: c.created_at,
    });
  }
  if (commerce?.recentTransactions?.length) {
    for (const tx of commerce.recentTransactions.slice(0, 4)) {
      recentActivity.push({
        id: `pay-${tx.id}`,
        kind: "payment",
        title: `${tx.kind === "deposit" ? "Deposit" : "Payment"} recorded`,
        detail: formatMoneyCents(tx.amountCents, currency),
        href: "/dashboard/payments",
        occurredAt: tx.occurredAt,
      });
    }
  }
  recentActivity.sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  const paymentsAvailable =
    commerceSchemaReady && commerce != null && loadErrors.indexOf("payments") < 0;

  return {
    businessName: business.name,
    currency,
    timezone: business.timezone || "America/Toronto",
    greeting,
    firstName,
    dateLabel,
    scopeLabel: scopeLabel(scope),
    scopeMode: scope.mode,
    dailySummary: buildDailySummary({
      setupComplete,
      businessName: business.name,
      appointmentsToday: appointmentsToday ?? 0,
      attentionCount: attention.length,
    }),
    setupComplete,
    appointmentsToday,
    paymentsCollectedTodayLabel: paymentsAvailable
      ? formatMoneyCents(commerce!.revenueTodayCents, currency)
      : null,
    paymentsCollectedTodayAvailable: paymentsAvailable,
    paymentsCollectedWeekLabel: paymentsAvailable
      ? formatMoneyCents(commerce!.revenueWeekCents, currency)
      : null,
    paymentsCollectedMonthLabel: paymentsAvailable
      ? formatMoneyCents(commerce!.revenueMonthCents, currency)
      : null,
    outstandingActionsCount: attention.length,
    outstandingDepositsCount,
    outstandingInvoicesCount,
    outstandingAppointmentBalancesCount,
    newCustomersThisMonth: newCustomersMonthRes.error
      ? null
      : (newCustomersMonthRes.count ?? 0),
    attention,
    schedule,
    summer,
    recentActivity: recentActivity.slice(0, 8),
    weekDayCounts,
    commerceSchemaReady,
    loadErrors,
    setupSteps,
    bookingSlug: business.slug,
  };
}
