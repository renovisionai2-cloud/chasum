"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getLocationScope, getLocations } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import {
  calendarDateInTimezone,
  endOfBusinessDay,
  hourInBusinessTimezone,
  startOfBusinessDay,
} from "@/lib/business/datetime";
import { getCommerceDashboardSnapshot } from "@/lib/commerce/dashboard";
import { formatAppointmentEmailClock } from "@/lib/communications/appointment-datetime";
import {
  activeScheduleRows,
  appointmentScopeLabel,
  buildAttentionItems,
  buildDailySummary,
  buildSummerFacts,
  countCancellationsToday,
  moneyScopeCaption,
  presentCommerceMoney,
  receptionHref,
  selectNextAppointment,
  type CommandCentreAttentionItem,
  type CommandCentreMoneyView,
  type CommandCentreScheduleRow,
  type CommandCentreSummerFact,
} from "@/lib/dashboard/command-centre";
import {
  firstNameFromUser,
  greetingForHour,
} from "@/lib/dashboard/insights";
import { formatBusinessDate } from "@/lib/locale";
import { withLocationFilter } from "@/lib/location/constants";
import {
  buildSetupSteps,
  isSetupComplete,
  type SetupStep,
} from "@/lib/onboarding/setup-progress";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/types/booking";

const APPOINTMENT_STATUSES = new Set<AppointmentStatus>([
  "pending",
  "confirmed",
  "arrived",
  "waiting",
  "in_progress",
  "cancelled",
  "completed",
  "no_show",
]);

function asAppointmentStatus(value: string | null | undefined): AppointmentStatus {
  if (value && APPOINTMENT_STATUSES.has(value as AppointmentStatus)) {
    return value as AppointmentStatus;
  }
  return "confirmed";
}

function asNamed(
  value:
    | { id?: string; name?: string | null }
    | { id?: string; name?: string | null }[]
    | null
    | undefined,
): { id?: string; name?: string | null } | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type CommandCentreSnapshot = {
  businessName: string;
  businessSlug: string;
  currency: string;
  timezone: string;
  greeting: string;
  firstName: string;
  dateLabel: string;
  dailySummary: string;
  appointmentScopeLabel: string;
  appointmentScopeMode: "all" | "single";
  moneyScopeCaption: string;
  setupComplete: boolean;
  setupSteps: SetupStep[];
  appointmentsToday: number;
  schedule: CommandCentreScheduleRow[];
  nextAppointment: CommandCentreScheduleRow | null;
  nextAppointmentClock: string | null;
  nextAppointmentHref: string;
  receptionHref: string;
  attention: CommandCentreAttentionItem[];
  money: CommandCentreMoneyView;
  summerFacts: CommandCentreSummerFact[];
};

export async function getCommandCentreSnapshot(): Promise<CommandCentreSnapshot> {
  const business = await getOrCreateBusiness();
  const locationScope = await getLocationScope();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = {
    timezone: business.timezone,
    currency: business.currency,
  };
  const now = new Date();
  const dayStart = startOfBusinessDay(now, locale);
  const dayEnd = endOfBusinessDay(now, locale);

  let todayQuery = supabase
    .from("appointments")
    .select(
      "id, start_time, status, customer_id, customer:customers(id, name), service:services(name), staff:staff(name), location:locations(name)",
    )
    .eq("business_id", business.id)
    .gte("start_time", dayStart.toISOString())
    .lte("start_time", dayEnd.toISOString())
    .order("start_time");
  todayQuery = withLocationFilter(todayQuery, locationScope);

  let pendingQuery = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("status", "pending")
    .gte("start_time", now.toISOString());
  pendingQuery = withLocationFilter(pendingQuery, locationScope);

  const [services, staff, locations, commerce, todayRes, pendingRes] =
    await Promise.all([
      getServices(),
      getStaff(),
      getLocations(),
      getCommerceDashboardSnapshot(business.id, business.name, {
        currency: business.currency,
        timezone: business.timezone,
      }),
      todayQuery,
      pendingQuery,
    ]);

  let hoursProbe = false;
  const locationIds = locations.map((l) => l.id);
  if (locationIds.length > 0) {
    const { data: hoursRows } = await supabase
      .from("location_hours")
      .select("id")
      .in("location_id", locationIds)
      .eq("is_open", true)
      .limit(1);
    hoursProbe = (hoursRows?.length ?? 0) > 0;
  }

  if (todayRes.error) {
    throw new Error(todayRes.error.message);
  }
  if (pendingRes.error) {
    throw new Error(pendingRes.error.message);
  }

  const setupSteps = buildSetupSteps({
    business,
    serviceCount: services.length,
    staffCount: staff.length,
    hasHours: hoursProbe,
  });
  const setupComplete = isSetupComplete(setupSteps);
  const nextSetupStep = setupSteps.find((step) => !step.done) ?? null;

  const schedule: CommandCentreScheduleRow[] = (todayRes.data ?? []).map(
    (row: Record<string, unknown>) => {
      const customer = asNamed(
        row.customer as Parameters<typeof asNamed>[0],
      );
      const service = asNamed(row.service as Parameters<typeof asNamed>[0]);
      const staffRow = asNamed(row.staff as Parameters<typeof asNamed>[0]);
      const location = asNamed(row.location as Parameters<typeof asNamed>[0]);
      return {
        id: String(row.id),
        start_time: String(row.start_time),
        status: asAppointmentStatus(row.status as string | null),
        customerName: customer?.name ?? null,
        customerId: customer?.id ?? (row.customer_id as string | null) ?? null,
        serviceName: service?.name ?? null,
        staffName: staffRow?.name ?? null,
        locationName: location?.name ?? null,
      };
    },
  );

  const active = activeScheduleRows(schedule);
  const nextAppointment = selectNextAppointment(schedule, now);
  const nextClock = nextAppointment
    ? formatAppointmentEmailClock(nextAppointment.start_time, business.timezone)
    : null;
  const nextDateYmd = nextAppointment
    ? calendarDateInTimezone(nextAppointment.start_time, business.timezone)
    : calendarDateInTimezone(now, business.timezone);

  const money = presentCommerceMoney({
    schemaReady: commerce.schemaReady,
    schemaMessage: commerce.schemaMessage,
    collectedTodayCents: commerce.revenueTodayCents,
    outstandingInvoicesCents: commerce.outstandingInvoicesCents,
    outstandingInvoicesCount: commerce.outstandingInvoicesCount,
    outstandingDepositsCents: commerce.outstandingDepositsCents,
    outstandingDepositsCount: commerce.outstandingDepositsCount,
  });

  const pendingConfirmations = pendingRes.count ?? 0;
  const cancellationsToday = countCancellationsToday(schedule);
  const attention = buildAttentionItems({
    pendingConfirmations,
    cancellationsToday,
    money,
    setupComplete,
    nextSetupStep,
  });

  const outstandingCount = money.available
    ? money.outstandingInvoicesCount + money.outstandingDepositsCount
    : 0;

  const scopeMode = locationScope.mode;
  const locationName =
    scopeMode === "single"
      ? (locations.find((l) => l.id === locationScope.locationId)?.name ?? null)
      : null;

  const firstName = firstNameFromUser({
    email: user?.email,
    fullName:
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.user_metadata?.name as string | undefined) ??
      null,
  });

  return {
    businessName: business.name,
    businessSlug: business.slug,
    currency: business.currency || "CAD",
    timezone: business.timezone,
    greeting: greetingForHour(hourInBusinessTimezone(now, locale)),
    firstName,
    dateLabel: formatBusinessDate(now, locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    dailySummary: buildDailySummary({
      setupComplete,
      businessName: business.name,
      appointmentsToday: active.length,
      attentionCount: attention.length,
    }),
    appointmentScopeLabel: appointmentScopeLabel({
      mode: scopeMode,
      locationName,
    }),
    appointmentScopeMode: scopeMode,
    moneyScopeCaption: moneyScopeCaption(scopeMode),
    setupComplete,
    setupSteps,
    appointmentsToday: active.length,
    schedule: active,
    nextAppointment,
    nextAppointmentClock: nextClock,
    nextAppointmentHref: receptionHref({
      dateYmd: nextDateYmd || null,
      appointmentId: nextAppointment?.id ?? null,
    }),
    receptionHref: receptionHref({
      dateYmd: calendarDateInTimezone(now, business.timezone) || null,
    }),
    attention,
    money,
    summerFacts: buildSummerFacts({
      setupComplete,
      appointmentsToday: active.length,
      nextAppointmentClock: nextClock,
      pendingConfirmations,
      outstandingCount,
      attentionCount: attention.length,
    }),
  };
}
