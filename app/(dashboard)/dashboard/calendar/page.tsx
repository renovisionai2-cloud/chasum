import { ReceptionWorkspace } from "@/components/reception/reception-workspace";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getAppointments, getDashboardStats } from "@/lib/actions/appointments";
import { listTaxRates } from "@/lib/actions/business-management";
import { getCustomers } from "@/lib/actions/customers";
import { getStaffDayOverlays } from "@/lib/actions/day-overlays";
import { getLocations, getLocationScope, getBookingIntervalMinutes } from "@/lib/actions/location";
import { getMorningBrief } from "@/lib/actions/morning-brief";
import { getWaitlistEntries } from "@/lib/actions/notifications";
import { getOperatorServiceCatalog } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import { calendarDayStart, addCalendarDays } from "@/lib/business/datetime";
import { getBusinessTimezone, formatBusinessDate } from "@/lib/locale";
import {
  parseCalendarDateParam,
  formatCalendarDateParam,
  resolveCalendarDateValue,
} from "@/lib/calendar/date-param";
import { buildDashboardInsights } from "@/lib/dashboard/insights";
import type { CalendarView } from "@/lib/types/booking";
import type { Metadata } from "next";
import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const metadata: Metadata = {
  title: "Reception · Day View",
};

type PageProps = {
  searchParams: Promise<{
    view?: string;
    date?: string;
    appointment?: string;
    book?: string;
  }>;
};

function getRange(view: CalendarView, date: Date) {
  switch (view) {
    case "day":
    case "timeline":
    case "employees":
    case "locations":
    case "resource":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "week":
    case "agenda":
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(addDays(date, 7), { weekStartsOn: 0 }),
      };
    case "month":
      return { start: startOfMonth(date), end: endOfMonth(date) };
    default:
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
  }
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const business = await getOrCreateBusiness();
  const params = await searchParams;
  const view = (params.view as CalendarView) ?? "day";
  // Accept YYYY-MM-DD or full ISO from client navigation — never concat T12
  // onto an ISO string (Invalid Date → toISOString crash).
  const [locations, scope] = await Promise.all([getLocations(), getLocationScope()]);
  const selectedLocation = scope.mode === "single" ? locations.find((l) => l.id === scope.locationId) : null;
  const timezone = getBusinessTimezone({ timezone: business.timezone, locationTimezone: selectedLocation?.timezone });
  const dateValue = resolveCalendarDateValue(params.date, timezone);
  const date = parseCalendarDateParam(dateValue);
  const civilRange = getRange(view, date);
  const start = calendarDayStart(formatCalendarDateParam(civilRange.start), timezone);
  const nextDay = calendarDayStart(addCalendarDays(formatCalendarDateParam(civilRange.end), 1), timezone);
  const range = { start, end: new Date(nextDay.getTime() - 1) };

  const [
    appointments,
    services,
    staff,
    customers,
    brief,
    stats,
    waitlist,
    dayOverlays,
    taxRates,
    appointmentIntervalMinutes,
  ] = await Promise.all([
    getAppointments(range.start.toISOString(), range.end.toISOString()),
    getOperatorServiceCatalog(),
    getStaff(),
    getCustomers(),
    getMorningBrief(),
    getDashboardStats(),
    getWaitlistEntries(),
    getStaffDayOverlays(dateValue),
    listTaxRates(),
    getBookingIntervalMinutes(),
  ]);

  const insights = buildDashboardInsights({
    todayCount: stats.todayCount,
    yesterdayCount: stats.yesterdayCount,
    lastWeekSameDayCount: stats.lastWeekSameDayCount,
    weekCount: stats.weekCount,
    previousWeekCount: stats.previousWeekCount,
    pendingConfirmations: stats.pendingConfirmations,
    upcomingCount: stats.upcoming.length,
    customerCount: stats.customerCount,
    weekdayName: formatBusinessDate(new Date(), { timezone }, { weekday: "long" }),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reception"
        className="flex-row items-center"
      >
        <Link href="/dashboard/ai-workforce/summer" className="ds-focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-spark/10 px-3 text-sm font-semibold text-spark"><Sparkles className="size-4" aria-hidden /><span>Summer</span></Link>
      </PageHeader>
      <ReceptionWorkspace
        key={`${timezone}:${dateValue}:${view}`}
        brief={brief}
        insights={insights}
        appointments={appointments}
        services={services}
        staff={staff}
        customers={customers}
        locations={locations}
        waitlist={waitlist}
        initialDate={dateValue}
        initialView={view}
        dayOverlays={dayOverlays}
        openBookOnLoad={params.book === "1"}
        focusAppointmentId={params.appointment ?? null}
        currency={business.currency ?? "usd"}
        taxRates={taxRates.filter((t) => t.is_active)}
        timezone={timezone}
        appointmentIntervalMinutes={appointmentIntervalMinutes}
        scope={scope}
      />
    </div>
  );
}
