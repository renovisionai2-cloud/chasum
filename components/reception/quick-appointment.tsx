"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertMessage } from "@/components/ui/form-feedback";
import { SlotPicker } from "@/components/scheduling/slot-picker";
import { createAppointment } from "@/lib/actions/appointments";
import { quickCreateCustomer } from "@/lib/actions/customers";
import { getDashboardAvailableSlots } from "@/lib/actions/scheduling";
import { formatPhoneInput } from "@/lib/reception/phone-format";
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
import { CheckCircle2, UserRound } from "lucide-react";
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
  openCreateSignal?: number;
  onSuccess: () => void;
  onCustomerCreated?: (customer: Customer) => void;
  onClearCustomer?: () => void;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function focusNext(
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  next: HTMLElement | null,
  onLast?: () => void,
) {
  if (e.key !== "Enter") return;
  if (e.currentTarget instanceof HTMLTextAreaElement && !e.metaKey && !e.ctrlKey) {
    return;
  }
  e.preventDefault();
  if (next) next.focus();
  else onLast?.();
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
  openCreateSignal = 0,
  onSuccess,
  onCustomerCreated,
  onClearCustomer,
}: QuickAppointmentProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const customerRef = useRef<HTMLSelectElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);
  const prefs = useBookingPreferences();
  const lastCreateSignal = useRef(0);
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
  const [createSuccess, setCreateSuccess] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    email?: string;
  }>({});
  const [creating, setCreating] = useState(false);

  const [state, formAction, pending] = useActionState(
    createAppointment,
    {} as ActionState,
  );

  const resolvedCustomerId = preselectedCustomerId || customerId;
  const selectedCustomer = customers.find((c) => c.id === resolvedCustomerId);
  const selectedService = activeServices.find((s) => s.id === serviceId);

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
  const selectedStaff = eligibleStaff.find((m) => m.id === activeStaffId);

  useEffect(() => {
    if (state.error) toast(state.error, "error");
    if (state.success) {
      writeBookingPreferences({
        serviceId,
        staffId: activeStaffId,
        locationId,
      });
      const when = slot
        ? format(parseISO(slot), "EEE, MMM d · h:mm a")
        : "appointment";
      const serviceLabel = selectedService?.name ?? "Service";
      const staffLabel = selectedStaff?.name;
      toast(
        selectedCustomer
          ? `Confirmed · ${selectedCustomer.name} · ${serviceLabel}${staffLabel ? ` with ${staffLabel}` : ""} · ${when}`
          : `Confirmed · ${serviceLabel} · ${when}`,
        "success",
      );
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast on action result only
  }, [state.error, state.success]);

  useEffect(() => {
    if (openCreateSignal <= 0) return;
    if (openCreateSignal === lastCreateSignal.current) return;
    lastCreateSignal.current = openCreateSignal;
    setShowCreate(true);
    setCreateSuccess(false);
  }, [openCreateSignal]);

  useEffect(() => {
    if (focusSignal <= 0 && !walkInMode && openCreateSignal <= 0) return;
    const t = window.setTimeout(() => {
      if (showCreate) firstNameRef.current?.focus();
      else if (!resolvedCustomerId) customerRef.current?.focus();
      else serviceRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [
    focusSignal,
    walkInMode,
    showCreate,
    resolvedCustomerId,
    openCreateSignal,
  ]);

  useEffect(() => {
    if (!showCreate || createSuccess) return;
    const t = window.setTimeout(() => firstNameRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [showCreate, createSuccess]);

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
      : fieldErrors.email ?? null;

  const missingHints = [
    !resolvedCustomerId ? "customer" : null,
    !serviceId ? "service" : null,
    !activeStaffId ? "staff" : null,
    !slot ? "time slot" : null,
  ].filter(Boolean) as string[];

  const canBook =
    !!resolvedCustomerId && !!serviceId && !!activeStaffId && !!slot && !pending;

  function resetCreateFields() {
    setFirstName("");
    setLastName("");
    setNewEmail("");
    setNewPhone("");
    setNewNotes("");
    setEmailTouched(false);
    setFieldErrors({});
  }

  async function handleQuickCreate() {
    const errors: { firstName?: string; email?: string } = {};
    if (!firstName.trim()) {
      errors.firstName = "First name is required.";
    }
    setEmailTouched(true);
    if (!newEmail.trim()) {
      errors.email = "Email is required.";
    } else if (!isValidEmail(newEmail)) {
      errors.email = "Enter a valid email.";
    }
    setFieldErrors(errors);
    if (errors.firstName) {
      firstNameRef.current?.focus();
      return;
    }
    if (errors.email) {
      emailRef.current?.focus();
      return;
    }

    const fullName = [firstName.trim(), lastName.trim()]
      .filter(Boolean)
      .join(" ");

    setCreating(true);
    const result = await quickCreateCustomer({
      name: fullName,
      email: newEmail,
      phone: newPhone || undefined,
      notes: newNotes || undefined,
    });
    setCreating(false);
    if (result.error || !result.customerId) {
      toast(result.error ?? "Could not create customer.", "error");
      return;
    }
    const created: Customer = {
      id: result.customerId,
      business_id: "",
      name: fullName,
      email: newEmail.trim(),
      phone: newPhone.trim() || null,
      notes: newNotes.trim() || null,
      tags: [],
      referral_source: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setExtraCustomers((prev) => [...prev, created]);
    setCustomerId(result.customerId);
    setCreateSuccess(true);
    pushRecentCustomer(created);
    onCustomerCreated?.(created);

    window.setTimeout(() => {
      setShowCreate(false);
      setCreateSuccess(false);
      resetCreateFields();
      serviceRef.current?.focus();
    }, 700);
  }

  function onBookingKeyDown(e: React.KeyboardEvent) {
    if (!(e.metaKey || e.ctrlKey) || e.key !== "Enter") return;
    if (!canBook || showCreate) return;
    e.preventDefault();
    formRef.current?.requestSubmit();
  }

  return (
    <section className="space-y-3" onKeyDown={onBookingKeyDown}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="ds-section-title text-sm">
          {walkInMode ? "Walk-in" : "Book"}
        </h3>
        {canBook ? (
          <span className="text-[10px] text-muted-foreground">⌘↵ save</span>
        ) : null}
      </div>

      {createSuccess ? (
        <div
          className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-5 animate-success-pop"
          role="status"
        >
          <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">Customer added</p>
          <p className="text-xs text-muted-foreground">Continuing to booking…</p>
        </div>
      ) : !showCreate ? (
        <div className="space-y-2">
          {selectedCustomer ? (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-border/80">
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
            className="w-full transition-colors"
            onClick={() => {
              setShowCreate(true);
              setCreateSuccess(false);
            }}
          >
            <UserRound className="h-3.5 w-3.5" />
            New customer
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5 rounded-[var(--radius-md)] border border-dashed border-primary/30 bg-accent/20 p-3 animate-fade-in-up"
          style={{ animationDuration: "220ms" }}
        >
          <p className="text-xs font-medium text-foreground">New customer</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="qa_first_name">First name</Label>
              <Input
                ref={firstNameRef}
                id="qa_first_name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (fieldErrors.firstName) {
                    setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
                  }
                }}
                autoFocus
                placeholder="First"
                aria-invalid={!!fieldErrors.firstName}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setShowCreate(false);
                    resetCreateFields();
                  }
                  focusNext(e, lastNameRef.current);
                }}
              />
              {fieldErrors.firstName ? (
                <p className="text-xs text-destructive" role="alert">
                  {fieldErrors.firstName}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qa_last_name">Last name</Label>
              <Input
                ref={lastNameRef}
                id="qa_last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setShowCreate(false);
                    resetCreateFields();
                  }
                  focusNext(e, phoneRef.current);
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qa_new_phone">Phone</Label>
            <Input
              ref={phoneRef}
              id="qa_new_phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(formatPhoneInput(e.target.value))}
              placeholder="(555) 123-4567"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowCreate(false);
                  resetCreateFields();
                }
                focusNext(e, emailRef.current);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qa_new_email">Email</Label>
            <Input
              ref={emailRef}
              id="qa_new_email"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              onBlur={() => setEmailTouched(true)}
              placeholder="name@email.com"
              aria-invalid={!!emailError}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowCreate(false);
                  resetCreateFields();
                }
                focusNext(e, notesRef.current);
              }}
            />
            {emailError ? (
              <p className="text-xs text-destructive" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qa_new_notes">Notes</Label>
            <Textarea
              ref={notesRef}
              id="qa_new_notes"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Allergies, preferences…"
              rows={2}
              className="min-h-[4rem] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowCreate(false);
                  resetCreateFields();
                }
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void handleQuickCreate();
                }
              }}
            />
            <p className="text-[10px] text-muted-foreground">
              Enter moves fields · ⌘Enter saves
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={creating || !firstName.trim() || !newEmail.trim()}
              onClick={() => void handleQuickCreate()}
            >
              {creating ? "Saving…" : "Save & book"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCreate(false);
                resetCreateFields();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-3">
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
              ref={serviceRef}
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
          <p className="rounded-[var(--radius-md)] border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Choose service and staff to load open times.
          </p>
        )}

        <AlertMessage error={state.error} />

        {missingHints.length > 0 && !pending ? (
          <p className="text-[11px] text-muted-foreground" role="status">
            Still need: {missingHints.join(", ")}.
          </p>
        ) : canBook ? (
          <p className="text-[11px] text-muted-foreground" role="status">
            Ready — one click to confirm
            {selectedCustomer ? ` for ${selectedCustomer.name}` : ""}.
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full transition-transform active:scale-[0.99]"
          disabled={!canBook}
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
