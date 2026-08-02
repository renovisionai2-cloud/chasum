"use client";

import { AppointmentSection, type BookingOfferType } from "@/components/booking-sheet/appointment-section";
import { AvailabilitySection } from "@/components/booking-sheet/availability-section";
import { CustomerSection } from "@/components/booking-sheet/customer-section";
import { PaymentsSection } from "@/components/booking-sheet/payments-section";
import { QuickActionsMenu } from "@/components/booking-sheet/quick-actions-menu";
import { SelectedAppointmentBanner } from "@/components/booking-sheet/selected-appointment-banner";
import { SummerAssistant } from "@/components/booking-sheet/summer-assistant";
import { TimelineSection } from "@/components/booking-sheet/timeline-section";
import { BookingReviewCard } from "@/components/booking/booking-review-card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
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
import {
  OPTIONAL_STAFF_PERSISTENCE_ENABLED,
  RECEPTION_EMPLOYEE_REQUIRED_MESSAGE,
  isUnassignedStaffSelection,
} from "@/lib/booking/optional-staff";
import {
  durationFromAppointmentTimes,
  resolveBookingDuration,
} from "@/lib/booking/resolved-duration";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { computeBookingPricing } from "@/lib/commerce/booking-pricing";
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
import { useFormAction } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { addDays, format } from "date-fns";
import {
  useActionState,
  useEffect,
  useMemo,
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
  onSuccess: () => void;
  /** Business currency for money formatting. */
  currency?: string | null;
  /** Active tax catalog for pricing. */
  taxRates?: TaxRate[];
  /** Location/business timezone for the Selected Appointment banner. */
  timezone?: string | null;
  /** Open straight into the quick-add customer form (e.g. from Summer / Reception). */
  forceQuickAddCustomer?: boolean;
};

function slotDateInLocalTimezone(iso: string): string {
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
    const initialStart = appointment
      ? appointment.start_time
      : (draftStart ?? defaultDate?.toISOString() ?? null);

    const locationId =
      appointment?.location_id ??
      draft?.locationId ??
      (prefs.locationId && locations.some((l) => l.id === prefs.locationId)
        ? prefs.locationId
        : null) ??
      locations.find((l) => l.is_default)?.id ??
      locations[0]?.id ??
      "";

    const locationServices = services.filter(
      (s) => s.is_active && (!locationId || s.location_id === locationId),
    );

    // Resolve serviceId FIRST — duration must follow this service, never the
    // first catalog row or a silent 30-minute fallback.
    const serviceId =
      appointment?.service_id ??
      (draft?.serviceId &&
      services.some((s) => s.id === draft.serviceId)
        ? draft.serviceId
        : null) ??
      (defaultServiceId &&
      locationServices.some((s) => s.id === defaultServiceId)
        ? defaultServiceId
        : null) ??
      (prefs.serviceId &&
      locationServices.some((s) => s.id === prefs.serviceId)
        ? prefs.serviceId
        : null) ??
      locationServices[0]?.id ??
      "";

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
      draft?.staffId === "" || draft?.staffId
        ? draft.staffId
        : undefined;

    const staffId = appointment
      ? (appointment.staff_id ?? "")
      : defaultStaffId === ""
        ? ""
        : draftStaff !== undefined
          ? draftStaff === "" ||
            eligible.some((m) => m.id === draftStaff)
            ? (draftStaff ?? "")
            : ""
          : ((defaultStaffId && eligible.some((m) => m.id === defaultStaffId)
              ? defaultStaffId
              : null) ??
            (prefs.staffId && eligible.some((m) => m.id === prefs.staffId)
              ? prefs.staffId
              : null) ??
            "");

    return {
      serviceId,
      staffId,
      customerId:
        appointment?.customer_id ??
        draft?.customerId ??
        defaultCustomerId ??
        "",
      locationId,
      date: draft?.date
        ? draft.date
        : initialStart
          ? slotDateInLocalTimezone(initialStart)
          : format(new Date(), "yyyy-MM-dd"),
      slot: initialStart,
      duration: resolved.minutes,
      durationIsOverride: Boolean(
        !appointment && draft?.durationIsOverride && resolved.minutes != null,
      ),
      serviceDefaultMinutes: resolved.serviceDefaultMinutes,
      status: (appointment?.status ?? "confirmed") as AppointmentStatus,
      notes: appointment?.notes ?? draft?.notes ?? "",
      packageId: draft?.packageId ?? "",
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
    prefs.locationId,
    prefs.serviceId,
    prefs.staffId,
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

  const [availability, setAvailability] =
    useState<BookingSheetAvailability | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<Awaited<
    ReturnType<typeof getBookingSheetCustomerSnapshot>
  > | null>(null);
  const [snapshotForId, setSnapshotForId] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  useFormAction(state, onSuccess, onClose);

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
    setAvailability(null);
    setSnapshot(null);
    setSnapshotForId(null);
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
  useEffect(() => {
    if (!open) return;
    if (!staffId) {
      setStaffEligibilityNote(null);
      return;
    }
    if (eligibleStaff.some((m) => m.id === staffId)) {
      setStaffEligibilityNote(null);
      return;
    }
    setStaffId("");
    setStaffEligibilityNote(
      "The previously selected employee is not available for this service or location. Selection reset to Unassigned — assign later.",
    );
  }, [open, eligibleStaff, staffId]);

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
      return "Selected time is no longer valid — pick another opening below.";
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
    setDurationOverride(null);
    // Changing service length can invalidate the selected time range.
  }

  function handleOfferTypeChange(type: BookingOfferType) {
    setOfferType(type);
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
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    const firstServiceId =
      pkg.service_ids.find((sid) =>
        services.some((s) => s.id === sid && s.is_active),
      ) ?? "";
    if (firstServiceId) {
      setServiceId(firstServiceId);
      setDurationOverride(null);
    }
  }

  function handleDurationOverride(minutes: number | null) {
    setDurationOverride(minutes);
  }

function handleStaffChange(id: string) {
    setStaffId(id);
    setStaffEligibilityNote(null);
  }

  function handleLocationChange(id: string) {
    setLocationId(id);
  }

  function handleDateChange(next: string) {
    setDate(next);
    setSlot(null);
  }

  const subtotalCentsForSubmit =
    offerType === "package" && selectedPackage
      ? selectedPackage.price_cents
      : selectedService
        ? Math.round(Number(selectedService.price) * 100)
        : 0;

  const pricingForSubmit = computeBookingPricing({
    subtotalCents: subtotalCentsForSubmit,
    serviceTaxRateBps: selectedService?.tax_rate_bps ?? 0,
    taxRates,
    currency,
  });

  function scrollToAvailability() {
    document
      .getElementById("bs-avail-heading")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        onSuccess();
        onClose();
      }
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit booking" : "New booking"}
      description={
        isEditing
          ? `${bookingSourceLabel} · update details and save`
          : "Customer · Appointment · Time · Review"
      }
      headerActions={
        <QuickActionsMenu
          isEditing={isEditing}
          customerId={selectedCustomer?.id}
          disabled={pending || busy}
          onCheckIn={() => void runStatus("arrived")}
          onComplete={() => void runStatus("completed")}
          onCancel={() => {
            if (!appointment) return;
            startBusy(async () => {
              const result = await cancelAppointment(appointment.id);
              if (result.error) toast(result.error, "error");
              else {
                toast(result.success ?? "Appointment cancelled.", "success");
                onSuccess();
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
          onCollectPayment={() => {
            const params = new URLSearchParams();
            if (selectedCustomer?.id) {
              params.set("customer", selectedCustomer.id);
            }
            if (appointment?.id) {
              params.set("appointment", appointment.id);
            }
            const qs = params.toString();
            window.location.href = qs
              ? `/dashboard/payments?${qs}`
              : "/dashboard/payments";
          }}
          onPrint={() => window.print()}
          onMessage={() =>
            toast("Compose from the customer profile in CRM.", "info")
          }
        />
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
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
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
            value={String(pricingForSubmit.subtotalCents || "")}
          />
          <input
            type="hidden"
            name="tax_cents"
            value={String(pricingForSubmit.taxCents || "")}
          />

          <p className="flex-1 text-xs text-muted-foreground">
            {validationMessage}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={pending}
            >
              Close
            </Button>
            <Button type="submit" size="sm" disabled={!canSubmit || pending}>
              {pending
                ? "Confirming…"
                : isEditing
                  ? "Save changes"
                  : "Confirm appointment"}
            </Button>
          </div>
        </form>
      }
    >
      <div className="space-y-8">
        <CustomerSection
          customers={customers}
          selected={selectedCustomer}
          onSelect={setSelectedCustomer}
          onCustomersChange={setCustomers}
          snapshot={activeSnapshot}
          snapshotLoading={snapshotLoading}
          initialShowQuickAdd={forceQuickAddCustomer}
        />

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
          onDurationChange={handleDurationOverride}
          onStatusChange={setStatus}
          onNotesChange={setNotes}
          minDate={format(new Date(), "yyyy-MM-dd")}
        />

        <AvailabilitySection
          loading={availLoading}
          availability={availability}
          selectedSlot={slot}
          selectedSlotValid={selectedSlotValid}
          unassigned={!activeStaffId}
          onSelectSlot={setSlot}
          onPickStaff={(id) => handleStaffChange(id)}
          onPickDay={(next) => setDate(next)}
        />

        <SelectedAppointmentBanner
          startIso={slot}
          durationMinutes={durationMinutes ?? 0}
          locationName={selectedLocation?.name ?? null}
          employeeName={
            activeStaffId
              ? (eligibleStaff.find((m) => m.id === activeStaffId)?.name ??
                staff.find((m) => m.id === activeStaffId)?.name ??
                null)
              : null
          }
          timezone={timezone ?? selectedLocation?.timezone ?? null}
          slotConflict={
            slotConflict ??
            (durationMinutes == null
              ? "Duration is still loading for this service."
              : null)
          }
          serviceName={
            offerType === "package" && selectedPackage
              ? selectedPackage.name
              : (selectedService?.name ?? null)
          }
          customerName={selectedCustomer?.name ?? null}
        />

        <SummerAssistant
          disabled={availLoading || pending}
          onSuggestAfternoon={summerAfternoon}
          onSuggestOtherEmployee={summerOtherEmployee}
          onMoveTomorrowMorning={summerTomorrowMorning}
        />

        {canSubmit && slot && selectedCustomer && durationMinutes != null ? (
          <BookingReviewCard
            customerName={selectedCustomer.name}
            serviceName={
              offerType === "package" && selectedPackage
                ? selectedPackage.name
                : (selectedService?.name ?? "Appointment")
            }
            dateLabel={format(parseISO(slot), "EEEE, MMMM d, yyyy")}
            timeLabel={`${formatTime(parseISO(slot))}–${formatTime(
              new Date(
                parseISO(slot).getTime() + durationMinutes * 60_000,
              ),
            )}`}
            locationName={selectedLocation?.name ?? null}
            employeeName={
              activeStaffId
                ? (eligibleStaff.find((m) => m.id === activeStaffId)?.name ??
                  null)
                : null
            }
            subtotalCents={pricingForSubmit.subtotalCents}
            taxCents={pricingForSubmit.taxCents}
            totalCents={pricingForSubmit.totalCents}
            currency={currency}
          />
        ) : null}

        <PaymentsSection service={selectedService} appointment={appointment} />

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
      </div>
    </Sheet>
  );
}
