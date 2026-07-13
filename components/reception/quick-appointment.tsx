"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AlertMessage } from "@/components/ui/form-feedback";
import { SlotPicker } from "@/components/scheduling/slot-picker";
import { createAppointment } from "@/lib/actions/appointments";
import { quickCreateCustomer } from "@/lib/actions/customers";
import { getDashboardAvailableSlots } from "@/lib/actions/scheduling";
import { pushRecentCustomer } from "@/lib/reception/recent-customers";
import {
  useBookingPreferences,
  writeBookingPreferences,
} from "@/lib/reception/use-booking-preferences";
import type {
  ActionState,
  Customer,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import { format, parseISO } from "date-fns";
import { UserRound } from "lucide-react";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type QuickAppointmentProps = {
  customers: Customer[];
  services: Service[];
  staff: StaffWithServices[];
  locations: Location[];
  preselectedCustomerId?: string | null;
  defaultSlotIso?: string | null;
  defaultServiceId?: string | null;
  defaultStaffId?: string | null;
  walkInMode?: boolean;
  focusSignal?: number;
  onSuccess: () => void;
  onCustomerCreated?: (customer: Customer) => void;
  onClearCustomer?: () => void;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function QuickAppointmentForm({
  customers: initialCustomers,
  services,
  staff,
  locations,
  preselectedCustomerId,
  defaultSlotIso,
  defaultServiceId,
  defaultStaffId,
  walkInMode = false,
  focusSignal = 0,
  onSuccess,
  onCustomerCreated,
  onClearCustomer,
}: QuickAppointmentProps) {
  const { toast } = useToast();
  const customerRef = useRef<HTMLSelectElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const prefs = useBookingPreferences();
  const [extraCustomers, setExtraCustomers] = useState<Customer[]>([]);
  const customers = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const c of initialCustomers) map.set(c.id, c);
    for (const c of extraCustomers) map.set(c.id, c);
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [initialCustomers, extraCustomers]);

  const activeServices = services.filter((s) => s.is_active);

  const preferredService =
    defaultServiceId ??
    (prefs.serviceId &&
    activeServices.some((s) => s.id === prefs.serviceId)
      ? prefs.serviceId
      : null) ??
    activeServices[0]?.id ??
    "";

  const preferredLocation =
    (prefs.locationId &&
    locations.some((l) => l.id === prefs.locationId)
      ? prefs.locationId
      : null) ??
    locations.find((l) => l.is_default)?.id ??
    locations[0]?.id ??
    "";

  const preferredStaff = defaultStaffId ?? prefs.staffId ?? "";

  const [customerId, setCustomerId] = useState(
    preselectedCustomerId ?? "",
  );
  const [serviceOverride, setServiceOverride] = useState<string | null>(null);
  const [staffOverride, setStaffOverride] = useState<string | null>(null);
  const [locationOverride, setLocationOverride] = useState<string | null>(
    null,
  );
  const serviceId = serviceOverride ?? preferredService;
  const staffId = staffOverride ?? preferredStaff;
  const locationId = locationOverride ?? preferredLocation;
  const [date, setDate] = useState(
    walkInMode || !defaultSlotIso
      ? format(new Date(), "yyyy-MM-dd")
      : format(new Date(defaultSlotIso), "yyyy-MM-dd"),
  );
  const [slot, setSlot] = useState<string | null>(
    walkInMode ? null : (defaultSlotIso ?? null),
  );
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [creating, setCreating] = useState(false);

  const [state, formAction, pending] = useActionState(
    createAppointment,
    {} as ActionState,
  );

  const resolvedCustomerId = preselectedCustomerId || customerId;
  const selectedCustomer = customers.find((c) => c.id === resolvedCustomerId);

  const eligibleStaff = !serviceId
    ? staff.filter((m) => m.is_active)
    : staff.filter(
        (m) =>
          m.is_active &&
          m.staff_services.some((ss) => ss.service_id === serviceId),
      );

  const activeStaffId = eligibleStaff.some((m) => m.id === staffId)
    ? staffId
    : (eligibleStaff[0]?.id ?? "");

  useEffect(() => {
    if (state.error) toast(state.error, "error");
    if (state.success) {
      writeBookingPreferences({
        serviceId,
        staffId: activeStaffId,
        locationId,
      });
      const when = slot
        ? format(parseISO(slot), "MMM d · h:mm a")
        : "appointment";
      toast(
        selectedCustomer
          ? `Booked ${selectedCustomer.name} · ${when}`
          : `Appointment saved · ${when}`,
        "success",
      );
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast on action result only
  }, [state.error, state.success]);

  useEffect(() => {
    if (focusSignal <= 0 && !walkInMode) return;
    const t = window.setTimeout(() => {
      if (showCreate) nameRef.current?.focus();
      else if (!resolvedCustomerId) customerRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [focusSignal, walkInMode, showCreate, resolvedCustomerId]);

  const loadSlots = useCallback(
    (svcId: string, stfId: string, day: string) =>
      getDashboardAvailableSlots(
        svcId,
        stfId,
        day,
        undefined,
        locationId || undefined,
      ),
    [locationId],
  );

  const emailError =
    emailTouched && newEmail.trim() && !isValidEmail(newEmail)
      ? "Enter a valid email."
      : null;

  const missingHints = [
    !resolvedCustomerId ? "customer" : null,
    !serviceId ? "service" : null,
    !activeStaffId ? "staff" : null,
    !slot ? "time slot" : null,
  ].filter(Boolean) as string[];

  async function handleQuickCreate() {
    setEmailTouched(true);
    if (!newName.trim()) {
      toast("Name is required.", "error");
      nameRef.current?.focus();
      return;
    }
    if (!isValidEmail(newEmail)) {
      toast("Enter a valid email.", "error");
      emailRef.current?.focus();
      return;
    }
    setCreating(true);
    const result = await quickCreateCustomer({
      name: newName,
      email: newEmail,
      phone: newPhone || undefined,
    });
    setCreating(false);
    if (result.error || !result.customerId) {
      toast(result.error ?? "Could not create customer.", "error");
      return;
    }
    const created: Customer = {
      id: result.customerId,
      business_id: "",
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || null,
      notes: null,
      tags: [],
      referral_source: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setExtraCustomers((prev) => [...prev, created]);
    setCustomerId(result.customerId);
    setShowCreate(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setEmailTouched(false);
    pushRecentCustomer(created);
    onCustomerCreated?.(created);
    toast(`${created.name} added — pick a time to book.`, "success");
  }

  return (
    <section className="space-y-3">
      <h3 className="ds-section-title text-sm">
        {walkInMode ? "Walk-in" : "Book"}
      </h3>

      {!showCreate ? (
        <div className="space-y-2">
          {selectedCustomer ? (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {selectedCustomer.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {selectedCustomer.phone
                    ? `${selectedCustomer.phone} · `
                    : ""}
                  {selectedCustomer.email}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2 text-xs"
                onClick={() => {
                  setCustomerId("");
                  onClearCustomer?.();
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <>
              <Label htmlFor="qa_customer">Customer</Label>
              <Select
                ref={customerRef}
                id="qa_customer"
                value={resolvedCustomerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select or search above…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowCreate(true)}
          >
            <UserRound className="h-3.5 w-3.5" />
            New customer
          </Button>
        </div>
      ) : (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-dashed border-primary/30 bg-accent/20 p-3">
          <p className="text-xs font-medium text-foreground">New customer</p>
          <Label htmlFor="qa_new_name">Name</Label>
          <Input
            ref={nameRef}
            id="qa_new_name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            placeholder="Full name"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setShowCreate(false);
              }
              if (e.key === "Enter") {
                e.preventDefault();
                emailRef.current?.focus();
              }
            }}
          />
          <Label htmlFor="qa_new_email">Email</Label>
          <Input
            ref={emailRef}
            id="qa_new_email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="name@email.com"
            aria-invalid={!!emailError}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleQuickCreate();
              }
            }}
          />
          {emailError ? (
            <p className="text-xs text-destructive" role="alert">
              {emailError}
            </p>
          ) : null}
          <Label htmlFor="qa_new_phone">Phone (optional)</Label>
          <Input
            id="qa_new_phone"
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Phone"
          />
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={creating || !newName.trim() || !newEmail.trim()}
              onClick={() => void handleQuickCreate()}
            >
              {creating ? "Saving…" : "Save & continue"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="customer_id" value={resolvedCustomerId} />
        <input type="hidden" name="service_id" value={serviceId} />
        <input type="hidden" name="staff_id" value={activeStaffId} />
        <input type="hidden" name="location_id" value={locationId} />
        <input type="hidden" name="start_time" value={slot ?? ""} />
        <input type="hidden" name="status" value="confirmed" />

        <div className="grid gap-3 sm:grid-cols-1">
          <div className="space-y-1.5">
            <Label htmlFor="qa_service">Service</Label>
            <Select
              id="qa_service"
              value={serviceId}
              onChange={(e) => {
                setServiceOverride(e.target.value);
                setStaffOverride("");
                setSlot(null);
                writeBookingPreferences({ serviceId: e.target.value });
              }}
            >
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          {locations.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="qa_location">Location</Label>
              <Select
                id="qa_location"
                value={locationId}
                onChange={(e) => {
                  setLocationOverride(e.target.value);
                  setSlot(null);
                  writeBookingPreferences({ locationId: e.target.value });
                }}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="qa_staff">Staff</Label>
            <Select
              id="qa_staff"
              value={activeStaffId}
              onChange={(e) => {
                setStaffOverride(e.target.value);
                setSlot(null);
                writeBookingPreferences({ staffId: e.target.value });
              }}
            >
              <option value="">Select staff…</option>
              {eligibleStaff.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {serviceId && activeStaffId ? (
          <SlotPicker
            serviceId={serviceId}
            staffId={activeStaffId}
            date={date}
            selectedSlot={slot}
            onDateChange={(d) => {
              setDate(d);
              setSlot(null);
            }}
            onSelectSlot={setSlot}
            loadSlots={loadSlots}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Choose service and staff to load open times.
          </p>
        )}

        <AlertMessage error={state.error} />

        {missingHints.length > 0 && !pending ? (
          <p className="text-[11px] text-muted-foreground">
            Still need: {missingHints.join(", ")}.
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={
            pending ||
            !resolvedCustomerId ||
            !serviceId ||
            !activeStaffId ||
            !slot
          }
        >
          {pending
            ? "Booking…"
            : walkInMode
              ? "Book walk-in"
              : "Book appointment"}
        </Button>
      </form>
    </section>
  );
}
