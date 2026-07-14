"use client";

import { AppointmentDialog } from "@/components/calendar/appointment-dialog";
import {
  type CalendarColorMode,
} from "@/components/calendar/appointment-block";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import {
  DayView,
  MonthView,
  WeekView,
} from "@/components/calendar/calendar-views";
import { ColorLegend } from "@/components/reception/color-legend";
import {
  BlockTimeDialog,
  InternalNoteDialog,
} from "@/components/reception/quick-action-dialogs";
import { QuickActionsFab } from "@/components/reception/quick-actions-fab";
import { ReceptionPanel } from "@/components/reception/reception-panel";
import { ReceptionShortcuts } from "@/components/reception/reception-shortcuts";
import { EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  rescheduleAppointment,
  resizeAppointment,
} from "@/lib/actions/appointments";
import { getDashboardAvailableSlots } from "@/lib/actions/scheduling";
import type { DashboardInsight } from "@/lib/dashboard/insights";
import {
  RECEPTION_ACTION_EVENT,
  type ReceptionActionDetail,
} from "@/lib/reception/workflow-events";
import { useToast } from "@/providers/toast-provider";
import type {
  AppointmentWithRelations,
  CalendarView,
  Customer,
  Location,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";

type CalendarClientProps = {
  appointments: AppointmentWithRelations[];
  services: Service[];
  staff: StaffWithServices[];
  customers: Customer[];
  locations: Location[];
  initialDate: string;
  initialView: CalendarView;
  insights?: DashboardInsight[];
  showReceptionPanel?: boolean;
  focusAppointmentId?: string | null;
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
  appointments: serverAppointments,
  services,
  staff,
  customers,
  locations,
  initialDate,
  initialView,
  insights = [],
  showReceptionPanel = true,
  focusAppointmentId = null,
}: CalendarClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<CalendarView>(initialView);
  const [date, setDate] = useState(new Date(initialDate));
  const [colorMode, setColorMode] = useState<CalendarColorMode>("service");
  const urlAppointment = useMemo(
    () =>
      focusAppointmentId
        ? (serverAppointments.find((a) => a.id === focusAppointmentId) ?? null)
        : null,
    [focusAppointmentId, serverAppointments],
  );
  const [dialogOpen, setDialogOpen] = useState(!!urlAppointment);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(urlAppointment);
  const [defaultSlot, setDefaultSlot] = useState<Date | undefined>();
  const [panelOpen, setPanelOpen] = useState(true);
  const [blockTimeOpen, setBlockTimeOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [searchFocusSignal, setSearchFocusSignal] = useState(0);
  const [bookFocusSignal, setBookFocusSignal] = useState(0);
  const [walkInSignal, setWalkInSignal] = useState(0);
  const [createCustomerSignal, setCreateCustomerSignal] = useState(0);
  const [appointments, setOptimisticAppointments] = useOptimistic(
    serverAppointments,
    (
      current: AppointmentWithRelations[],
      update: AppointmentWithRelations[],
    ) => update,
  );
  const [isRefreshing, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    function onAction(e: Event) {
      const detail = (e as CustomEvent<ReceptionActionDetail>).detail;
      if (!detail?.action) return;
      switch (detail.action) {
        case "new-customer":
          setPanelOpen(true);
          setCreateCustomerSignal((n) => n + 1);
          break;
        case "book-appointment":
          setPanelOpen(true);
          setBookFocusSignal((n) => n + 1);
          break;
        case "walk-in":
          setPanelOpen(true);
          setWalkInSignal((n) => n + 1);
          break;
        case "block-time":
          setBlockTimeOpen(true);
          break;
        case "add-note":
          setNoteOpen(true);
          break;
        case "focus-customer-search":
          setPanelOpen(true);
          setSearchFocusSignal((n) => n + 1);
          break;
      }
    }
    window.addEventListener(RECEPTION_ACTION_EVENT, onAction);
    return () => window.removeEventListener(RECEPTION_ACTION_EVENT, onAction);
  }, []);

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
    const duration =
      parseISO(appointment.end_time).getTime() -
      parseISO(appointment.start_time).getTime();
    const optimisticEnd = new Date(newStart.getTime() + duration);

    startTransition(() => {
      setOptimisticAppointments(
        appointments.map((a) =>
          a.id === appointment.id
            ? {
                ...a,
                start_time: newStart.toISOString(),
                end_time: optimisticEnd.toISOString(),
              }
            : a,
        ),
      );
    });

    const dateStr = format(newStart, "yyyy-MM-dd");
    const slots = await getDashboardAvailableSlots(
      appointment.service_id,
      appointment.staff_id,
      dateStr,
      appointment.id,
      appointment.location_id,
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
      refresh();
      return;
    }

    const result = await rescheduleAppointment(appointment.id, match);
    if (result.error) {
      toast(result.error, "error");
      refresh();
      return;
    }
    toast(
      `Rescheduled · ${appointment.customer.name} · ${format(parseISO(match), "MMM d · h:mm a")}`,
      "success",
    );
    refresh();
  }

  async function handleResize(
    appointment: AppointmentWithRelations,
    newEnd: Date,
  ) {
    startTransition(() => {
      setOptimisticAppointments(
        appointments.map((a) =>
          a.id === appointment.id
            ? { ...a, end_time: newEnd.toISOString() }
            : a,
        ),
      );
    });

    const result = await resizeAppointment(
      appointment.id,
      newEnd.toISOString(),
    );
    if (result.error) {
      toast(result.error, "error");
      refresh();
      return;
    }
    toast(result.success ?? "Duration updated.", "success");
    refresh();
  }

  function handleViewChange(newView: CalendarView) {
    setView(newView);
    const range = getRange(newView, date);
    router.replace(
      `/dashboard/calendar?view=${newView}&date=${range.start.toISOString()}`,
      { scroll: false },
    );
  }

  function handleDateChange(newDate: Date) {
    setDate(newDate);
    const range = getRange(view, newDate);
    router.replace(
      `/dashboard/calendar?view=${view}&date=${range.start.toISOString()}`,
      { scroll: false },
    );
  }

  if (!hasSetup) {
    return (
      <EmptyState
        title="Set up your booking engine"
        description="Add at least one service and one staff member before scheduling appointments."
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/dashboard/services">
            <Button size="sm">Add service</Button>
          </Link>
          <Link href="/dashboard/staff">
            <Button size="sm" variant="outline">
              Add staff
            </Button>
          </Link>
        </div>
      </EmptyState>
    );
  }

  const calendarBody = (
    <div className="space-y-4">
      <CalendarToolbar
        view={view}
        date={date}
        colorMode={colorMode}
        onViewChange={handleViewChange}
        onDateChange={handleDateChange}
        onColorModeChange={setColorMode}
        onNewAppointment={() => openNew()}
      />

      <ColorLegend colorMode={colorMode} services={services} staff={staff} />

      {view === "day" && (
        <DayView
          date={date}
          appointments={appointments}
          onSelectAppointment={openEdit}
          onSelectSlot={openNew}
          onReschedule={handleReschedule}
          onResize={handleResize}
          colorMode={colorMode}
        />
      )}
      {view === "week" && (
        <WeekView
          date={date}
          appointments={appointments}
          onSelectAppointment={openEdit}
          onSelectSlot={openNew}
          onReschedule={handleReschedule}
          onResize={handleResize}
          colorMode={colorMode}
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
          colorMode={colorMode}
        />
      )}
    </div>
  );

  return (
    <div className="relative space-y-4">
      {showReceptionPanel ? <ReceptionShortcuts /> : null}
      {isRefreshing ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden rounded-full bg-primary/15"
          aria-hidden
        >
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div
          className={`min-w-0 flex-1 transition-opacity ${isRefreshing ? "opacity-80" : ""}`}
        >
          {calendarBody}
        </div>
        {showReceptionPanel && (
          <ReceptionPanel
            customers={customers}
            services={services}
            staff={staff}
            locations={locations}
            insights={insights}
            open={panelOpen}
            onOpenChange={setPanelOpen}
            onBooked={refresh}
            onOpenFullDialog={() => openNew()}
            searchFocusSignal={searchFocusSignal}
            bookFocusSignal={bookFocusSignal}
            walkInSignal={walkInSignal}
            createCustomerSignal={createCustomerSignal}
          />
        )}
      </div>

      {showReceptionPanel && !panelOpen && (
        <div className="lg:hidden">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setPanelOpen(true)}
          >
            Open reception panel
          </Button>
        </div>
      )}

      {showReceptionPanel && <QuickActionsFab />}

      <BlockTimeDialog
        open={blockTimeOpen}
        onClose={() => setBlockTimeOpen(false)}
        staff={staff}
        onSaved={refresh}
      />
      <InternalNoteDialog
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
      />

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
        locations={locations}
        defaultDate={defaultSlot}
        onSuccess={refresh}
      />
    </div>
  );
}
