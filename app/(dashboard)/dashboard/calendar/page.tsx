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
import { getCalendarViewRange } from "@/lib/calendar/view-range";
import {
  formatCalendarDateParam,
  parseCalendarDateParam,
} from "@/lib/calendar/date-param";
import { buildDashboardInsights } from "@/lib/dashboard/insights";
import type { CalendarView } from "@/lib/types/booking";
import type { Metadata } from "next";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Reception",
};

type PageProps = {
  searchParams: Promise<{
    view?: string;
    date?: string;
    appointment?: string;
    book?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: PageProps) {
  const business = await getOrCreateBusiness();
  const params = await searchParams;
  const view = (params.view as CalendarView) ?? "day";
  // Civil anchor identity — never Month/Week fetch-window start.
  const anchor = parseCalendarDateParam(params.date);
  const locale = {
    timezone: business.timezone,
    currency: business.currency,
  };
  const range = getCalendarViewRange(view, anchor, locale);
  const civilAnchor = formatCalendarDateParam(anchor, business.timezone);

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
    <div className="w-full min-w-0 space-y-2">
      <PageHeader title="Reception" className="gap-2" />
      <ReceptionWorkspace
        brief={brief}
        insights={insights}
        appointments={appointments}
        services={services}
        staff={staff}
        customers={customers}
        locations={locations}
        waitlist={waitlist}
        initialDate={civilAnchor}
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
