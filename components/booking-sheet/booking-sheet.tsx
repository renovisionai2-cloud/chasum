"use client";

import { CollectPaymentWorkspace } from "@/components/commerce/collect-payment-workspace";
import { AppointmentSection, type BookingOfferType } from "@/components/booking-sheet/appointment-section";
import { AppointmentCustomerContext } from "@/components/booking-sheet/appointment-customer-context";
import { AppointmentExpandToggle } from "@/components/booking-sheet/appointment-expand-toggle";
import { AppointmentManagementActions } from "@/components/booking-sheet/appointment-management-actions";
import {
  AvailabilitySection,
  type AvailabilitySectionHandle,
} from "@/components/booking-sheet/availability-section";
import { BookingConfirmStep } from "@/components/booking-sheet/booking-confirm-step";
import { BookingDatetimePanel } from "@/components/booking-sheet/booking-datetime-panel";
import { BookingEmployeeDecision } from "@/components/booking-sheet/booking-employee-decision";
import { BookingMoreOptions } from "@/components/booking-sheet/booking-more-options";
import { BookingProgressIndicator } from "@/components/booking-sheet/booking-progress";
import { BookingServiceDecision } from "@/components/booking-sheet/booking-service-decision";
import { BookingSilentHints } from "@/components/booking-sheet/booking-silent-hints";
import {
  BookingDecisionFrame,
  BookingSummaryStrip,
} from "@/components/booking-sheet/booking-summary-strip";
import {
  BookingSuccessState,
  type BookingSuccessInfo,
} from "@/components/booking-sheet/booking-success-state";
import {
  bookingDecisionAccess,
  bookingFooterStatus,
  firstMissingDecision,
  isIntentionallyResolved,
  previousDecision,
  type BookingDecision,
  type BookingDecisionProvenance,
} from "@/components/booking-sheet/booking-workflow";
import { CustomerSection } from "@/components/booking-sheet/customer-section";
import { PaymentsSection } from "@/components/booking-sheet/payments-section";
import { BookingCommunicationsSection } from "@/components/booking-sheet/booking-communications-section";
import { QuickActionsMenu } from "@/components/booking-sheet/quick-actions-menu";
import { SelectedAppointmentBanner } from "@/components/booking-sheet/selected-appointment-banner";
import { SummerAssistant } from "@/components/booking-sheet/summer-assistant";
import { TimelineSection } from "@/components/booking-sheet/timeline-section";
import {
  BookingPaymentSection,
  confirmButtonLabel,
  defaultBookingPaymentDraft,
  type BookingPaymentDraft,
} from "@/components/booking/booking-payment-section";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  BOOKING_SHEET_WIDE_PX,
} from "@/components/ui/sheet";
import {
  cancelAppointment,
  createAppointment,
  setAppointmentStatus,
  updateAppointment,
} from "@/lib/actions/appointments";
import { listPackages } from "@/lib/actions/business-management";
import { duplicateAppointment } from "@/lib/actions/booking-engine";
import {
  getBookingSheetCustomerSnapshot,
  previewBookingSheetAvailability,
  type BookingSheetAvailability,
} from "@/lib/actions/booking-sheet";
import type { BookingSheetChannel } from "@/lib/booking-sheet/channels";
import type { BookingDraft } from "@/lib/booking/booking-draft";
import type { ServicePackage, TaxRate } from "@/lib/business/types";
import { filterEligibleBookingStaff } from "@/lib/booking/eligible-staff";
import { DEFAULT_BOOKING_INTERVAL_MINUTES } from "@/lib/booking/interval";
import {
  OPTIONAL_STAFF_PERSISTENCE_ENABLED,
  RECEPTION_EMPLOYEE_REQUIRED_MESSAGE,
  isUnassignedStaffSelection,
} from "@/lib/booking/optional-staff";
import {
  durationFromAppointmentTimes,
  resolveBookingDuration,
} from "@/lib/booking/resolved-duration";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { formatMoneyCents } from "@/lib/commerce/money";
import { resolveBookingFinancials } from "@/lib/commerce/booking-financials";
import {
  useBookingPreferences,
  writeBookingPreferences,
} from "@/lib/reception/use-booking-preferences";
import type {
  ActionState,
  AppointmentStatus,
  AppointmentWithRelations,
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";
import { useFormAction } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { addDays, format } from "date-fns";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

export type BookingSheetProps = {
  open: boolean;
  onClose: () => void;
  appointment?: AppointmentWithRelations | null;
  services: Service[];
  staff: StaffWithServices[];
  customers: Customer[];
  locations: Location[];
  packages?: ServicePackage[];
  defaultDate?: Date;
  defaultStaffId?: string;
  /** Prefill customer when opening from CRM / Reception without an appointment. */
  defaultCustomerId?: string;
  /** Prefill service from Reception / calendar draft. */
  defaultServiceId?: string;
  /** Structured draft from Quick Appointment — IDs win over prefs. */
  draft?: BookingDraft | null;
  channel?: BookingSheetChannel;
  onSuccess: (meta?: { appointmentId?: string | null }) => void;
  /**
   * When provided (Reception calendar), cancel uses shared optimistic lifecycle
   * sync instead of a local cancelAppointment call.
   */
  onCancelAppointment?: () => void | Promise<void>;
  /**
   * After create success, open this exact appointment in the existing
   * appointment-management workspace (same path as clicking it on the calendar).
   */
  onViewCreatedAppointment?: (appointmentId: string) => void | Promise<void>;
  /** Business currency for money formatting. */
  currency?: string | null;
  /** Active tax catalog for pricing. */
  taxRates?: TaxRate[];
  /** Location/business timezone for the Selected Appointment banner. */
  timezone?: string | null;
  /** Open straight into the quick-add customer form (e.g. from Summer / Reception). */
  forceQuickAddCustomer?: boolean;
};

function slotDateInBusinessTimezone(
  iso: string,
  timeZone: string | null | undefined,
): string {
  const zoned = calendarDateInTimezone(iso, timeZone);
  if (zoned) return zoned;
  // Last resort: noon-anchor local format (avoid UTC date-only parse).
  return format(parseISO(iso), "yyyy-MM-dd");
}

function slotKey(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

/**
 * Unified Booking Sheet — the only staff/reception booking workspace.
 * Calendar, Reception, Summer suggestions, and mobile all open this surface.
 * Mutations go through Booking Engine actions. Summer never invents slots.
 *
 * Slot authority: once a time is selected (by click, by Summer, or by
 * choosing an alternate employee) it stays selected across every other
 * field change. Only an explicit date change — by the user or by Summer
 * moving to tomorrow — clears it. Availability results are suggestions
 * only; they never overwrite the selection.
 */
export function BookingSheet({
  open,
  onClose,
  appointment,
  services,
  staff,
  customers: initialCustomers,
  locations,
  packages: packagesProp,
  defaultDate,
  defaultStaffId,
  defaultCustomerId,
  defaultServiceId,
  draft = null,
  channel = "staff",
  onSuccess,
  onCancelAppointment,
  onViewCreatedAppointment,
  currency,
  taxRates = [],
  timezone,
  forceQuickAddCustomer = false,
}: BookingSheetProps) {
  const isEditing = !!appointment;
  const action = isEditing ? updateAppointment : createAppointment;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const { toast } = useToast();
  const prefs = useBookingPreferences();
  const [busy, startBusy] = useTransition();

  const preferred = useMemo(() => {
    const draftStart = draft?.startIso?.trim() || null;
    // Edit mode: appointment start is authoritative. Never let a leftover
    // draft or calendar focus date replace the saved appointment.
    const initialStart = appointment
      ? appointment.start_time
      : (draftStart ?? defaultDate?.toISOString() ?? null);

    const zone =
      timezone ??
      locations.find((l) => l.id === (appointment?.location_id ?? ""))
        ?.timezone ??
      locations.find((l) => l.is_default)?.timezone ??
      locations[0]?.timezone ??
      null;

    const locationId =
      appointment?.location_id ??
      (!appointment ? draft?.locationId : null) ??
      (prefs.locationId && locations.some((l) => l.id === prefs.locationId)
        ? prefs.locationId
        : null) ??
      locations.find((l) => l.is_default)?.id ??
      locations[0]?.id ??
      "";

    const locationServices = services.filter(
      (s) => s.is_active && (!locationId || s.location_id === locationId),
    );

    // Adaptive workspace: do not silently invent a service from the catalog.
    // Prefill only from appointment, draft, or explicit entry defaults.
    // Reception prefs (last-used service/staff) are NOT intentional resolution.
    let serviceProvenance: BookingDecisionProvenance = "none";
    const serviceId =
      (() => {
        if (appointment?.service_id) {
          serviceProvenance = "appointment";
          return appointment.service_id;
        }
        if (
          !appointment &&
          draft?.serviceId &&
          services.some((s) => s.id === draft.serviceId)
        ) {
          serviceProvenance = "valid_draft";
          return draft.serviceId;
        }
        if (
          !appointment &&
          defaultServiceId &&
          locationServices.some((s) => s.id === defaultServiceId)
        ) {
          serviceProvenance = "entry_context";
          return defaultServiceId;
        }
        if (appointment && locationServices[0]?.id) {
          serviceProvenance = "default";
          return locationServices[0].id;
        }
        return "";
      })() ?? "";

    const selectedSvc = services.find((s) => s.id === serviceId);
    const appointmentDuration = appointment
      ? durationFromAppointmentTimes(
          appointment.start_time,
          appointment.end_time,
        )
      : null;

    const resolved = resolveBookingDuration({
      appointmentDurationMinutes: appointmentDuration,
      overrideMinutes:
        !appointment && draft?.durationIsOverride
          ? draft.durationMinutes
          : null,
      serviceDurationMinutes: selectedSvc?.duration_minutes ?? null,
    });

    const eligible = filterEligibleBookingStaff(staff, {
      serviceId,
      locationId,
    });

    const draftStaff =
      !appointment && (draft?.staffId === "" || draft?.staffId)
        ? draft.staffId
        : undefined;

    let staffProvenance: BookingDecisionProvenance = "none";
    const staffId = (() => {
      if (appointment) {
        staffProvenance = "appointment";
        return appointment.staff_id ?? "";
      }
      if (defaultStaffId === "") {
        // Explicit unassigned from calendar column — still intentional entry.
        staffProvenance = "entry_context";
        return "";
      }
      if (draftStaff !== undefined) {
        const ok =
          draftStaff === "" || eligible.some((m) => m.id === draftStaff);
        if (ok) {
          staffProvenance = "valid_draft";
          return draftStaff ?? "";
        }
        return "";
      }
      if (defaultStaffId && eligible.some((m) => m.id === defaultStaffId)) {
        staffProvenance = "entry_context";
        return defaultStaffId;
      }
      return "";
    })();

    const date = appointment
      ? slotDateInBusinessTimezone(appointment.start_time, zone)
      : draft?.date
        ? draft.date
        : initialStart
          ? slotDateInBusinessTimezone(initialStart, zone)
          : format(new Date(), "yyyy-MM-dd");

    let customerProvenance: BookingDecisionProvenance = "none";
    const customerId =
      (() => {
        if (appointment?.customer_id) {
          customerProvenance = "appointment";
          return appointment.customer_id;
        }
        if (!appointment && draft?.customerId) {
          customerProvenance = "valid_draft";
          return draft.customerId;
        }
        if (defaultCustomerId) {
          customerProvenance = "entry_context";
          return defaultCustomerId;
        }
        return "";
      })() ?? "";

    let datetimeProvenance: BookingDecisionProvenance = "none";
    if (appointment) {
      datetimeProvenance = "appointment";
    } else if (draft?.startIso) {
      datetimeProvenance = "valid_draft";
    } else if (defaultDate) {
      datetimeProvenance = "entry_context";
    }

    return {
      serviceId,
      staffId,
      customerId,
      locationId,
      date,
      slot: initialStart,
      duration: resolved.minutes,
      durationIsOverride: Boolean(
        !appointment && draft?.durationIsOverride && resolved.minutes != null,
      ),
      serviceDefaultMinutes: resolved.serviceDefaultMinutes,
      status: (appointment?.status ?? "confirmed") as AppointmentStatus,
      notes: appointment?.notes ?? (!appointment ? draft?.notes : null) ?? "",
      packageId: !appointment ? (draft?.packageId ?? "") : "",
      customerProvenance,
      serviceProvenance,
      staffProvenance,
      datetimeProvenance,
    };
  }, [
    appointment,
    services,
    locations,
    staff,
    defaultDate,
    defaultStaffId,
    defaultCustomerId,
    defaultServiceId,
    draft,
    timezone,
    prefs.locationId,
  ]);

  const [customers, setCustomers] = useState(initialCustomers);
  const [loadedPackages, setLoadedPackages] = useState<ServicePackage[]>([]);
  const packages = packagesProp ?? loadedPackages;
  const [offerType, setOfferType] = useState<BookingOfferType>(
    preferred.packageId ? "package" : "service",
  );
  const [packageId, setPackageId] = useState(preferred.packageId);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    () =>
      initialCustomers.find((c) => c.id === preferred.customerId) ?? null,
  );
  const [serviceId, setServiceId] = useState(preferred.serviceId);
  const [staffId, setStaffId] = useState(preferred.staffId);
  const [locationId, setLocationId] = useState(preferred.locationId);
  const [date, setDate] = useState(preferred.date);
  const [slot, setSlot] = useState<string | null>(preferred.slot);
  /** Explicit override only — null means use the selected service duration. */
  const [durationOverride, setDurationOverride] = useState<number | null>(
    preferred.durationIsOverride ? preferred.duration : null,
  );
  const [status, setStatus] = useState(preferred.status);
  const [notes, setNotes] = useState(preferred.notes);
  const [paymentDraft, setPaymentDraft] = useState<BookingPaymentDraft>(
    defaultBookingPaymentDraft(),
  );
  const [paymentDraftSeed, setPaymentDraftSeed] = useState("");
  const [focusDecision, setFocusDecision] = useState<BookingDecision | null>(
    null,
  );
  const [customerProvenance, setCustomerProvenance] =
    useState<BookingDecisionProvenance>(preferred.customerProvenance);
  const [serviceProvenance, setServiceProvenance] =
    useState<BookingDecisionProvenance>(preferred.serviceProvenance);
  const [staffProvenance, setStaffProvenance] =
    useState<BookingDecisionProvenance>(preferred.staffProvenance);
  const [datetimeProvenance, setDatetimeProvenance] =
    useState<BookingDecisionProvenance>(preferred.datetimeProvenance);
  const [paymentAcknowledged, setPaymentAcknowledged] = useState(false);
  const [successInfo, setSuccessInfo] = useState<BookingSuccessInfo | null>(
    null,
  );
  const [viewAppointmentPending, setViewAppointmentPending] = useState(false);
  const [viewAppointmentError, setViewAppointmentError] = useState<
    string | null
  >(null);
  /** Existing appointment management workspace expand (UI-only, session). */
  const [managementExpanded, setManagementExpanded] = useState(false);
  const paymentIdempotencyKey = useRef(
    `bs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  /**
   * After “Book another”, suppress re-showing success for the same created ID.
   * useActionState keeps state.success until the next create — without this,
   * clearing successInfo immediately re-hydrates the success screen.
   */
  const suppressedSuccessAppointmentId = useRef<string | null>(null);

  const [availability, setAvailability] =
    useState<BookingSheetAvailability | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<Awaited<
    ReturnType<typeof getBookingSheetCustomerSnapshot>
  > | null>(null);
  const [snapshotForId, setSnapshotForId] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [communicationsFocusSignal, setCommunicationsFocusSignal] =
    useState(0);

  useFormAction(
    state,
    () => {
      onSuccess({
        appointmentId:
          state.appointmentId ?? appointment?.id ?? null,
      });
      if (isEditing) onClose();
    },
    isEditing ? onClose : undefined,
  );


  // Reset every field from `preferred` whenever the sheet opens for a
  // (possibly) different appointment/default. The sheet can stay mounted
  // across opens (callers don't always remount it), so this guards against
  // stale state from the previous booking leaking into the next one.
  // Adjusted during render (React's recommended pattern for resetting state
  // from props) rather than in an effect, so it applies before paint with
  // no extra render flash.
  const openResetKey = open
    ? [
        appointment?.id ?? "new",
        defaultDate?.toISOString() ?? "",
        defaultStaffId ?? "",
        defaultCustomerId ?? "",
        defaultServiceId ?? "",
        draft?.serviceId ?? "",
        draft?.startIso ?? "",
        draft?.durationMinutes ?? "",
        draft?.customerId ?? "",
        draft?.staffId ?? "",
        draft?.locationId ?? "",
      ].join("|")
    : null;
  const [appliedResetKey, setAppliedResetKey] = useState<string | null>(null);
  if (open && openResetKey !== appliedResetKey) {
    setAppliedResetKey(openResetKey);
    setCustomers(initialCustomers);
    setSelectedCustomer(
      initialCustomers.find((c) => c.id === preferred.customerId) ?? null,
    );
    setOfferType(preferred.packageId ? "package" : "service");
    setPackageId(preferred.packageId);
    setServiceId(preferred.serviceId);
    setStaffId(preferred.staffId);
    setLocationId(preferred.locationId);
    setDate(preferred.date);
    setSlot(preferred.slot);
    setDurationOverride(
      preferred.durationIsOverride ? preferred.duration : null,
    );
    setStatus(preferred.status);
    setNotes(preferred.notes);
    setCustomerProvenance(preferred.customerProvenance);
    setServiceProvenance(preferred.serviceProvenance);
    setStaffProvenance(preferred.staffProvenance);
    setDatetimeProvenance(preferred.datetimeProvenance);
    setAvailability(null);
    setSnapshot(null);
    setSnapshotForId(null);
    setPaymentDraft(defaultBookingPaymentDraft());
    setPaymentDraftSeed("");
    setPaymentAcknowledged(false);
    setSuccessInfo(null);
    setFocusDecision(null);
    setManagementExpanded(false);
    suppressedSuccessAppointmentId.current = null;
    setViewAppointmentError(null);
    setViewAppointmentPending(false);
  }

  const eligibleStaff = useMemo(
    () =>
      filterEligibleBookingStaff(staff, {
        serviceId,
        locationId,
      }),
    [staff, locationId, serviceId],
  );

  // If a named employee is no longer eligible after service/location change,
  // reset to Unassigned — never keep a stale forced selection.
  const [staffEligibilityNote, setStaffEligibilityNote] = useState<string | null>(
    null,
  );
  const staffEligible =
    !staffId || eligibleStaff.some((m) => m.id === staffId);
  if (open && staffId && !staffEligible) {
    setStaffId("");
    setStaffProvenance("none");
    setSlot(null);
    setDatetimeProvenance("none");
    setPaymentAcknowledged(false);
    setStaffEligibilityNote(
      "The previously selected employee is not available for this service or location. Selection reset to Unassigned — assign later.",
    );
  } else if (open && staffEligible && staffId && staffEligibilityNote) {
    setStaffEligibilityNote(null);
  }

  // The user is the authority on staff assignment. Unassigned ("") is a
  // deliberate, valid choice and must never be silently overridden by
  // falling back to the first eligible employee.
  const activeStaffId = staffId;

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedPackage = packages.find((p) => p.id === packageId);
  const selectedLocation = locations.find((l) => l.id === locationId);

  const appointmentDuration = appointment
    ? durationFromAppointmentTimes(
        appointment.start_time,
        appointment.end_time,
      )
    : null;

  const resolvedDuration = resolveBookingDuration({
    appointmentDurationMinutes:
      isEditing &&
      durationOverride == null &&
      serviceId === appointment?.service_id
        ? appointmentDuration
        : null,
    overrideMinutes: durationOverride,
    serviceDurationMinutes: selectedService?.duration_minutes ?? null,
  });

  /** Authoritative duration for this booking — never a silent 30. */
  const durationMinutes = resolvedDuration.minutes;
  const excludeId = appointment?.id;
  const staffOptionKey = eligibleStaff.map((m) => m.id).join(",");

  useEffect(() => {
    if (packagesProp || !open) return;
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listPackages();
        if (!cancelled) setLoadedPackages(rows.filter((p) => p.is_active));
      } catch {
        if (!cancelled) setLoadedPackages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, packagesProp]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (!serviceId || !locationId || !date) {
          if (!cancelled) setAvailability(null);
          return;
        }
        if (!cancelled) setAvailLoading(true);
        try {
          const result = await previewBookingSheetAvailability({
            serviceId,
            staffId: activeStaffId,
            locationId,
            date,
            excludeAppointmentId: excludeId,
            staffOptions: eligibleStaff.map((m) => ({
              id: m.id,
              name: m.name,
            })),
            durationMinutes: durationMinutes ?? undefined,
          });
          // Availability is display-only. Never auto-select a slot here —
          // the user (or Summer, explicitly) chooses the time.
          if (!cancelled) setAvailability(result);
        } catch {
          if (!cancelled) {
            setAvailability({
              slots: [],
              intervalMinutes: DEFAULT_BOOKING_INTERVAL_MINUTES,
              timezone: null,
              emptyReason: "Could not load availability. Try again.",
              alternativeStaff: [],
              alternativeDays: [],
            });
          }
        } finally {
          if (!cancelled) setAvailLoading(false);
        }
      })();
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    open,
    serviceId,
    activeStaffId,
    locationId,
    date,
    excludeId,
    staffOptionKey,
    eligibleStaff,
    durationMinutes,
  ]);

  useEffect(() => {
    if (!open || !selectedCustomer?.id) return;
    const id = selectedCustomer.id;
    let cancelled = false;
    void (async () => {
      if (!cancelled) setSnapshotLoading(true);
      try {
        const row = await getBookingSheetCustomerSnapshot(id);
        if (!cancelled) {
          setSnapshot(row);
          setSnapshotForId(id);
        }
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selectedCustomer?.id]);

  const activeSnapshot =
    selectedCustomer?.id && selectedCustomer.id === snapshotForId
      ? snapshot
      : null;

  // Slot validity — the selected slot stays the source of truth in the
  // banner even when it no longer appears in the current availability
  // list; we only flag the conflict, we never drop the selection. While a
  // fetch is in flight we hold the previous validity to avoid flashing a
  // false conflict.
  const selectedSlotValid =
    !slot ||
    availLoading ||
    (availability?.slots ?? []).some((s) => slotKey(s.start) === slotKey(slot));
  const slotConflict =
    slot && !selectedSlotValid
      ? "This time conflicts with employee hours, duration, or an existing booking."
      : null;

  const needsNamedEmployee =
    !OPTIONAL_STAFF_PERSISTENCE_ENABLED &&
    isUnassignedStaffSelection(activeStaffId);

  const customerResolved = isIntentionallyResolved(
    customerProvenance,
    Boolean(selectedCustomer?.id),
  );
  const serviceResolved = isIntentionallyResolved(
    serviceProvenance,
    Boolean(serviceId),
  );
  const employeeResolved =
    OPTIONAL_STAFF_PERSISTENCE_ENABLED &&
    isUnassignedStaffSelection(activeStaffId)
      ? staffProvenance === "user_selected" ||
        staffProvenance === "entry_context" ||
        staffProvenance === "valid_draft" ||
        staffProvenance === "appointment"
      : isIntentionallyResolved(staffProvenance, Boolean(activeStaffId));
  const datetimeResolved = isIntentionallyResolved(
    datetimeProvenance,
    Boolean(slot && selectedSlotValid),
  );

  const bookingFacts = {
    customerId: selectedCustomer?.id ?? null,
    customerResolved,
    serviceId,
    serviceResolved,
    needsNamedEmployee,
    employeeResolved,
    date,
    slot,
    slotValid: Boolean(slot && selectedSlotValid),
    datetimeResolved,
    paymentAcknowledged,
    success: Boolean(successInfo),
  };

  const computedDecision = firstMissingDecision(bookingFacts);
  const focusIsValid =
    focusDecision != null &&
    focusDecision !== "success" &&
    bookingDecisionAccess(focusDecision, bookingFacts).accessible;
  const activeDecision: BookingDecision = successInfo
    ? "success"
    : focusIsValid && focusDecision
      ? focusDecision
      : computedDecision;

  function navigateToDecision(decision: Exclude<BookingDecision, "success">) {
    const access = bookingDecisionAccess(decision, bookingFacts);
    if (!access.accessible) return;
    setFocusDecision(decision);
  }

  /** Brief beat so selected state is visible before the next decision appears. */
  function advanceAfterSelection() {
    window.setTimeout(() => setFocusDecision(null), 120);
  }

  const canSubmit =
    !!selectedCustomer?.id &&
    !!serviceId &&
    !!locationId &&
    !!slot &&
    durationMinutes != null &&
    durationMinutes > 0 &&
    selectedSlotValid &&
    !needsNamedEmployee;

  const validationMessage = useMemo(() => {
    if (needsNamedEmployee && slot && selectedCustomer?.id && serviceId) {
      return RECEPTION_EMPLOYEE_REQUIRED_MESSAGE;
    }
    if (canSubmit) {
      return isEditing
        ? "Ready to save your changes."
        : "Ready to confirm this appointment.";
    }
    const missing: string[] = [];
    if (!selectedCustomer?.id) missing.push("a client");
    if (!serviceId) missing.push("a service");
    if (!locationId) missing.push("a location");
    if (!slot) missing.push("a time");
    if (needsNamedEmployee) missing.push("an employee");
    if (durationMinutes == null || durationMinutes <= 0) {
      missing.push("a valid duration");
    }
    if (slot && !selectedSlotValid && durationMinutes != null && durationMinutes > 0) {
      return "Choose another time to continue.";
    }
    if (missing.length === 0) return "Check the highlighted fields above.";
    return `Still need ${missing.join(", ")}.`;
  }, [
    canSubmit,
    isEditing,
    selectedCustomer?.id,
    serviceId,
    locationId,
    slot,
    durationMinutes,
    selectedSlotValid,
    needsNamedEmployee,
  ]);

  const footerStatus = isEditing
    ? canSubmit
      ? "Ready to save"
      : validationMessage || "Complete required fields"
    : bookingFooterStatus(activeDecision);

  const bookingSourceLabel =
    channel === "reception"
      ? "Reception"
      : channel === "summer"
        ? "Summer"
        : channel === "mobile"
          ? "Mobile"
          : "Calendar";

  function handleServiceChange(id: string) {
    setServiceId(id);
    setServiceProvenance("user_selected");
    setDurationOverride(null);
    setSlot(null);
    setDatetimeProvenance("none");
    setPaymentAcknowledged(false);
    if (!isEditing) advanceAfterSelection();
    else setFocusDecision(null);
  }

  function handleOfferTypeChange(type: BookingOfferType) {
    setOfferType(type);
    setPaymentAcknowledged(false);
    if (type === "service") {
      setPackageId("");
      return;
    }
    const active = packages.filter((p) => p.is_active);
    const pkg = active.find((p) => p.id === packageId) ?? active[0] ?? null;
    if (pkg) {
      handlePackageChange(pkg.id);
    }
  }

  function handlePackageChange(id: string) {
    setPackageId(id);
    setPaymentAcknowledged(false);
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    const firstServiceId =
      pkg.service_ids.find((sid) =>
        services.some((s) => s.id === sid && s.is_active),
      ) ?? "";
    if (firstServiceId) {
      setServiceId(firstServiceId);
      setServiceProvenance("user_selected");
      setDurationOverride(null);
      setSlot(null);
      setDatetimeProvenance("none");
    }
    if (!isEditing) advanceAfterSelection();
    else setFocusDecision(null);
  }

  function handleDurationOverride(minutes: number | null) {
    setDurationOverride(minutes);
    setSlot(null);
    setDatetimeProvenance("none");
    setPaymentAcknowledged(false);
  }

  function handleStaffChange(id: string) {
    setStaffId(id);
    setStaffProvenance("user_selected");
    setStaffEligibilityNote(null);
    setSlot(null);
    setDatetimeProvenance("none");
    setPaymentAcknowledged(false);
    if (!isEditing) advanceAfterSelection();
    else setFocusDecision(null);
  }

  function handleLocationChange(id: string) {
    setLocationId(id);
    setSlot(null);
    setDatetimeProvenance("none");
    setPaymentAcknowledged(false);
  }

  function handleDateChange(next: string) {
    setDate(next);
    setSlot(null);
    setDatetimeProvenance("none");
    setPaymentAcknowledged(false);
  }

  const availabilityRef = useRef<AvailabilitySectionHandle>(null);

  const subtotalCentsForSubmit =
    offerType === "package" && selectedPackage
      ? selectedPackage.price_cents
      : selectedService
        ? Math.round(Number(selectedService.price) * 100)
        : 0;

  const financialsForSubmit = resolveBookingFinancials({
    catalogPriceCents: subtotalCentsForSubmit,
    serviceTaxRateBps: selectedService?.tax_rate_bps ?? 0,
    taxRates,
    depositRequiredCents: selectedService?.deposit_cents,
    depositRequired: selectedService?.deposit_required,
    currency,
  });
  const depositCentsForSubmit = financialsForSubmit.depositRequiredCents;

  const paymentDraftKey = `${serviceId}|${packageId}|${depositCentsForSubmit}|${isEditing ? "edit" : "create"}`;
  if (!isEditing && paymentDraftSeed !== paymentDraftKey) {
    setPaymentDraftSeed(paymentDraftKey);
    setPaymentDraft(defaultBookingPaymentDraft(depositCentsForSubmit));
  }

  function scrollToAvailability() {
    document
      .getElementById("bs-avail-heading")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToPayment() {
    window.setTimeout(() => {
      document
        .getElementById("bs-payment")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }

  function handleSlotSelect(next: string) {
    setSlot(next);
    setDatetimeProvenance("user_selected");
    setPaymentAcknowledged(false);
    if (!isEditing) {
      advanceAfterSelection();
      return;
    }
    scrollToPayment();
  }

  if (
    !isEditing &&
    state.success &&
    state.appointmentId &&
    !successInfo &&
    suppressedSuccessAppointmentId.current !== state.appointmentId
  ) {
    setSuccessInfo({
      appointmentId: state.appointmentId,
      serviceName:
        offerType === "package"
          ? (packages.find((p) => p.id === packageId)?.name ?? null)
          : (services.find((s) => s.id === serviceId)?.name ?? null),
      customerName: selectedCustomer?.name ?? null,
      startIso: slot ?? new Date().toISOString(),
      durationMinutes,
      paymentAmountCents:
        paymentDraft.mode === "none" ? 0 : paymentDraft.amountCents,
      paymentStatus: state.payment?.status,
      receiptStatus: state.payment?.receiptStatus ?? null,
      notifications: state.notifications,
      currency,
    });
    setFocusDecision("success");
  }

  function summerAfternoon() {
    const afternoon = (availability?.slots ?? []).find((s) => {
      const h = parseISO(s.start).getHours();
      return h >= 12 && h < 18;
    });
    if (afternoon) {
      setSlot(afternoon.start);
      toast("Summer picked an afternoon opening.", "success");
      return;
    }
    toast("No afternoon openings for this employee today.", "error");
    scrollToAvailability();
  }

  function summerOtherEmployee() {
    const alt = availability?.alternativeStaff[0];
    if (!alt) {
      toast("No alternate employees with openings today.", "error");
      return;
    }
    setStaffId(alt.staffId);
    toast(`Summer suggests ${alt.name}.`, "success");
  }

  function summerTomorrowMorning() {
    const tomorrow = format(addDays(new Date(`${date}T12:00:00`), 1), "yyyy-MM-dd");
    setDate(tomorrow);
    setSlot(null);
    toast("Moved to tomorrow — pick a morning slot when openings load.", "success");
  }

  async function runStatus(next: AppointmentStatus) {
    if (!appointment) return;
    startBusy(async () => {
      const result = await setAppointmentStatus(appointment.id, next);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Status updated.", "success");
        onSuccess({ appointmentId: appointment.id });
        onClose();
      }
    });
  }

  const [collectOpen, setCollectOpen] = useState(false);

  function collectPaymentNavigate() {
    setCollectOpen(true);
  }

  return (
    <>
    <Sheet
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? (selectedCustomer?.name ?? "Appointment")
          : "New appointment"
      }
      description={
        isEditing
          ? [
              offerType === "package" && selectedPackage
                ? selectedPackage.name
                : selectedService?.name,
              slot
                ? `${format(parseISO(slot), "MMM d")} · ${formatTime(parseISO(slot))}`
                : null,
              APPOINTMENT_STATUS_LABELS[status] ?? status,
            ]
              .filter(Boolean)
              .join(" · ")
          : "Ask only what’s missing — then confirm"
      }
      resizable={!isEditing || !managementExpanded}
      showWidthControls={false}
      defaultWidthPx={
        isEditing ? 640 : Math.min(700, BOOKING_SHEET_WIDE_PX)
      }
      widthStorageKey={
        isEditing
          ? "chasum.appointmentManagementWidthPx"
          : "chasum.bookingSheetWidthPx"
      }
      widthMode={
        isEditing && managementExpanded ? "management" : "default"
      }
      headerActions={
        <>
          {isEditing ? (
            <AppointmentExpandToggle
              expanded={managementExpanded}
              onToggle={() => setManagementExpanded((v) => !v)}
            />
          ) : null}
          <QuickActionsMenu
            isEditing={isEditing}
            customerId={selectedCustomer?.id}
            disabled={pending || busy}
            onCheckIn={() => void runStatus("arrived")}
            onComplete={() => void runStatus("completed")}
            onCancel={() => {
              if (!appointment) return;
              startBusy(async () => {
                if (onCancelAppointment) {
                  await onCancelAppointment();
                  onClose();
                  return;
                }
                const result = await cancelAppointment(appointment.id);
                if (result.error) toast(result.error, "error");
                else {
                  toast(result.success ?? "Appointment cancelled.", "success");
                  onSuccess({ appointmentId: appointment.id });
                  onClose();
                }
              });
            }}
            onReschedule={scrollToAvailability}
            onDuplicate={() => {
              if (!appointment) return;
              startBusy(async () => {
                const result = await duplicateAppointment(appointment.id);
                if (result.error) toast(result.error, "error");
                else {
                  toast(result.success ?? "Appointment duplicated.", "success");
                  onSuccess();
                }
              });
            }}
            onCollectPayment={collectPaymentNavigate}
            onPrint={() => window.print()}
            onMessage={() =>
              toast("Compose from the customer profile in CRM.", "info")
            }
            onCommunications={() =>
              setCommunicationsFocusSignal((n) => n + 1)
            }
          />
        </>
      }
      footer={
        <form
          action={(fd) => {
            if (!isEditing) {
              writeBookingPreferences({
                serviceId,
                staffId: activeStaffId,
                locationId,
              });
            }
            formAction(fd);
          }}
          className="flex flex-col gap-2"
        >
          {isEditing ? (
            <input type="hidden" name="id" value={appointment!.id} />
          ) : null}
          <input
            type="hidden"
            name="customer_id"
            value={selectedCustomer?.id ?? ""}
          />
          <input type="hidden" name="service_id" value={serviceId} />
          <input type="hidden" name="staff_id" value={activeStaffId} />
          <input type="hidden" name="location_id" value={locationId} />
          <input type="hidden" name="start_time" value={slot ?? ""} />
          <input
            type="hidden"
            name="duration_minutes"
            value={durationMinutes != null ? String(durationMinutes) : ""}
          />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="notes" value={notes} />
          <input
            type="hidden"
            name="package_id"
            value={offerType === "package" ? packageId : ""}
          />
          <input
            type="hidden"
            name="package_name"
            value={
              offerType === "package" && selectedPackage
                ? selectedPackage.name
                : ""
            }
          />
          <input
            type="hidden"
            name="price_cents"
            value={String(financialsForSubmit.subtotalCents || "")}
          />
          <input
            type="hidden"
            name="tax_cents"
            value={String(financialsForSubmit.taxCents || "")}
          />
          <input
            type="hidden"
            name="deposit_cents"
            value={String(financialsForSubmit.depositRequiredCents || "")}
          />
          {!isEditing ? (
            <>
              <input
                type="hidden"
                name="payment_mode"
                value={paymentDraft.mode}
              />
              <input
                type="hidden"
                name="payment_amount_cents"
                value={
                  paymentDraft.mode === "none"
                    ? "0"
                    : String(paymentDraft.amountCents)
                }
              />
              <input
                type="hidden"
                name="payment_method"
                value={paymentDraft.method}
              />
              <input
                type="hidden"
                name="payment_note"
                value={paymentDraft.note}
              />
              <input
                type="hidden"
                name="payment_send_receipt"
                value={paymentDraft.sendReceipt ? "1" : "0"}
              />
            </>
          ) : null}
          {!isEditing ? (
            <input
              type="hidden"
              name="payment_idempotency_key"
              value={paymentIdempotencyKey.current}
            />
          ) : null}

          {slot &&
          selectedCustomer &&
          durationMinutes != null &&
          (activeDecision === "payment" ||
            activeDecision === "review" ||
            isEditing) ? (
            <p className="text-[11px] leading-snug text-muted-foreground">
              {(offerType === "package" && selectedPackage
                ? selectedPackage.name
                : selectedService?.name) ?? "Service"}
              {" · "}
              {format(parseISO(slot), "EEE, MMM d")} ·{" "}
              {formatTime(parseISO(slot))}
              {activeStaffId
                ? ` · ${
                    eligibleStaff.find((m) => m.id === activeStaffId)?.name ??
                    staff.find((m) => m.id === activeStaffId)?.name ??
                    ""
                  }`
                : ""}
              {" · Total "}
              {financialsForSubmit.formatted.appointmentTotal}
              {paymentDraft.mode !== "none" && paymentDraft.amountCents > 0
                ? ` · Due today ${formatMoneyCents(paymentDraft.amountCents, currency)} · After payment ${formatMoneyCents(
                    Math.max(
                      0,
                      financialsForSubmit.appointmentTotalCents -
                        paymentDraft.amountCents,
                    ),
                    currency,
                  )}`
                : ""}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="flex-1 text-xs text-muted-foreground">{footerStatus}</p>
            <div className="flex gap-2">
              {!isEditing && activeDecision === "success" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={onClose}
                  disabled={pending}
                >
                  Close
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={onClose}
                  disabled={pending}
                >
                  Cancel
                </Button>
              )}
              {!isEditing &&
              activeDecision !== "success" &&
              activeDecision !== "review" &&
              previousDecision(activeDecision, bookingFacts) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11"
                  disabled={pending}
                  onClick={() => {
                    const prev = previousDecision(activeDecision, bookingFacts);
                    if (prev) setFocusDecision(prev);
                  }}
                >
                  Back
                </Button>
              ) : null}
              {!isEditing && activeDecision === "payment" ? (
                <Button
                  type="button"
                  size="sm"
                  className="min-h-11"
                  disabled={!slot || pending}
                  onClick={() => {
                    setPaymentAcknowledged(true);
                    setFocusDecision(null);
                  }}
                >
                  Continue
                </Button>
              ) : !isEditing && activeDecision === "success" ? null : !isEditing &&
                activeDecision !== "review" ? null : (
                <Button
                  type="submit"
                  size="sm"
                  className="min-h-11"
                  disabled={!canSubmit || pending}
                >
                  {pending
                    ? "Confirming…"
                    : isEditing
                      ? "Save changes"
                      : confirmButtonLabel(
                          paymentDraft.mode,
                          paymentDraft.mode === "none"
                            ? 0
                            : paymentDraft.amountCents,
                          currency,
                        )}
                </Button>
              )}
            </div>
          </div>
        </form>
      }
    >
      <div className="space-y-3">
        {!isEditing ? (
          successInfo ? (
            <BookingSuccessState
              info={successInfo}
              viewPending={viewAppointmentPending}
              viewError={viewAppointmentError}
              onViewAppointment={async (id) => {
                setViewAppointmentError(null);
                setViewAppointmentPending(true);
                try {
                  if (onViewCreatedAppointment) {
                    await onViewCreatedAppointment(id);
                    return;
                  }
                  // Fallback: deep-link with date so calendar range can include it.
                  const d = slot
                    ? format(parseISO(slot), "yyyy-MM-dd")
                    : format(new Date(), "yyyy-MM-dd");
                  window.location.assign(
                    `/dashboard/calendar?view=day&date=${encodeURIComponent(d)}&appointment=${encodeURIComponent(id)}`,
                  );
                } catch {
                  setViewAppointmentError(
                    "Could not open this appointment. Try again.",
                  );
                } finally {
                  setViewAppointmentPending(false);
                }
              }}
              onBookAnother={() => {
                const createdId =
                  successInfo?.appointmentId ?? state.appointmentId ?? null;
                if (createdId) {
                  suppressedSuccessAppointmentId.current = createdId;
                }
                setSuccessInfo(null);
                setViewAppointmentError(null);
                setViewAppointmentPending(false);
                setSelectedCustomer(null);
                setServiceId("");
                setPackageId("");
                setOfferType("service");
                setStaffId("");
                setSlot(null);
                setDate(calendarDateInTimezone(new Date(), timezone));
                setDurationOverride(null);
                setNotes("");
                setCustomerProvenance("none");
                setServiceProvenance("none");
                setStaffProvenance("none");
                setDatetimeProvenance("none");
                setAvailability(null);
                setSnapshot(null);
                setSnapshotForId(null);
                setPaymentAcknowledged(false);
                setPaymentDraft(defaultBookingPaymentDraft());
                setPaymentDraftSeed("");
                setFocusDecision(null);
                paymentIdempotencyKey.current = `bs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              }}
              onDone={onClose}
            />
          ) : (
            <>
              <BookingProgressIndicator
                active={activeDecision}
                facts={bookingFacts}
                onNavigate={navigateToDecision}
                known={{
                  customer: customerResolved,
                  service: serviceResolved,
                  employee: employeeResolved,
                  datetime: datetimeResolved,
                  payment: paymentAcknowledged,
                  review: paymentAcknowledged && canSubmit,
                }}
              />

              <BookingSummaryStrip
                chips={[
                  customerResolved && selectedCustomer
                    ? {
                        id: "customer",
                        label: "Customer",
                        value: selectedCustomer.name,
                        onChange: () => setFocusDecision("customer"),
                      }
                    : null,
                  serviceResolved && serviceId
                    ? {
                        id: "service",
                        label: "Service",
                        value:
                          offerType === "package" && selectedPackage
                            ? selectedPackage.name
                            : (selectedService?.name ?? "Service"),
                        onChange: () => {
                          setPaymentAcknowledged(false);
                          setFocusDecision("service");
                        },
                      }
                    : null,
                  employeeResolved && activeStaffId
                    ? {
                        id: "employee",
                        label: "Employee",
                        value:
                          eligibleStaff.find((m) => m.id === activeStaffId)
                            ?.name ??
                          staff.find((m) => m.id === activeStaffId)?.name ??
                          "Employee",
                        onChange: () => {
                          setSlot(null);
                          setDatetimeProvenance("none");
                          setPaymentAcknowledged(false);
                          setFocusDecision("employee");
                        },
                      }
                    : null,
                  datetimeResolved && slot
                    ? {
                        id: "when",
                        label: "When",
                        value: `${format(parseISO(slot), "MMM d")} · ${formatTime(parseISO(slot))}`,
                        onChange: () => {
                          setPaymentAcknowledged(false);
                          setFocusDecision("datetime");
                        },
                      }
                    : null,
                ].filter(Boolean) as {
                  id: string;
                  label: string;
                  value: string;
                  onChange?: () => void;
                }[]}
              />

              <BookingSilentHints
                upcomingCount={activeSnapshot?.upcomingCount}
                outstandingBalanceCount={
                  activeSnapshot?.outstandingBalanceCount
                }
                emptyReason={
                  activeDecision === "datetime"
                    ? availability?.emptyReason
                    : null
                }
              />

              {staffEligibilityNote ? (
                <p
                  role="status"
                  className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100"
                >
                  {staffEligibilityNote}
                </p>
              ) : null}

              {activeDecision === "customer" ? (
                <BookingDecisionFrame
                  title="Who is this for?"
                  hint="Search an existing customer or add a new one."
                >
                  <CustomerSection
                    customers={customers}
                    selected={selectedCustomer}
                    compact
                    onSelect={(c) => {
                      setSelectedCustomer(c);
                      setCustomerProvenance(
                        c ? "user_selected" : "none",
                      );
                      advanceAfterSelection();
                    }}
                    onCustomersChange={setCustomers}
                    snapshot={activeSnapshot}
                    snapshotLoading={snapshotLoading}
                    initialShowQuickAdd={forceQuickAddCustomer}
                  />
                </BookingDecisionFrame>
              ) : null}

              {activeDecision === "service" ? (
                <BookingDecisionFrame
                  title="What are you booking?"
                  hint="Choose a service or package."
                >
                  <BookingServiceDecision
                    services={services}
                    packages={packages}
                    locationId={locationId}
                    serviceId={serviceId}
                    packageId={packageId}
                    offerType={offerType}
                    currency={currency}
                    onOfferTypeChange={handleOfferTypeChange}
                    onPackageChange={(id) => {
                      handlePackageChange(id);
                    }}
                    onServiceChange={(id) => {
                      handleServiceChange(id);
                    }}
                  />
                </BookingDecisionFrame>
              ) : null}

              {activeDecision === "employee" ? (
                <BookingDecisionFrame
                  title="Who will deliver this?"
                  hint="Select an eligible employee."
                >
                  <BookingEmployeeDecision
                    staff={eligibleStaff}
                    staffId={activeStaffId}
                    onStaffChange={handleStaffChange}
                  />
                </BookingDecisionFrame>
              ) : null}

              {activeDecision === "datetime" ? (
                <BookingDecisionFrame
                  title="When?"
                  hint="Pick a date and an available time together."
                >
                  <BookingDatetimePanel
                    ref={availabilityRef}
                    date={date}
                    minDate={format(new Date(), "yyyy-MM-dd")}
                    onDateChange={handleDateChange}
                    loading={availLoading}
                    availability={availability}
                    selectedSlot={slot}
                    selectedSlotValid={selectedSlotValid}
                    unassigned={!activeStaffId}
                    onSelectSlot={handleSlotSelect}
                    onPickStaff={(id) => handleStaffChange(id)}
                    onPickDay={(next) => {
                      setDate(next);
                      setSlot(null);
                      setPaymentAcknowledged(false);
                    }}
                  />
                </BookingDecisionFrame>
              ) : null}

              {activeDecision === "payment" ? (
                <BookingDecisionFrame
                  title="Payment"
                  hint="Checkout for this appointment — projected until you confirm."
                >
                  {slot && financialsForSubmit.appointmentTotalCents > 0 ? (
                    <BookingPaymentSection
                      catalogPriceCents={subtotalCentsForSubmit}
                      serviceTaxRateBps={selectedService?.tax_rate_bps}
                      depositCents={selectedService?.deposit_cents}
                      depositRequired={selectedService?.deposit_required}
                      taxRates={taxRates}
                      currency={currency}
                      value={paymentDraft}
                      onChange={setPaymentDraft}
                      variant="decision"
                      includePricingFields={false}
                      includeFormFields={false}
                      className="border-0 p-0 shadow-none"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Choose a time before payment.
                    </p>
                  )}
                </BookingDecisionFrame>
              ) : null}

              {activeDecision === "review" &&
              slot &&
              durationMinutes != null ? (
                <BookingDecisionFrame title="Review & confirm">
                  <BookingConfirmStep
                    serviceName={
                      offerType === "package" && selectedPackage
                        ? selectedPackage.name
                        : (selectedService?.name ?? null)
                    }
                    customerName={selectedCustomer?.name ?? null}
                    employeeName={
                      activeStaffId
                        ? (eligibleStaff.find((m) => m.id === activeStaffId)
                            ?.name ??
                          staff.find((m) => m.id === activeStaffId)?.name ??
                          null)
                        : null
                    }
                    locationName={selectedLocation?.name ?? null}
                    startIso={slot}
                    durationMinutes={durationMinutes}
                    financials={financialsForSubmit}
                    payment={paymentDraft}
                    currency={currency}
                  />
                </BookingDecisionFrame>
              ) : null}

              <BookingMoreOptions
                notes={notes}
                onNotesChange={setNotes}
                durationMinutes={durationMinutes ?? 0}
                durationUnresolved={durationMinutes == null}
                durationIsOverride={resolvedDuration.source === "override"}
                onDurationChange={handleDurationOverride}
                locations={locations}
                locationId={locationId}
                onLocationChange={handleLocationChange}
                bookingSource={bookingSourceLabel}
              />
            </>
          )
        ) : (
          <>
            <AppointmentManagementActions
              className="sticky top-0 z-10 -mx-1 border-b border-border/60 bg-card/95 px-1 py-2 backdrop-blur-sm"
              disabled={pending || busy}
              onEditFocus={() => {
                document
                  .getElementById("bs-appt-heading")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              onReschedule={scrollToAvailability}
              onCollectPayment={collectPaymentNavigate}
              onMessage={() =>
                toast("Compose from the customer profile in CRM.", "info")
              }
            />

            <div
              className={
                managementExpanded
                  ? "grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.9fr)] lg:items-start"
                  : "space-y-4"
              }
            >
              <div className="space-y-4 min-w-0">
                {managementExpanded ? (
                  <AppointmentCustomerContext
                    customer={selectedCustomer}
                    snapshot={activeSnapshot}
                    loading={snapshotLoading}
                  />
                ) : (
                  <CustomerSection
                    customers={customers}
                    selected={selectedCustomer}
                    onSelect={setSelectedCustomer}
                    onCustomersChange={setCustomers}
                    snapshot={activeSnapshot}
                    snapshotLoading={snapshotLoading}
                    initialShowQuickAdd={forceQuickAddCustomer}
                  />
                )}

                {staffEligibilityNote ? (
                  <p
                    role="status"
                    className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100"
                  >
                    {staffEligibilityNote}
                  </p>
                ) : null}

                <AppointmentSection
                  services={services}
                  packages={packages}
                  staff={staff}
                  locations={locations}
                  offerType={offerType}
                  packageId={packageId}
                  serviceId={serviceId}
                  staffId={activeStaffId}
                  locationId={locationId}
                  date={date}
                  durationMinutes={durationMinutes ?? 0}
                  serviceDefaultMinutes={
                    resolvedDuration.serviceDefaultMinutes ?? null
                  }
                  durationIsOverride={resolvedDuration.source === "override"}
                  durationUnresolved={durationMinutes == null}
                  status={status}
                  notes={notes}
                  bookingSource={bookingSourceLabel}
                  currency={currency}
                  taxRates={taxRates}
                  onOfferTypeChange={handleOfferTypeChange}
                  onPackageChange={handlePackageChange}
                  onServiceChange={handleServiceChange}
                  onStaffChange={handleStaffChange}
                  onLocationChange={handleLocationChange}
                  onDateChange={handleDateChange}
                  onDateSelected={() => {
                    window.setTimeout(
                      () => availabilityRef.current?.focusTimes(),
                      50,
                    );
                  }}
                  onDurationChange={handleDurationOverride}
                  onStatusChange={setStatus}
                  onNotesChange={setNotes}
                  minDate={format(new Date(), "yyyy-MM-dd")}
                />

                <AvailabilitySection
                  ref={availabilityRef}
                  loading={availLoading}
                  availability={availability}
                  selectedSlot={slot}
                  selectedSlotValid={selectedSlotValid}
                  unassigned={!activeStaffId}
                  onSelectSlot={handleSlotSelect}
                  onPickStaff={(id) => handleStaffChange(id)}
                  onPickDay={(next) => {
                    setDate(next);
                    setSlot(null);
                    window.setTimeout(
                      () => availabilityRef.current?.focusTimes(),
                      50,
                    );
                  }}
                />

                {appointment &&
                slot &&
                slotKey(slot) !== slotKey(appointment.start_time) ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-md)] border border-border/70 bg-muted/15 px-3 py-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Current appointment
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {format(
                          parseISO(appointment.start_time),
                          "EEEE, MMMM d, yyyy",
                        )}
                      </p>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        {formatTime(parseISO(appointment.start_time))}–
                        {formatTime(parseISO(appointment.end_time))}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 px-2 text-xs"
                        onClick={() => {
                          setSlot(appointment.start_time);
                          setDate(
                            slotDateInBusinessTimezone(
                              appointment.start_time,
                              timezone ?? selectedLocation?.timezone ?? null,
                            ),
                          );
                          setDurationOverride(null);
                        }}
                      >
                        Keep original time
                      </Button>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-primary/25 bg-primary/[0.04] px-3 py-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Proposed change
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {format(parseISO(slot), "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-sm tabular-nums">
                        {formatTime(parseISO(slot))}
                        {durationMinutes != null
                          ? `–${formatTime(
                              new Date(
                                parseISO(slot).getTime() +
                                  durationMinutes * 60_000,
                              ),
                            )}`
                          : null}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Save changes to apply this time.
                      </p>
                    </div>
                  </div>
                ) : null}

                {slot ? (
                  <SelectedAppointmentBanner
                    startIso={slot}
                    durationMinutes={durationMinutes ?? 0}
                    locationName={selectedLocation?.name ?? null}
                    employeeName={
                      activeStaffId
                        ? (eligibleStaff.find((m) => m.id === activeStaffId)
                            ?.name ??
                          staff.find((m) => m.id === activeStaffId)?.name ??
                          null)
                        : null
                    }
                    timezone={timezone ?? selectedLocation?.timezone ?? null}
                    slotConflict={
                      durationMinutes == null
                        ? "Duration is still loading for this service."
                        : slotConflict
                          ? "Needs update"
                          : null
                    }
                    serviceName={
                      offerType === "package" && selectedPackage
                        ? selectedPackage.name
                        : (selectedService?.name ?? null)
                    }
                    customerName={selectedCustomer?.name ?? null}
                  />
                ) : null}

                {managementExpanded && appointment?.id ? (
                  <BookingCommunicationsSection
                    appointmentId={appointment.id}
                    focusSignal={communicationsFocusSignal}
                  />
                ) : null}

                {managementExpanded ? (
                  <TimelineSection
                    appointment={appointment}
                    snapshot={activeSnapshot}
                    loading={snapshotLoading}
                    onLoadHistory={() => {
                      if (!selectedCustomer?.id) return;
                      const id = selectedCustomer.id;
                      startBusy(async () => {
                        setSnapshotLoading(true);
                        const row = await getBookingSheetCustomerSnapshot(id);
                        setSnapshot(row);
                        setSnapshotForId(id);
                        setSnapshotLoading(false);
                      });
                    }}
                  />
                ) : null}
              </div>

              <aside
                className={
                  managementExpanded
                    ? "space-y-4 lg:sticky lg:top-14"
                    : "space-y-4"
                }
              >
                {!managementExpanded ? (
                  <PaymentsSection
                    service={selectedService}
                    appointment={appointment}
                    currency={currency}
                    taxRates={taxRates}
                  />
                ) : (
                  <>
                    <PaymentsSection
                      service={selectedService}
                      appointment={appointment}
                      currency={currency}
                      taxRates={taxRates}
                    />
                    <SummerAssistant
                      disabled={availLoading || pending}
                      onSuggestAfternoon={summerAfternoon}
                      onSuggestOtherEmployee={summerOtherEmployee}
                      onMoveTomorrowMorning={summerTomorrowMorning}
                    />
                  </>
                )}

                {!managementExpanded && appointment?.id ? (
                  <BookingCommunicationsSection
                    appointmentId={appointment.id}
                    focusSignal={communicationsFocusSignal}
                  />
                ) : null}

                {!managementExpanded ? (
                  <>
                    <SummerAssistant
                      disabled={availLoading || pending}
                      onSuggestAfternoon={summerAfternoon}
                      onSuggestOtherEmployee={summerOtherEmployee}
                      onMoveTomorrowMorning={summerTomorrowMorning}
                    />
                    <TimelineSection
                      appointment={appointment}
                      snapshot={activeSnapshot}
                      loading={snapshotLoading}
                      onLoadHistory={() => {
                        if (!selectedCustomer?.id) return;
                        const id = selectedCustomer.id;
                        startBusy(async () => {
                          setSnapshotLoading(true);
                          const row = await getBookingSheetCustomerSnapshot(id);
                          setSnapshot(row);
                          setSnapshotForId(id);
                          setSnapshotLoading(false);
                        });
                      }}
                    />
                  </>
                ) : null}
              </aside>
            </div>
          </>
        )}
      </div>
    </Sheet>
    {collectOpen ? (
      <CollectPaymentWorkspace
        key={`bs-collect-${appointment?.id ?? "new"}-${collectOpen}`}
        open={collectOpen}
        onClose={() => setCollectOpen(false)}
        initialCustomerId={selectedCustomer?.id ?? appointment?.customer_id ?? ""}
        initialCustomerName={selectedCustomer?.name ?? ""}
        initialAppointmentId={appointment?.id ?? ""}
        seedCustomers={customers}
        currency={currency}
      />
    ) : null}
    </>
  );
}
