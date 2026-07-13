import { CalendarClient } from "@/components/calendar/calendar-client";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getAppointments } from "@/lib/actions/appointments";
import { getCustomers } from "@/lib/actions/customers";
import { getLocations } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import type { CalendarView } from "@/lib/types/booking";
import type { Metadata } from "next";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const metadata: Metadata = {
  title: "Calendar",
};

type PageProps = {
  searchParams: Promise<{ view?: string; date?: string }>;
};

function getRange(view: CalendarView, date: Date) {
  switch (view) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
      };
    case "month":
      return { start: startOfMonth(date), end: endOfMonth(date) };
  }
}

export default async function CalendarPage({ searchParams }: PageProps) {
  await getOrCreateBusiness();
  const params = await searchParams;
  const view = (params.view as CalendarView) ?? "week";
  const date = params.date ? new Date(params.date) : new Date();
  const range = getRange(view, date);

  const [appointments, services, staff, customers, locations] =
    await Promise.all([
      getAppointments(range.start.toISOString(), range.end.toISOString()),
      getServices(),
      getStaff(),
      getCustomers(),
      getLocations(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="View and manage appointments across day, week, and month views."
      />
      <CalendarClient
        appointments={appointments}
        services={services}
        staff={staff}
        customers={customers}
        locations={locations}
        initialDate={range.start.toISOString()}
        initialView={view}
      />
    </div>
  );
}
