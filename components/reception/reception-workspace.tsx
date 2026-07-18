"use client";

import { CalendarClient } from "@/components/calendar/calendar-client";
import { MorningBrief } from "@/components/day-view/morning-brief";
import type { MorningBriefData } from "@/lib/actions/morning-brief";
import type { StaffDayOverlay } from "@/lib/actions/day-overlays";
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
}: ReceptionWorkspaceProps) {
  return (
    <div className="ds-page">
      <MorningBrief brief={brief} />
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
      />
    </div>
  );
}
