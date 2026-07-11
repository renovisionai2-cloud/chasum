"use client";

import { AppointmentDialog } from "@/components/calendar/appointment-dialog";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import {
  DayView,
  MonthView,
  WeekView,
} from "@/components/calendar/calendar-views";
import { EmptyState } from "@/components/ui/page-header";
import { rescheduleAppointment } from "@/lib/actions/appointments";
import { getDashboardAvailableSlots } from "@/lib/actions/scheduling";
import { useToast } from "@/providers/toast-provider";
import type {
  AppointmentWithRelations,
  CalendarView,
  Customer,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { parseISO } from "@/lib/calendar/utils";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type CalendarClientProps = {
  appointments: AppointmentWithRelations[];
  services: Service[];
  staff: StaffWithServices[];
  customers: Customer[];
  initialDate: string;
  initialView: CalendarView;
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
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
  }
}

export function CalendarClient({
  appointments,
  services,
  staff,
  customers,
  initialDate,
  initialView,
}: CalendarClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<CalendarView>(initialView);
  const [date, setDate] = useState(new Date(initialDate));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<Date | undefined>();

  const refresh = useCallback(() => router.refresh(), [router]);

  const hasSetup = services.length > 0 && staff.length > 0;

  function openNew(slot?: Date) {
    setSelectedAppointment(null);
    setDefaultSlot(slot);
    setDialogOpen(true);
  }

  function openEdit(appointment: AppointmentWithRelations) {
    setSelectedAppointment(appointment);
    setDefaultSlot(undefined);
    setDialogOpen(true);
  }

  async function handleReschedule(
    appointment: AppointmentWithRelations,
    newStart: Date,
  ) {
    const date = format(newStart, "yyyy-MM-dd");
    const slots = await getDashboardAvailableSlots(
      appointment.service_id,
      appointment.staff_id,
      date,
      appointment.id,
    );

    const targetMs = newStart.getTime();
    const match =
      slots.find((slot) => parseISO(slot).getTime() === targetMs) ??
      slots.reduce<string | null>((best, slot) => {
        if (!best) return slot;
        const diff = Math.abs(parseISO(slot).getTime() - targetMs);
        const bestDiff = Math.abs(parseISO(best).getTime() - targetMs);
        return diff < bestDiff ? slot : best;
      }, null);

    if (!match) {
      toast("No available slot at that time.", "error");
      return;
    }

    const result = await rescheduleAppointment(appointment.id, match);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(result.success ?? "Appointment rescheduled.", "success");
    refresh();
  }

  function handleViewChange(newView: CalendarView) {
    setView(newView);
    const range = getRange(newView, date);
    router.replace(
      `/dashboard/calendar?view=${newView}&date=${range.start.toISOString()}`,
    );
  }

  function handleDateChange(newDate: Date) {
    setDate(newDate);
    const range = getRange(view, newDate);
    router.replace(
      `/dashboard/calendar?view=${view}&date=${range.start.toISOString()}`,
    );
  }

  if (!hasSetup) {
    return (
      <EmptyState
        title="Set up your booking engine"
        description="Add at least one service and one staff member before scheduling appointments."
      />
    );
  }

  return (
    <div className="space-y-6">
      <CalendarToolbar
        view={view}
        date={date}
        onViewChange={handleViewChange}
        onDateChange={handleDateChange}
        onNewAppointment={() => openNew()}
      />

      {view === "day" && (
        <DayView
          date={date}
          appointments={appointments}
          onSelectAppointment={openEdit}
          onSelectSlot={openNew}
          onReschedule={handleReschedule}
        />
      )}
      {view === "week" && (
        <WeekView
          date={date}
          appointments={appointments}
          onSelectAppointment={openEdit}
          onSelectSlot={openNew}
        />
      )}
      {view === "month" && (
        <MonthView
          date={date}
          appointments={appointments}
          onSelectAppointment={openEdit}
          onSelectDay={(day) => {
            setView("day");
            setDate(day);
          }}
        />
      )}

      <AppointmentDialog
        key={
          selectedAppointment?.id ??
          `new-${defaultSlot?.toISOString() ?? "blank"}`
        }
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        appointment={selectedAppointment}
        services={services}
        staff={staff}
        customers={customers}
        defaultDate={defaultSlot}
        onSuccess={refresh}
      />
    </div>
  );
}
