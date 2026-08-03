import { ReceptionWorkspace } from "@/components/reception/reception-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getAppointments, getDashboardStats } from "@/lib/actions/appointments";
import { listTaxRates } from "@/lib/actions/business-management";
import { getCustomers } from "@/lib/actions/customers";
import { getStaffDayOverlays } from "@/lib/actions/day-overlays";
import { getLocations, getBookingIntervalMinutes } from "@/lib/actions/location";
import { getMorningBrief } from "@/lib/actions/morning-brief";
import { getWaitlistEntries } from "@/lib/actions/notifications";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import { buildDashboardInsights } from "@/lib/dashboard/insights";
import type { CalendarView } from "@/lib/types/booking";
import type { Metadata } from "next";
import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
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
  // Parse date-only as local noon — never `new Date("YYYY-MM-DD")` (UTC midnight drift).
  const date = params.date
    ? new Date(`${params.date}T12:00:00`)
    : new Date();
  const range = getRange(view, date);

  const [
    appointments,
    services,
    staff,
    customers,
    locations,
    brief,
    stats,
    waitlist,
    dayOverlays,
    taxRates,
    appointmentIntervalMinutes,
  ] = await Promise.all([
    getAppointments(range.start.toISOString(), range.end.toISOString()),
    getServices(),
    getStaff(),
    getCustomers(),
    getLocations(),
    getMorningBrief(),
    getDashboardStats(),
    getWaitlistEntries(),
    getStaffDayOverlays(range.start.toISOString()),
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
    weekdayName: format(new Date(), "EEEE"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reception"
        description="Day View Control Center — multi-employee floor, Morning Brief, and quick actions."
      />
      <ReceptionWorkspace
        brief={brief}
        insights={insights}
        appointments={appointments}
        services={services}
        staff={staff}
        customers={customers}
        locations={locations}
        waitlist={waitlist}
        initialDate={range.start.toISOString()}
        initialView={view}
        dayOverlays={dayOverlays}
        openBookOnLoad={params.book === "1"}
        focusAppointmentId={params.appointment ?? null}
        currency={business.currency ?? "usd"}
        taxRates={taxRates.filter((t) => t.is_active)}
        timezone={business.timezone}
        appointmentIntervalMinutes={appointmentIntervalMinutes}
      />
    </div>
  );
}
