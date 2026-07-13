"use client";

import { BookingConfirmation } from "@/components/booking/booking-confirmation";
import { BusinessContact } from "@/components/booking/business-contact";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { Textarea } from "@/components/ui/textarea";
import {
  bookAppointment,
  getPublicSlotOptions,
  lookupPublicCustomer,
  type PublicSlotOption,
} from "@/lib/actions/public-booking";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import type {
  Business,
  Location,
  PublicBookingState,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import { Check, ChevronLeft, Clock, Users } from "lucide-react";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";

type BookingPageProps = {
  business: Business;
  locations: Location[];
  initialLocationId?: string;
  services: Service[];
  staff: StaffWithServices[];
  inviteCode?: string;
};

type Step =
  | "location"
  | "service"
  | "staff"
  | "date"
  | "time"
  | "details"
  | "review";

const STEP_ORDER: Step[] = [
  "location",
  "service",
  "staff",
  "date",
  "time",
  "details",
  "review",
];

export function PublicBookingPage({
  business,
  locations,
  initialLocationId,
  services,
  staff,
  inviteCode,
}: BookingPageProps) {
  const defaultLocation =
    locations.find((l) => l.id === initialLocationId) ??
    locations.find((l) => l.is_default) ??
    locations[0] ??
    null;

  const multiLocation = locations.length > 1;
  const visibleSteps = useMemo(
    () => STEP_ORDER.filter((s) => s !== "location" || multiLocation),
    [multiLocation],
  );

  const [step, setStep] = useState<Step>(multiLocation ? "location" : "service");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    defaultLocation,
  );
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffWithServices | null>(
    null,
  );
  const [anyStaff, setAnyStaff] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedSlot, setSelectedSlot] = useState<PublicSlotOption | null>(null);
  const [slotOptions, setSlotOptions] = useState<PublicSlotOption[]>([]);
  const [loadingSlots, startSlotLoad] = useTransition();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [welcomeBack, setWelcomeBack] = useState(false);
  const [state, formAction, pending] = useActionState(
    bookAppointment,
    {} as PublicBookingState,
  );

  const locationServices = selectedLocation
    ? services.filter((s) => s.location_id === selectedLocation.id)
    : services;

  const availableStaff = useMemo(() => {
    const pool = selectedLocation
      ? staff.filter((m) => m.location_id === selectedLocation.id)
      : staff;
    if (!selectedService) return [];
    return pool.filter((m) =>
      m.staff_services.some((ss) => ss.service_id === selectedService.id),
    );
  }, [staff, selectedLocation, selectedService]);

  const stepIndex = visibleSteps.indexOf(step);

  useEffect(() => {
    if (step !== "time" || !selectedService || !selectedDate) return;

    let cancelled = false;
    startSlotLoad(async () => {
      try {
        const options = await getPublicSlotOptions({
          slug: business.slug,
          serviceId: selectedService.id,
          date: selectedDate,
          locationId: selectedLocation?.id,
          staffId: anyStaff ? null : selectedStaff?.id,
          staff: availableStaff,
        });
        if (!cancelled) {
          setSlotOptions(options);
          setSelectedSlot((prev) =>
            prev &&
            options.some(
              (o) => o.start === prev.start && o.staffId === prev.staffId,
            )
              ? prev
              : null,
          );
        }
      } catch {
        if (!cancelled) {
          setSlotOptions([]);
          setSelectedSlot(null);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    step,
    selectedService,
    selectedDate,
    selectedLocation?.id,
    selectedStaff?.id,
    anyStaff,
    business.slug,
    availableStaff,
  ]);

  async function handleEmailBlur() {
    const email = customerEmail.trim();
    if (!email.includes("@")) return;
    const result = await lookupPublicCustomer(business.slug, email);
    if (result.found) {
      setWelcomeBack(true);
      if (result.name && !customerName.trim()) setCustomerName(result.name);
      if (result.phone && !customerPhone.trim()) setCustomerPhone(result.phone);
    } else {
      setWelcomeBack(false);
    }
  }

  function resetFlow() {
    setStep(multiLocation ? "location" : "service");
    setSelectedService(null);
    setSelectedStaff(null);
    setAnyStaff(false);
    setSelectedSlot(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setNotes("");
    setWelcomeBack(false);
    window.location.reload();
  }

  if (state.success && state.reference && state.summary) {
    return (
      <BookingConfirmation
        business={business}
        reference={state.reference}
        summary={state.summary}
        emailQueued={state.emailQueued}
        onBookAnother={resetFlow}
      />
    );
  }

  const dateChips = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return {
      value: format(d, "yyyy-MM-dd"),
      label: format(d, "EEE"),
      day: format(d, "d"),
      month: format(d, "MMM"),
    };
  });

  const resolvedStaffName = selectedSlot
    ? selectedSlot.staffName
    : anyStaff
      ? "First available"
      : selectedStaff?.name ?? "—";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {business.cover_url && (
        <div className="relative h-36 w-full overflow-hidden sm:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={business.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo_url}
                alt=""
                className="h-11 w-11 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                {business.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold sm:text-xl">
                {business.name}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                {selectedLocation
                  ? `${selectedLocation.name} · Book online`
                  : "Book an appointment"}
              </p>
            </div>
          </div>
          <Logo showText={false} href={null} />
        </div>
        {business.description && step === (multiLocation ? "location" : "service") && (
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
            {business.description}
          </p>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8 flex items-center gap-1.5 sm:gap-2">
          {visibleSteps.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                stepIndex >= i ? "bg-primary" : "bg-muted",
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        {step === "location" && multiLocation && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Choose a location</h2>
            <div className="grid gap-3">
              {locations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => {
                    setSelectedLocation(location);
                    setSelectedService(null);
                    setSelectedStaff(null);
                    setAnyStaff(false);
                    setSelectedSlot(null);
                    setStep("service");
                  }}
                  className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/30"
                >
                  <p className="font-medium">{location.name}</p>
                  {(location.address_line1 || location.city) && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[location.address_line1, location.city, location.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "service" && (
          <section className="space-y-4">
            {multiLocation && (
              <BackButton onClick={() => setStep("location")} label="Change location" />
            )}
            <h2 className="text-lg font-semibold">Select a service</h2>
            <div className="grid gap-3">
              {locationServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedStaff(null);
                    setAnyStaff(false);
                    setSelectedSlot(null);
                    setStep("staff");
                  }}
                  className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/30"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: service.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.duration_minutes} min · $
                        {Number(service.price).toFixed(2)}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  {service.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                  {service.preparation_instructions && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Prep: {service.preparation_instructions}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "staff" && selectedService && (
          <section className="space-y-4">
            <BackButton onClick={() => setStep("service")} />
            <h2 className="text-lg font-semibold">Choose a provider</h2>
            <p className="text-sm text-muted-foreground">
              Optional — pick someone or take the first available opening.
            </p>
            {selectedService.preparation_instructions && (
              <p className="rounded-[var(--radius-md)] border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                <strong className="text-foreground">Preparation:</strong>{" "}
                {selectedService.preparation_instructions}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setAnyStaff(true);
                setSelectedStaff(null);
                setSelectedSlot(null);
                setStep("date");
              }}
              className="flex w-full items-start gap-3 rounded-2xl border border-primary/40 bg-accent/20 p-4 text-left transition-colors hover:border-primary"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-medium">Any available</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  Show all real openings from the scheduling engine
                </span>
              </span>
            </button>
            <div className="grid gap-3">
              {availableStaff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setAnyStaff(false);
                    setSelectedStaff(member);
                    setSelectedSlot(null);
                    setStep("date");
                  }}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.title ?? "Team member"}
                    </p>
                    {member.qualifications && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {member.qualifications}
                      </p>
                    )}
                    {member.biography && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {member.biography}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "date" && selectedService && (
          <section className="space-y-4">
            <BackButton onClick={() => setStep("staff")} />
            <h2 className="text-lg font-semibold">Select a date</h2>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {dateChips.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => {
                    setSelectedDate(chip.value);
                    setSelectedSlot(null);
                  }}
                  className={cn(
                    "flex w-14 shrink-0 flex-col items-center rounded-2xl border border-border bg-card px-2 py-3 text-center transition-colors",
                    selectedDate === chip.value &&
                      "border-primary bg-accent ring-1 ring-primary/30",
                  )}
                >
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {chip.label}
                  </span>
                  <span className="text-lg font-semibold tabular-nums">
                    {chip.day}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {chip.month}
                  </span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking_date">Or pick another date</Label>
              <Input
                id="booking_date"
                type="date"
                value={selectedDate}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
              />
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={!selectedDate}
              onClick={() => setStep("time")}
            >
              Continue to times
            </Button>
          </section>
        )}

        {step === "time" && selectedService && (
          <section className="space-y-4">
            <BackButton onClick={() => setStep("date")} />
            <h2 className="text-lg font-semibold">Select a time</h2>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(`${selectedDate}T12:00:00`), "EEEE, MMMM d")} ·{" "}
              {resolvedStaffName}
            </p>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">
                Loading real available times…
              </p>
            ) : slotOptions.length === 0 ? (
              <p className="rounded-[var(--radius-md)] border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                No open times for this date. Try another day — we only show slots
                from the scheduling engine.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slotOptions.map((option) => {
                  const selected =
                    selectedSlot?.start === option.start &&
                    selectedSlot?.staffId === option.staffId;
                  return (
                    <button
                      key={`${option.staffId}-${option.start}`}
                      type="button"
                      onClick={() => setSelectedSlot(option)}
                      className={cn(
                        "rounded-xl border border-border px-3 py-3 text-left transition-colors hover:border-primary hover:bg-accent/30",
                        selected && "border-primary bg-accent",
                      )}
                    >
                      <span className="block text-sm font-medium">
                        {formatTime(parseISO(option.start))}
                      </span>
                      {anyStaff && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {option.staffName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <Button
              type="button"
              className="w-full"
              disabled={!selectedSlot}
              onClick={() => setStep("details")}
            >
              Continue
            </Button>
          </section>
        )}

        {step === "details" && selectedService && selectedSlot && (
          <section className="space-y-4">
            <BackButton onClick={() => setStep("time")} />
            <h2 className="text-lg font-semibold">Your information</h2>
            {welcomeBack && (
              <p className="flex items-center gap-2 rounded-[var(--radius-md)] border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                Welcome back — we found your profile for this email.
              </p>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  onBlur={() => void handleEmailBlur()}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_name">Full name</Label>
                <Input
                  id="customer_name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything we should know?"
                  rows={3}
                />
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={!customerName.trim() || !customerEmail.trim()}
                onClick={() => setStep("review")}
              >
                Review booking
              </Button>
            </div>
          </section>
        )}

        {step === "review" && selectedService && selectedSlot && (
          <section className="space-y-4">
            <BackButton onClick={() => setStep("details")} />
            <h2 className="text-lg font-semibold">Review & confirm</h2>
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <p>
                  <strong>{selectedService.name}</strong> with{" "}
                  {selectedSlot.staffName}
                </p>
                <p className="text-muted-foreground">
                  {format(parseISO(selectedSlot.start), "EEEE, MMM d")} at{" "}
                  {formatTime(parseISO(selectedSlot.start))}
                </p>
                {selectedLocation && (
                  <p className="text-muted-foreground">{selectedLocation.name}</p>
                )}
                <p className="pt-2 text-muted-foreground">
                  {customerName} · {customerEmail}
                  {customerPhone ? ` · ${customerPhone}` : ""}
                </p>
                {notes && (
                  <p className="text-muted-foreground">Notes: {notes}</p>
                )}
                <p className="pt-1 font-medium">
                  {selectedService.duration_minutes} min · $
                  {Number(selectedService.price).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            {business.booking_policy && (
              <p className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Booking policy:</strong>{" "}
                {business.booking_policy}
              </p>
            )}
            {business.cancellation_policy && (
              <p className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Cancellation policy:</strong>{" "}
                {selectedService.cancellation_policy || business.cancellation_policy}
              </p>
            )}

            <form action={formAction} className="space-y-3">
              <input type="hidden" name="slug" value={business.slug} />
              <input type="hidden" name="invite_code" value={inviteCode ?? ""} />
              <input
                type="hidden"
                name="location_id"
                value={selectedLocation?.id ?? ""}
              />
              <input type="hidden" name="service_id" value={selectedService.id} />
              <input type="hidden" name="staff_id" value={selectedSlot.staffId} />
              <input type="hidden" name="start_time" value={selectedSlot.start} />
              <input type="hidden" name="customer_name" value={customerName} />
              <input type="hidden" name="customer_email" value={customerEmail} />
              <input type="hidden" name="customer_phone" value={customerPhone} />
              <input type="hidden" name="notes" value={notes} />

              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending ? "Confirming…" : "Confirm booking"}
              </Button>
            </form>
          </section>
        )}
      </main>
      <BusinessContact business={business} className="mt-auto border-t border-border" />
    </div>
  );
}

function BackButton({
  onClick,
  label = "Back",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
