"use client";

import { AppointmentSection, type BookingOfferType } from "@/components/booking-sheet/appointment-section";
import { AvailabilitySection } from "@/components/booking-sheet/availability-section";
import { CustomerSection } from "@/components/booking-sheet/customer-section";
import { PaymentsSection } from "@/components/booking-sheet/payments-section";
import { QuickActionsMenu } from "@/components/booking-sheet/quick-actions-menu";
import { SummerAssistant } from "@/components/booking-sheet/summer-assistant";
import { TimelineSection } from "@/components/booking-sheet/timeline-section";
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
import type { ServicePackage } from "@/lib/business/types";
import { parseISO } from "@/lib/calendar/utils";
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
  channel?: BookingSheetChannel;
  onSuccess: () => void;
};

function slotDateInLocalTimezone(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd");
}

/**
 * Unified Booking Sheet — the only staff/reception booking workspace.
 * Calendar, Reception, Summer suggestions, and mobile all open this surface.
 * Mutations go through Booking Engine actions. Summer never invents slots.
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
  channel = "staff",
  onSuccess,
}: BookingSheetProps) {
  const isEditing = !!appointment;
  const action = isEditing ? updateAppointment : createAppointment;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const { toast } = useToast();
  const prefs = useBookingPreferences();
  const [busy, startBusy] = useTransition();

  const preferred = useMemo(() => {
    const initialStart = appointment
      ? appointment.start_time
      : (defaultDate?.toISOString() ?? null);
    const service =
      services.find((s) => s.id === appointment?.service_id) ??
      services.find((s) => s.is_active);
    const duration = appointment
      ? Math.max(
          5,
          Math.round(
            (parseISO(appointment.end_time).getTime() -
              parseISO(appointment.start_time).getTime()) /
              60_000,
          ),
        )
      : (service?.duration_minutes ?? 30);

    const locationId =
      appointment?.location_id ??
      (prefs.locationId && locations.some((l) => l.id === prefs.locationId)
        ? prefs.locationId
        : null) ??
      locations.find((l) => l.is_default)?.id ??
      locations[0]?.id ??
      "";

    const locationServices = services.filter(
      (s) => s.is_active && (!locationId || s.location_id === locationId),
    );
    const serviceId =
      appointment?.service_id ??
      (prefs.serviceId &&
      locationServices.some((s) => s.id === prefs.serviceId)
        ? prefs.serviceId
        : null) ??
      locationServices[0]?.id ??
      service?.id ??
      "";

    const eligible = staff.filter(
      (m) =>
        m.is_active &&
        (!locationId || m.location_id === locationId) &&
        m.staff_services.some((ss) => ss.service_id === serviceId),
    );
    const staffId =
      appointment?.staff_id ??
      (defaultStaffId && eligible.some((m) => m.id === defaultStaffId)
        ? defaultStaffId
        : null) ??
      (prefs.staffId && eligible.some((m) => m.id === prefs.staffId)
        ? prefs.staffId
        : null) ??
      eligible[0]?.id ??
      "";

    return {
      serviceId,
      staffId,
      customerId: appointment?.customer_id ?? defaultCustomerId ?? "",
      locationId,
      date: initialStart
        ? slotDateInLocalTimezone(initialStart)
        : format(new Date(), "yyyy-MM-dd"),
      slot: initialStart,
      duration,
      status: (appointment?.status ?? "confirmed") as AppointmentStatus,
      notes: appointment?.notes ?? "",
    };
  }, [
    appointment,
    services,
    locations,
    staff,
    defaultDate,
    defaultStaffId,
    defaultCustomerId,
    prefs.locationId,
    prefs.serviceId,
    prefs.staffId,
  ]);

  const [customers, setCustomers] = useState(initialCustomers);
  const [loadedPackages, setLoadedPackages] = useState<ServicePackage[]>([]);
  const packages = packagesProp ?? loadedPackages;
  const [offerType, setOfferType] = useState<BookingOfferType>("service");
  const [packageId, setPackageId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    () =>
      initialCustomers.find((c) => c.id === preferred.customerId) ?? null,
  );
  const [serviceId, setServiceId] = useState(preferred.serviceId);
  const [staffId, setStaffId] = useState(preferred.staffId);
  const [locationId, setLocationId] = useState(preferred.locationId);
  const [date, setDate] = useState(preferred.date);
  const [slot, setSlot] = useState<string | null>(preferred.slot);
  const [durationMinutes, setDurationMinutes] = useState(preferred.duration);
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

  const eligibleStaff = useMemo(
    () =>
      staff.filter(
        (m) =>
          m.is_active &&
          (!locationId || m.location_id === locationId) &&
          m.staff_services.some((ss) => ss.service_id === serviceId),
      ),
    [staff, locationId, serviceId],
  );

  const activeStaffId = eligibleStaff.some((m) => m.id === staffId)
    ? staffId
    : (eligibleStaff[0]?.id ?? "");

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedPackage = packages.find((p) => p.id === packageId);
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
        if (!serviceId || !activeStaffId || !locationId || !date) {
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
          });
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

  const canSubmit =
    !!selectedCustomer?.id &&
    !!serviceId &&
    !!activeStaffId &&
    !!slot &&
    !!locationId &&
    durationMinutes > 0;

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
    const svc = services.find((s) => s.id === id);
    if (svc) setDurationMinutes(svc.duration_minutes);
    setSlot(null);
  }

  function handleOfferTypeChange(type: BookingOfferType) {
    setOfferType(type);
    setSlot(null);
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
      const svc = services.find((s) => s.id === firstServiceId);
      if (svc) setDurationMinutes(svc.duration_minutes);
    }
    setSlot(null);
  }

  function handleStaffChange(id: string) {
    setStaffId(id);
    setSlot(null);
  }

  function handleLocationChange(id: string) {
    setLocationId(id);
    setSlot(null);
  }

  function handleDateChange(next: string) {
    setDate(next);
    setSlot(null);
  }

  const priceCentsForSubmit =
    offerType === "package" && selectedPackage
      ? selectedPackage.price_cents
      : selectedService
        ? Math.round(Number(selectedService.price) * 100)
        : 0;

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
    setSlot(null);
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
      description={`${bookingSourceLabel} · calm workspace, not a form pile`}
      headerActions={
        <QuickActionsMenu
          isEditing={isEditing}
          customerId={selectedCustomer?.id}
          disabled={pending || busy}
          onCheckIn={() => void runStatus("confirmed")}
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
            value={String(durationMinutes)}
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
            value={String(priceCentsForSubmit || "")}
          />

          <p className="flex-1 text-xs text-muted-foreground">
            {canSubmit
              ? isEditing
                ? "Ready to save your changes."
                : "Ready to book — saves as confirmed unless you change status."
              : "Still need a client, service, employee, and a valid time."}
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
              {pending ? "Saving…" : isEditing ? "Save changes" : "Book"}
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
        />

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
          durationMinutes={durationMinutes}
          status={status}
          notes={notes}
          bookingSource={bookingSourceLabel}
          onOfferTypeChange={handleOfferTypeChange}
          onPackageChange={handlePackageChange}
          onServiceChange={handleServiceChange}
          onStaffChange={handleStaffChange}
          onLocationChange={handleLocationChange}
          onDateChange={handleDateChange}
          onDurationChange={setDurationMinutes}
          onStatusChange={setStatus}
          onNotesChange={setNotes}
          minDate={format(new Date(), "yyyy-MM-dd")}
        />

        <AvailabilitySection
          loading={availLoading}
          availability={availability}
          selectedSlot={slot}
          onSelectSlot={setSlot}
          onPickStaff={(id) => {
            setStaffId(id);
            setSlot(null);
          }}
          onPickDay={(next) => {
            setDate(next);
            setSlot(null);
          }}
        />

        <SummerAssistant
          disabled={availLoading || pending}
          onSuggestAfternoon={summerAfternoon}
          onSuggestOtherEmployee={summerOtherEmployee}
          onMoveTomorrowMorning={summerTomorrowMorning}
        />

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
