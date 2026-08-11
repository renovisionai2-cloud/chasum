"use client";

import { CalendarClient } from "@/components/calendar/calendar-client";
import type { MorningBriefData } from "@/lib/actions/morning-brief";
import type { StaffDayOverlay } from "@/lib/actions/day-overlays";
import { DEFAULT_BOOKING_INTERVAL_MINUTES } from "@/lib/booking/interval";
import type { TaxRate } from "@/lib/business/types";
import type { DashboardInsight } from "@/lib/dashboard/insights";
import type {
  AppointmentWithRelations,
  CalendarView,
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";

type ReceptionWorkspaceProps = {
  brief: MorningBriefData;
  insights: DashboardInsight[];
  appointments: AppointmentWithRelations[];
  services: Service[];
  staff: StaffWithServices[];
  customers: Customer[];
  locations: Location[];
  waitlist?: Array<{
    id: string;
    status: string;
    preferred_date: string;
    notes: string | null;
    priority?: number;
    customer?: { name?: string; email?: string } | null;
    service?: { name?: string } | null;
    staff?: { name?: string } | null;
  }>;
  initialDate: string;
  initialView: CalendarView;
  focusAppointmentId?: string | null;
  dayOverlays?: StaffDayOverlay[];
  openBookOnLoad?: boolean;
  currency?: string | null;
  taxRates?: TaxRate[];
  timezone?: string | null;
  appointmentIntervalMinutes?: number;
};

export function ReceptionWorkspace({
  brief,
  insights,
  appointments,
  services,
  staff,
  customers,
  locations,
  waitlist = [],
  initialDate,
  initialView,
  focusAppointmentId = null,
  dayOverlays = [],
  openBookOnLoad = false,
  currency = null,
  taxRates = [],
  timezone = null,
  appointmentIntervalMinutes = DEFAULT_BOOKING_INTERVAL_MINUTES,
}: ReceptionWorkspaceProps) {
  return (
    <div className="ds-page">
      <CalendarClient
        appointments={appointments}
        services={services}
        staff={staff}
        customers={customers}
        locations={locations}
        waitlist={waitlist}
        initialDate={initialDate}
        initialView={initialView}
        insights={insights}
        showReceptionPanel
        focusAppointmentId={focusAppointmentId}
        dayOverlays={dayOverlays}
        openBookOnLoad={openBookOnLoad}
        currency={currency}
        taxRates={taxRates}
        timezone={timezone}
        appointmentIntervalMinutes={appointmentIntervalMinutes}
        morningBrief={brief}
      />
    </div>
  );
}
