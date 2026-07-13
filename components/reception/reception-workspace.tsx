"use client";

import { CalendarClient } from "@/components/calendar/calendar-client";
import { BusinessBrief } from "@/components/reception/business-brief";
import type { ReceptionBrief } from "@/lib/actions/reception";
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
  brief: ReceptionBrief;
  insights: DashboardInsight[];
  appointments: AppointmentWithRelations[];
  services: Service[];
  staff: StaffWithServices[];
  customers: Customer[];
  locations: Location[];
  initialDate: string;
  initialView: CalendarView;
  focusAppointmentId?: string | null;
};

export function ReceptionWorkspace({
  brief,
  insights,
  appointments,
  services,
  staff,
  customers,
  locations,
  initialDate,
  initialView,
  focusAppointmentId = null,
}: ReceptionWorkspaceProps) {
  return (
    <div className="ds-page">
      <BusinessBrief brief={brief} />
      <CalendarClient
        appointments={appointments}
        services={services}
        staff={staff}
        customers={customers}
        locations={locations}
        initialDate={initialDate}
        initialView={initialView}
        insights={insights}
        showReceptionPanel
        focusAppointmentId={focusAppointmentId}
      />
    </div>
  );
}
