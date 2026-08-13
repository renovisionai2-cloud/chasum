"use client";

import { BookingSheet } from "@/components/booking-sheet";
import {
  type CalendarColorMode,
} from "@/components/calendar/appointment-block";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { MonthPlanningView } from "@/components/calendar/month-planning-view";
import { WeekPlanningView } from "@/components/calendar/week-planning-view";
import {
  DEFAULT_CALENDAR_BOARD_FILTERS,
  filterAppointmentsForBoard,
  type CalendarBoardFilters,
} from "@/lib/dashboard/appointment-ops";
import {
  AgendaView,
  ResourceView,
  TimelineView,
} from "@/components/calendar/calendar-views-extended";
import { AppointmentDrawer } from "@/components/day-view/appointment-drawer";
import {
  DayAgendaList,
  DayControlCenter,
} from "@/components/day-view/day-control-center";
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
import type { StaffDayOverlay } from "@/lib/actions/day-overlays";
import {
  cancelAppointment,
  rescheduleAppointment,
  resizeAppointment,
  setAppointmentStatus,
} from "@/lib/actions/appointments";
import {
  duplicateAppointment,
  undoLastAppointmentChange,
} from "@/lib/actions/booking-engine";
import { getDashboardAvailableSlots } from "@/lib/actions/scheduling";
import { getCrmAppointmentForBooking } from "@/lib/actions/crm";
import type { TaxRate } from "@/lib/business/types";
import type { DashboardInsight } from "@/lib/dashboard/insights";
import {
  RECEPTION_ACTION_EVENT,
  type ReceptionActionDetail,
} from "@/lib/reception/workflow-events";
import { useToast } from "@/providers/toast-provider";
import type {
  AppointmentStatus,
  AppointmentWithRelations,
  CalendarView,
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { DEFAULT_BOOKING_INTERVAL_MINUTES } from "@/lib/booking/interval";
import type { BookingDraft } from "@/lib/booking/booking-draft";
import {
  formatCalendarDateParam,
  parseCalendarDateParam,
} from "@/lib/calendar/date-param";
import {
  CALENDAR_CANVAS_CLASS,
  isDayViewIdle,
  shouldMountReceptionRail,
  shouldShowMorningBrief,
} from "@/lib/calendar/day-surface";
import { parseISO } from "@/lib/calendar/utils";
import { MorningBrief } from "@/components/day-view/morning-brief";
import type { MorningBriefData } from "@/lib/actions/morning-brief";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
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
  showReceptionPanel?: boolean;
  focusAppointmentId?: string | null;
  dayOverlays?: StaffDayOverlay[];
  openBookOnLoad?: boolean;
  currency?: string | null;
  taxRates?: TaxRate[];
  timezone?: string | null;
  /** Booking start-time interval (minutes) from location/business settings. */
  appointmentIntervalMinutes?: number;
  morningBrief?: MorningBriefData | null;
};

export function CalendarClient({
  appointments: serverAppointments,
  services,
  staff,
  customers,
  locations,
  initialDate,
  initialView,
  insights = [],
  waitlist = [],
  showReceptionPanel = true,
  focusAppointmentId = null,
  dayOverlays = [],
  openBookOnLoad = false,
  currency = null,
  taxRates = [],
  timezone = null,
  appointmentIntervalMinutes = DEFAULT_BOOKING_INTERVAL_MINUTES,
  morningBrief = null,
}: CalendarClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<CalendarView>(initialView);
  const [date, setDate] = useState(() => parseCalendarDateParam(initialDate));
  const [colorMode, setColorMode] = useState<CalendarColorMode>("service");
  const urlAppointment = useMemo(
    () =>
      focusAppointmentId
        ? (serverAppointments.find((a) => a.id === focusAppointmentId) ?? null)
        : null,
    [focusAppointmentId, serverAppointments],
  );
  const [dialogOpen, setDialogOpen] = useState(
    openBookOnLoad || !!focusAppointmentId,
  );
  // Deep-link / post-booking focus opens management workspace (BookingSheet), not the quick drawer.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(urlAppointment);
  const focusHandledRef = useRef<string | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<Date | undefined>();
  const [defaultStaffId, setDefaultStaffId] = useState<string | undefined>();
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  const [forceQuickAddCustomer, setForceQuickAddCustomer] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [mobileStaffId, setMobileStaffId] = useState<string | null>(null);
  const [blockTimeOpen, setBlockTimeOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [searchFocusSignal, setSearchFocusSignal] = useState(0);
  const [bookFocusSignal, setBookFocusSignal] = useState(0);
  const [walkInSignal, setWalkInSignal] = useState(0);
  const [createCustomerSignal, setCreateCustomerSignal] = useState(0);
  const [appointmentsBase, setOptimisticAppointments] = useOptimistic(
    serverAppointments,
    (
      current: AppointmentWithRelations[],
      update: AppointmentWithRelations[],
    ) => update,
  );
  /**
   * Mutation-wide overlay: survives Day/Week/Month switches until server catches up.
   * Used for CREATE upserts, UPDATE/RESCHEDULE patches, and CANCEL status.
   * Do not invent a second calendar store — merge onto the RSC appointment list.
   */
  const [appointmentOverrides, setAppointmentOverrides] = useState<
    ReadonlyMap<string, AppointmentWithRelations>
  >(() => new Map());
  /** Survives view switches; server cancelled is authoritative when present. */
  const [cancelledOverrideIds, setCancelledOverrideIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [isRefreshing, startTransition] = useTransition();
  const [boardFilters, setBoardFilters] = useState<CalendarBoardFilters>(
    DEFAULT_CALENDAR_BOARD_FILTERS,
  );

  const appointments = useMemo(() => {
    const byId = new Map<string, AppointmentWithRelations>();
    for (const a of appointmentsBase) byId.set(a.id, a);
    for (const [id, override] of appointmentOverrides) {
      const existing = byId.get(id);
      byId.set(id, existing ? { ...existing, ...override } : override);
    }
    return Array.from(byId.values()).map((a) =>
      cancelledOverrideIds.has(a.id) && a.status !== "cancelled"
        ? { ...a, status: "cancelled" as const }
        : a,
    );
  }, [appointmentsBase, appointmentOverrides, cancelledOverrideIds]);

  const upsertAppointmentOverride = useCallback(
    (appointment: AppointmentWithRelations) => {
      setAppointmentOverrides((prev) => {
        const next = new Map(prev);
        next.set(appointment.id, appointment);
        return next;
      });
    },
    [],
  );

  const filteredAppointments = useMemo(
    () => filterAppointmentsForBoard(appointments, boardFilters),
    [appointments, boardFilters],
  );

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const convergeAfterMutation = useCallback(
    async (appointmentId?: string | null) => {
      if (appointmentId) {
        const appt = await getCrmAppointmentForBooking(appointmentId);
        if (appt) upsertAppointmentOverride(appt);
      }
      refresh();
    },
    [refresh, upsertAppointmentOverride],
  );

  useEffect(() => {
    function onAction(e: Event) {
      const detail = (e as CustomEvent<ReceptionActionDetail>).detail;
      if (!detail?.action) return;
      switch (detail.action) {
        case "new-customer":
          setSelectedAppointment(null);
          setDefaultSlot(date);
          setDefaultStaffId(undefined);
          setForceQuickAddCustomer(true);
          setDrawerOpen(false);
          setDialogOpen(true);
          setCreateCustomerSignal((n) => n + 1);
          break;
        case "book-appointment":
          setSelectedAppointment(null);
          setBookingDraft(null);
          setDefaultSlot(undefined);
          setDefaultStaffId(undefined);
          setForceQuickAddCustomer(false);
          setDrawerOpen(false);
          setDialogOpen(true);
          setBookFocusSignal((n) => n + 1);
          break;
        case "walk-in":
          setSelectedAppointment(null);
          setBookingDraft(null);
          setDefaultSlot(date);
          setDefaultStaffId(undefined);
          setForceQuickAddCustomer(false);
          setDrawerOpen(false);
          setDialogOpen(true);
          setWalkInSignal((n) => n + 1);
          break;
        case "block-time":
          setBlockTimeOpen(true);
          break;
        case "add-note":
          setNoteOpen(true);
          break;
        case "focus-customer-search":
          setSelectedAppointment(null);
          setBookingDraft(null);
          setDefaultSlot(undefined);
          setDefaultStaffId(undefined);
          setForceQuickAddCustomer(false);
          setDrawerOpen(false);
          setDialogOpen(true);
          setSearchFocusSignal((n) => n + 1);
          break;
      }
    }
    window.addEventListener(RECEPTION_ACTION_EVENT, onAction);
    return () => window.removeEventListener(RECEPTION_ACTION_EVENT, onAction);
  }, [date]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const hasSetup = services.length > 0 && staff.length > 0;
  const effectiveView = view;

  function openPlanDay(civilDate: string) {
    setSelectedAppointment(null);
    setBookingDraft({ date: civilDate });
    setDefaultSlot(undefined);
    setDefaultStaffId(undefined);
    setForceQuickAddCustomer(false);
    setDrawerOpen(false);
    setDialogOpen(true);
  }

  function inspectDay(day: Date) {
    setView("day");
    setDate(day);
    router.replace(
      `/dashboard/calendar?view=day&date=${formatCalendarDateParam(day, timezone)}`,
      { scroll: false },
    );
    refresh();
  }

  function openNew(slot?: Date, staffId?: string, draft?: BookingDraft | null) {
    setSelectedAppointment(null);
    setBookingDraft(draft ?? null);
    setDefaultSlot(
      draft?.startIso
        ? parseISO(draft.startIso)
        : draft?.date && !slot
          ? undefined
          : slot,
    );
    setDefaultStaffId(
      draft?.staffId !== undefined && draft?.staffId !== null
        ? draft.staffId
        : staffId === "__unassigned__"
          ? ""
          : staffId,
    );
    setForceQuickAddCustomer(false);
    setDrawerOpen(false);
    setDialogOpen(true);
  }

  function openNewCustomer() {
    setSelectedAppointment(null);
    setBookingDraft(null);
    setDefaultSlot(date);
    setDefaultStaffId(undefined);
    setForceQuickAddCustomer(true);
    setDrawerOpen(false);
    setDialogOpen(true);
  }

  function openDrawer(appointment: AppointmentWithRelations) {
    setSelectedAppointment(appointment);
    setDefaultSlot(undefined);
    setDrawerOpen(true);
  }

  function openEdit(appointment: AppointmentWithRelations) {
    setSelectedAppointment(appointment);
    setBookingDraft(null);
    setDefaultSlot(undefined);
    setDrawerOpen(false);
    setDialogOpen(true);
  }

  async function resolveAppointmentById(
    appointmentId: string,
  ): Promise<AppointmentWithRelations | null> {
    const local =
      appointments.find((a) => a.id === appointmentId) ??
      serverAppointments.find((a) => a.id === appointmentId) ??
      null;
    if (local) return local;
    return getCrmAppointmentForBooking(appointmentId);
  }

  async function openCreatedAppointment(appointmentId: string) {
    const appt = await resolveAppointmentById(appointmentId);
    if (!appt) {
      throw new Error("Appointment not found");
    }
    upsertAppointmentOverride(appt);
    refresh();
    openEdit(appt);
  }

  useEffect(() => {
    if (!focusAppointmentId) return;
    if (focusHandledRef.current === focusAppointmentId) return;
    focusHandledRef.current = focusAppointmentId;
    let cancelled = false;
    void (async () => {
      const appt = await resolveAppointmentById(focusAppointmentId);
      if (cancelled || !appt) return;
      openEdit(appt);
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally once per focusAppointmentId — openEdit/resolve use latest closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusAppointmentId, serverAppointments]);

  async function handleReschedule(
    appointment: AppointmentWithRelations,
    newStart: Date,
    targetStaffId?: string,
  ) {
    const duration =
      parseISO(appointment.end_time).getTime() -
      parseISO(appointment.start_time).getTime();
    const optimisticEnd = new Date(newStart.getTime() + duration);
    const nextStaffId = targetStaffId ?? appointment.staff_id;
    const nextStaff =
      (nextStaffId
        ? staff.find((s) => s.id === nextStaffId)
        : null) ?? appointment.staff ?? null;

    startTransition(() => {
      setOptimisticAppointments(
        appointments.map((a) =>
          a.id === appointment.id
            ? {
                ...a,
                start_time: newStart.toISOString(),
                end_time: optimisticEnd.toISOString(),
                staff_id: nextStaffId ?? null,
                staff: nextStaff
                  ? {
                      id: nextStaff.id,
                      name: nextStaff.name,
                      color: nextStaff.color,
                      photo_url: nextStaff.photo_url ?? null,
                    }
                  : {
                      id: "",
                      name: "Unassigned",
                      color: "#94a3b8",
                      photo_url: null,
                    },
              }
            : a,
        ),
      );
    });

    const dateStr = formatCalendarDateParam(newStart, timezone);
    if (!nextStaffId) {
      const result = await rescheduleAppointment(
        appointment.id,
        newStart.toISOString(),
      );
      if (result.error) {
        toast(result.error, "error");
        refresh();
        return;
      }
      toast(
        `Rescheduled · ${appointment.customer.name} · ${format(newStart, "MMM d · h:mm a")}`,
        "success",
      );
      upsertAppointmentOverride({
        ...appointment,
        start_time: newStart.toISOString(),
        end_time: optimisticEnd.toISOString(),
        staff_id: null,
        staff: appointment.staff,
      });
      refresh();
      return;
    }

    const slots = await getDashboardAvailableSlots(
      appointment.service_id,
      nextStaffId,
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

    const result = await rescheduleAppointment(appointment.id, match, {
      staffId:
        nextStaffId !== appointment.staff_id ? nextStaffId : undefined,
    });
    if (result.error) {
      toast(result.error, "error");
      refresh();
      return;
    }
    const matchedStart = parseISO(match);
    const matchedEnd = new Date(matchedStart.getTime() + duration);
    toast(
      `Rescheduled · ${appointment.customer.name} · ${format(matchedStart, "MMM d · h:mm a")}`,
      "success",
    );
    upsertAppointmentOverride({
      ...appointment,
      start_time: match,
      end_time: matchedEnd.toISOString(),
      staff_id: nextStaffId,
      staff: nextStaff
        ? {
            id: nextStaff.id,
            name: nextStaff.name,
            color: nextStaff.color,
            photo_url: nextStaff.photo_url ?? null,
          }
        : appointment.staff,
    });
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
    upsertAppointmentOverride({
      ...appointment,
      end_time: newEnd.toISOString(),
    });
    refresh();
  }

  async function handleStatusChange(
    appointment: AppointmentWithRelations,
    status: AppointmentStatus,
  ) {
    startTransition(() => {
      setOptimisticAppointments(
        appointments.map((a) =>
          a.id === appointment.id ? { ...a, status } : a,
        ),
      );
    });
    const result = await setAppointmentStatus(appointment.id, status);
    if (result.error) {
      toast(result.error, "error");
      refresh();
      return;
    }
    toast(result.success ?? "Updated.", "success");
    upsertAppointmentOverride({ ...appointment, status });
    refresh();
  }

  async function handleCancel(appointment: AppointmentWithRelations) {
    if (appointment.status === "cancelled") return;
    setCancelledOverrideIds((prev) => new Set(prev).add(appointment.id));
    startTransition(() => {
      setOptimisticAppointments(
        appointments.map((a) =>
          a.id === appointment.id
            ? { ...a, status: "cancelled" as const }
            : a,
        ),
      );
    });
    const result = await cancelAppointment(appointment.id);
    if (result.error) {
      setCancelledOverrideIds((prev) => {
        const next = new Set(prev);
        next.delete(appointment.id);
        return next;
      });
      toast(result.error, "error");
      refresh();
      return;
    }
    toast(result.success ?? "Appointment cancelled.", "success");
    upsertAppointmentOverride({
      ...appointment,
      status: "cancelled" as const,
    });
    refresh();
  }

  /**
   * LOCK: URL ?date= is always the selected civil anchor.
   * Never write getCalendarViewRange(...).start (Month padding / week window).
   * router.replace then refresh so RSC reloads the derived fetch range.
   */
  function navigateCalendar(nextView: CalendarView, nextDate: Date) {
    setView(nextView);
    setDate(nextDate);
    router.replace(
      `/dashboard/calendar?view=${nextView}&date=${formatCalendarDateParam(nextDate, timezone)}`,
      { scroll: false },
    );
    refresh();
  }

  function handleViewChange(newView: CalendarView) {
    navigateCalendar(newView, date);
  }

  function handleDateChange(newDate: Date) {
    navigateCalendar(view, newDate);
  }

  if (!hasSetup) {
    return (
      <EmptyState
        title="Set up your booking engine"
        description="Add at least one service and one bookable employee before scheduling appointments."
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/dashboard/services">
            <Button size="sm">Add service</Button>
          </Link>
          <Link href="/dashboard/employees">
            <Button size="sm" variant="outline">
              Add employee
            </Button>
          </Link>
        </div>
      </EmptyState>
    );
  }

  const filtersActive =
    boardFilters.staffId !== DEFAULT_CALENDAR_BOARD_FILTERS.staffId ||
    boardFilters.status !== DEFAULT_CALENDAR_BOARD_FILTERS.status;
  const filteredEmpty =
    filteredAppointments.length === 0 && appointments.length > 0;

  const calendarBody = (
    <div className="w-full min-w-0 space-y-2">
      <CalendarToolbar
        view={view}
        date={date}
        colorMode={colorMode}
        onViewChange={handleViewChange}
        onDateChange={handleDateChange}
        onColorModeChange={setColorMode}
        onNewAppointment={() => openNew()}
        onNewCustomer={openNewCustomer}
        timeZone={timezone}
        staff={staff}
        filters={boardFilters}
        onFiltersChange={setBoardFilters}
        onUndo={() => {
          startTransition(async () => {
            const result = await undoLastAppointmentChange();
            if (result.error) toast(result.error, "error");
            else {
              toast(result.success ?? "Undone.", "success");
              router.refresh();
            }
          });
        }}
        onDuplicate={() => {
          if (!selectedAppointment) {
            toast("Select an appointment to duplicate.", "error");
            return;
          }
          startTransition(async () => {
            const result = await duplicateAppointment(selectedAppointment.id);
            if (result.error) toast(result.error, "error");
            else {
              toast(result.success ?? "Duplicated.", "success");
              router.refresh();
            }
          });
        }}
        canDuplicate={Boolean(selectedAppointment)}
      />

      {effectiveView !== "day" ? (
        <>
          <CalendarFilters
            staff={staff}
            filters={boardFilters}
            onChange={setBoardFilters}
            matchedCount={filteredAppointments.length}
            totalCount={appointments.length}
          />
          <ColorLegend colorMode={colorMode} services={services} staff={staff} />
        </>
      ) : null}

      {filteredEmpty && effectiveView !== "day" ? (
        <div
          role="status"
          className="rounded-[var(--radius-lg)] border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground"
        >
          No appointments match the current filters.
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBoardFilters(DEFAULT_CALENDAR_BOARD_FILTERS)}
            >
              Reset filters
            </Button>
          </div>
        </div>
      ) : (
        <>
          {effectiveView === "day" && filteredEmpty ? (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-card/70 px-3 py-2 text-sm text-muted-foreground"
            >
              <span>No appointments match these filters.</span>
              {filtersActive ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBoardFilters(DEFAULT_CALENDAR_BOARD_FILTERS)}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : null}
          {effectiveView === "day" &&
            (isNarrow ? (
              <DayAgendaList
                date={date}
                appointments={filteredAppointments}
                onSelectAppointment={openDrawer}
                timeZone={timezone}
                onNewAppointment={() => openNew()}
                staff={staff}
                selectedStaffId={mobileStaffId}
                onStaffChange={setMobileStaffId}
              />
            ) : (
              <DayControlCenter
                date={date}
                appointments={filteredAppointments}
                staff={staff}
                overlays={dayOverlays}
                onSelectAppointment={openDrawer}
                onSelectSlot={openNew}
                onReschedule={handleReschedule}
                onResize={handleResize}
                colorMode={colorMode}
                intervalMinutes={appointmentIntervalMinutes}
                timeZone={timezone}
                onNewAppointment={() => openNew()}
                loading={isRefreshing}
                staffFilter={boardFilters.staffId}
              />
            ))}
          {effectiveView === "week" && (
            <WeekPlanningView
              date={date}
              appointments={filteredAppointments}
              onSelectAppointment={openEdit}
              onInspectDay={inspectDay}
              onPlanDay={openPlanDay}
              timeZone={timezone}
              isNarrow={isNarrow}
            />
          )}
          {effectiveView === "month" && (
            <MonthPlanningView
              date={date}
              appointments={filteredAppointments}
              onSelectAppointment={openEdit}
              onInspectDay={inspectDay}
              onPlanDay={openPlanDay}
              timeZone={timezone}
              isNarrow={isNarrow}
            />
          )}
          {effectiveView === "agenda" && (
            <AgendaView
              date={date}
              appointments={filteredAppointments}
              onSelectAppointment={openEdit}
            />
          )}
          {effectiveView === "timeline" && (
            <TimelineView
              date={date}
              appointments={filteredAppointments}
              onSelectAppointment={openEdit}
            />
          )}
          {(effectiveView === "employees" || effectiveView === "resource") && (
            <ResourceView
              date={date}
              appointments={filteredAppointments}
              staff={staff}
              locations={locations}
              mode={effectiveView === "resource" ? "resource" : "employees"}
              onSelectAppointment={openEdit}
            />
          )}
          {effectiveView === "locations" && (
            <ResourceView
              date={date}
              appointments={filteredAppointments}
              staff={staff}
              locations={locations}
              mode="locations"
              onSelectAppointment={openEdit}
            />
          )}
        </>
      )}
    </div>
  );

  const mountReceptionRail = shouldMountReceptionRail({
    view: effectiveView,
    receptionPanelOpen: panelOpen,
    showReceptionPanel,
  });
  const dayIdle = isDayViewIdle({
    view: effectiveView,
    bookingOpen: dialogOpen && !selectedAppointment,
    appointmentOpen: drawerOpen || (dialogOpen && Boolean(selectedAppointment)),
    receptionPanelOpen: mountReceptionRail,
  });

  return (
    <div
      className="relative w-full min-w-0 space-y-2"
      data-day-surface={effectiveView === "day" ? "day" : "other"}
      data-day-idle={dayIdle ? "true" : "false"}
      data-reception-rail={mountReceptionRail ? "open" : "closed"}
    >
      {showReceptionPanel ? <ReceptionShortcuts /> : null}
      {morningBrief && shouldShowMorningBrief(effectiveView) ? (
        <MorningBrief brief={morningBrief} />
      ) : null}
      {isRefreshing ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden rounded-full bg-primary/15"
          aria-hidden
        >
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      ) : null}
      <div
        className={cn(
          "flex w-full min-w-0 flex-col gap-2",
          mountReceptionRail ? "lg:flex-row lg:items-start lg:gap-4" : null,
        )}
      >
        <div
          className={cn(
            CALENDAR_CANVAS_CLASS,
            "flex-1 transition-opacity",
            isRefreshing && "opacity-80",
          )}
          data-calendar-canvas="primary"
          data-calendar-canvas-width="full"
        >
          {calendarBody}
        </div>
        {mountReceptionRail ? (
          <ReceptionPanel
            customers={customers}
            services={services}
            staff={staff}
            locations={locations}
            taxRates={taxRates}
            currency={currency}
            insights={insights}
            waitlist={waitlist}
            open={panelOpen}
            onOpenChange={setPanelOpen}
            onBooked={refresh}
            onOpenFullDialog={(draft, appointmentId) => {
              if (appointmentId) {
                void (async () => {
                  try {
                    await openCreatedAppointment(appointmentId);
                  } catch {
                    toast(
                      "Could not open that appointment. Try again from the calendar.",
                      "error",
                    );
                  }
                })();
                return;
              }
              openNew(undefined, undefined, draft);
            }}
            searchFocusSignal={searchFocusSignal}
            bookFocusSignal={bookFocusSignal}
            walkInSignal={walkInSignal}
            createCustomerSignal={createCustomerSignal}
          />
        ) : null}
      </div>

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


      {drawerOpen && selectedAppointment ? (
        <AppointmentDrawer
          open={drawerOpen}
          appointment={selectedAppointment}
          locations={locations}
          onClose={() => setDrawerOpen(false)}
          onEdit={openEdit}
          onStatusChange={handleStatusChange}
          onCancel={handleCancel}
          onRescheduleRequest={(appt) => {
            setDrawerOpen(false);
            openEdit(appt);
          }}
          onRefresh={refresh}
        />
      ) : null}

      <BookingSheet
        key={
          selectedAppointment?.id ??
          `new-${defaultSlot?.toISOString() ?? "blank"}-${defaultStaffId ?? ""}-${bookingDraft?.serviceId ?? ""}-${bookingDraft?.startIso ?? ""}-${bookingDraft?.date ?? ""}-${forceQuickAddCustomer ? "qc" : ""}`
        }
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setForceQuickAddCustomer(false);
          setBookingDraft(null);
        }}
        appointment={selectedAppointment}
        services={services}
        staff={staff}
        customers={customers}
        locations={locations}
        defaultDate={defaultSlot}
        defaultStaffId={defaultStaffId}
        defaultCustomerId={bookingDraft?.customerId ?? undefined}
        defaultServiceId={bookingDraft?.serviceId ?? undefined}
        draft={bookingDraft}
        channel={showReceptionPanel ? "reception" : "staff"}
        currency={currency}
        taxRates={taxRates}
        timezone={
          timezone ??
          locations.find((l) => l.is_default)?.timezone ??
          locations[0]?.timezone ??
          null
        }
        forceQuickAddCustomer={forceQuickAddCustomer}
        onSuccess={(meta) => {
          void convergeAfterMutation(meta?.appointmentId);
        }}
        onCancelAppointment={
          selectedAppointment
            ? async () => {
                await handleCancel(selectedAppointment);
              }
            : undefined
        }
        onViewCreatedAppointment={openCreatedAppointment}
      />
    </div>
  );
}
