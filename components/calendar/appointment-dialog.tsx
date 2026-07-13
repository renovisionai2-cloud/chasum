"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SlotPicker } from "@/components/scheduling/slot-picker";
import {
  cancelAppointment,
  createAppointment,
  updateAppointment,
} from "@/lib/actions/appointments";
import { quickCreateCustomer } from "@/lib/actions/customers";
import { getDashboardAvailableSlots } from "@/lib/actions/scheduling";
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
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { useFormAction } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import {
  useBookingPreferences,
  writeBookingPreferences,
} from "@/lib/reception/use-booking-preferences";
import { format } from "date-fns";
import { parseISO } from "@/lib/calendar/utils";
import { Plus } from "lucide-react";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AppointmentDialogProps = {
  open: boolean;
  onClose: () => void;
  appointment?: AppointmentWithRelations | null;
  services: Service[];
  staff: StaffWithServices[];
  customers: Customer[];
  locations: Location[];
  defaultDate?: Date;
  onSuccess: () => void;
};

function slotDateInLocalTimezone(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd");
}

function getInitialState(
  appointment: AppointmentWithRelations | null | undefined,
  services: Service[],
  locations: Location[],
  defaultDate?: Date,
) {
  const initialStart = appointment
    ? appointment.start_time
    : defaultDate?.toISOString() ?? null;

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
    : service?.duration_minutes ?? 30;

  return {
    serviceId: service?.id ?? "",
    staffId: appointment?.staff_id ?? "",
    customerId: appointment?.customer_id ?? "",
    locationId:
      appointment?.location_id ??
      locations.find((l) => l.is_default)?.id ??
      locations[0]?.id ??
      "",
    date: initialStart
      ? slotDateInLocalTimezone(initialStart)
      : format(new Date(), "yyyy-MM-dd"),
    slot: initialStart,
    duration,
    status: (appointment?.status ?? "pending") as AppointmentStatus,
  };
}

export function AppointmentDialog({
  open,
  onClose,
  appointment,
  services,
  staff,
  customers: initialCustomers,
  locations,
  defaultDate,
  onSuccess,
}: AppointmentDialogProps) {
  const isEditing = !!appointment;
  const action = isEditing ? updateAppointment : createAppointment;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const { toast } = useToast();
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const prefs = useBookingPreferences();

  const preferred = useMemo(() => {
    const base = getInitialState(appointment, services, locations, defaultDate);
    if (isEditing) return base;
    const locationId =
      (prefs.locationId &&
        locations.some((l) => l.id === prefs.locationId) &&
        prefs.locationId) ||
      base.locationId;
    const locationServices = services.filter(
      (s) =>
        s.is_active && (!locationId || s.location_id === locationId),
    );
    const serviceId =
      (prefs.serviceId &&
        locationServices.some((s) => s.id === prefs.serviceId) &&
        prefs.serviceId) ||
      base.serviceId;
    const eligible = staff.filter(
      (m) =>
        m.is_active &&
        (!locationId || m.location_id === locationId) &&
        m.staff_services.some((ss) => ss.service_id === serviceId),
    );
    const staffId =
      (prefs.staffId &&
        eligible.some((m) => m.id === prefs.staffId) &&
        prefs.staffId) ||
      base.staffId;
    const svc = services.find((s) => s.id === serviceId);
    return {
      ...base,
      locationId,
      serviceId,
      staffId,
      duration: svc?.duration_minutes ?? base.duration,
    };
  }, [
    appointment,
    services,
    locations,
    defaultDate,
    isEditing,
    prefs.locationId,
    prefs.serviceId,
    prefs.staffId,
    staff,
  ]);

  const [customers, setCustomers] = useState(initialCustomers);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerHighlight, setCustomerHighlight] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    preferred.customerId,
  );
  const [serviceOverride, setServiceOverride] = useState<string | null>(null);
  const [staffOverride, setStaffOverride] = useState<string | null>(null);
  const [locationOverride, setLocationOverride] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(preferred.date);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(preferred.slot);
  const [durationOverride, setDurationOverride] = useState<number | null>(null);
  const selectedService = serviceOverride ?? preferred.serviceId;
  const selectedStaff = staffOverride ?? preferred.staffId;
  const selectedLocation = locationOverride ?? preferred.locationId;
  const durationMinutes = durationOverride ?? preferred.duration;
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const loadSlots = useCallback(
    (
      serviceId: string,
      staffId: string,
      date: string,
      excludeAppointmentId?: string,
    ) =>
      getDashboardAvailableSlots(
        serviceId,
        staffId,
        date,
        excludeAppointmentId,
        selectedLocation || undefined,
      ),
    [selectedLocation],
  );

  useFormAction(state, onSuccess, onClose);

  useEffect(() => {
    if (!open || isEditing || showNewCustomer) return;
    const t = window.setTimeout(() => customerSearchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, isEditing, showNewCustomer]);

  const selectedServiceRow = services.find((s) => s.id === selectedService);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [customers, customerSearch]);

  const filteredStaff = useMemo(
    () =>
      staff.filter(
        (member) =>
          member.is_active &&
          (!selectedLocation || member.location_id === selectedLocation) &&
          member.staff_services.some((ss) => ss.service_id === selectedService),
      ),
    [staff, selectedService, selectedLocation],
  );

  const locationServices = useMemo(
    () =>
      services.filter(
        (s) =>
          s.is_active &&
          (!selectedLocation || s.location_id === selectedLocation),
      ),
    [services, selectedLocation],
  );

  const activeStaffId = useMemo(() => {
    if (filteredStaff.some((member) => member.id === selectedStaff)) {
      return selectedStaff;
    }
    return filteredStaff[0]?.id ?? "";
  }, [filteredStaff, selectedStaff]);

  const canSubmit =
    !!selectedCustomerId &&
    !!selectedService &&
    !!activeStaffId &&
    !!selectedSlot &&
    !!selectedLocation &&
    durationMinutes > 0;

  async function handleQuickCreateCustomer() {
    setCreatingCustomer(true);
    const result = await quickCreateCustomer(newCustomer);
    setCreatingCustomer(false);
    if (result.error || !result.customerId) {
      toast(result.error ?? "Could not create customer.", "error");
      return;
    }
    const created: Customer = {
      id: result.customerId,
      business_id: "",
      name: newCustomer.name.trim(),
      email: newCustomer.email.trim(),
      phone: newCustomer.phone.trim() || null,
      notes: null,
      tags: [],
      referral_source: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedCustomerId(result.customerId);
    setShowNewCustomer(false);
    setCustomerSearch(created.name);
    toast(result.success ?? "Customer added.", "success");
  }

  async function handleCancel() {
    if (!appointment) return;
    if (!confirm("Cancel this appointment?")) return;
    const result = await cancelAppointment(appointment.id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Appointment cancelled.", "success");
      onSuccess();
      onClose();
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit appointment" : "New appointment"}
      description={
        isEditing
          ? "Update details or pick a new available time from the scheduling engine."
          : "Search or create a client, then choose service, staff, location, and a real open slot."
      }
    >
      <form action={formAction} className="space-y-4">
        {isEditing && <input type="hidden" name="id" value={appointment.id} />}
        <input type="hidden" name="customer_id" value={selectedCustomerId} />
        <input type="hidden" name="start_time" value={selectedSlot ?? ""} />
        <input type="hidden" name="location_id" value={selectedLocation} />
        <input type="hidden" name="duration_minutes" value={durationMinutes} />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="customer_search">Customer</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setShowNewCustomer((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" />
              {showNewCustomer ? "Cancel" : "New client"}
            </Button>
          </div>
          {showNewCustomer ? (
            <div className="space-y-2 rounded-[var(--radius-md)] border border-border bg-muted/20 p-3">
              <Input
                placeholder="Full name"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer((c) => ({ ...c, name: e.target.value }))
                }
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer((c) => ({ ...c, email: e.target.value }))
                }
                required
              />
              <Input
                placeholder="Phone (optional)"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer((c) => ({ ...c, phone: e.target.value }))
                }
              />
              <Button
                type="button"
                size="sm"
                disabled={creatingCustomer}
                onClick={handleQuickCreateCustomer}
              >
                {creatingCustomer ? "Saving…" : "Save client"}
              </Button>
            </div>
          ) : (
            <>
              <Input
                ref={customerSearchRef}
                id="customer_search"
                placeholder="Search by name, email, or phone…"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setCustomerHighlight(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    if (customerSearch) setCustomerSearch("");
                    else onClose();
                    return;
                  }
                  if (filteredCustomers.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCustomerHighlight((i) =>
                      Math.min(i + 1, filteredCustomers.length - 1),
                    );
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCustomerHighlight((i) => Math.max(i - 1, 0));
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const pick =
                      filteredCustomers[customerHighlight] ??
                      filteredCustomers[0];
                    if (pick) {
                      setSelectedCustomerId(pick.id);
                      setCustomerSearch(pick.name);
                    }
                  }
                }}
                aria-autocomplete="list"
              />
              <Select
                aria-label="Select customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">Select customer</option>
                {filteredCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </Select>
            </>
          )}
        </div>

        {locations.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="location_id_select">Location</Label>
            <Select
              id="location_id_select"
              value={selectedLocation}
              onChange={(e) => {
                setLocationOverride(e.target.value);
                setServiceOverride("");
                setStaffOverride("");
                setSelectedSlot(null);
                if (!isEditing) {
                  writeBookingPreferences({ locationId: e.target.value });
                }
              }}
              required
            >
              {locations
                .filter((l) => l.is_active)
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.is_default ? " (default)" : ""}
                  </option>
                ))}
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="service_id">Service</Label>
          <Select
            id="service_id"
            name="service_id"
            value={selectedService}
            onChange={(e) => {
              const next = e.target.value;
              setServiceOverride(next);
              setStaffOverride("");
              setSelectedSlot(null);
              const svc = services.find((s) => s.id === next);
              if (svc) setDurationOverride(svc.duration_minutes);
              if (!isEditing) writeBookingPreferences({ serviceId: next });
            }}
            required
          >
            <option value="">Select service</option>
            {locationServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.duration_minutes} min)
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="staff_id">Staff</Label>
            <Select
              id="staff_id"
              name="staff_id"
              value={activeStaffId}
              onChange={(e) => {
                setStaffOverride(e.target.value);
                setSelectedSlot(null);
                if (!isEditing) {
                  writeBookingPreferences({ staffId: e.target.value });
                }
              }}
              required
            >
              <option value="">Select staff</option>
              {filteredStaff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_minutes_input">Duration (minutes)</Label>
            <Input
              id="duration_minutes_input"
              type="number"
              min={5}
              step={5}
              value={durationMinutes}
              onChange={(e) =>
                setDurationOverride(Number(e.target.value) || 0)
              }
            />
            {selectedServiceRow && (
              <p className="text-xs text-muted-foreground">
                Service default {selectedServiceRow.duration_minutes} min · buffers{" "}
                {selectedServiceRow.buffer_before_minutes}/
                {selectedServiceRow.buffer_after_minutes} min
              </p>
            )}
          </div>
        </div>

        {selectedService && activeStaffId ? (
          <SlotPicker
            serviceId={selectedService}
            staffId={activeStaffId}
            date={selectedDate}
            selectedSlot={selectedSlot}
            onDateChange={(value) => {
              setSelectedDate(value);
              setSelectedSlot(null);
            }}
            onSelectSlot={setSelectedSlot}
            loadSlots={loadSlots}
            excludeAppointmentId={appointment?.id}
          />
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={preferred.status}
          >
            {(Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {APPOINTMENT_STATUS_LABELS[status]}
                </option>
              ),
            )}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={appointment?.notes ?? ""}
            placeholder="Optional notes..."
          />
        </div>

        <AlertMessage error={state.error} />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
          {isEditing && appointment.status !== "cancelled" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="text-destructive hover:text-destructive"
            >
              Cancel appointment
            </Button>
          )}
          <FormFooter
            onCancel={onClose}
            pending={pending}
            submitLabel={isEditing ? "Save changes" : "Create"}
            submitDisabled={!canSubmit}
          />
        </div>
      </form>
    </Dialog>
  );
}
