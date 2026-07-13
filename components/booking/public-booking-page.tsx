"use client";

import { bookAppointment } from "@/lib/actions/public-booking";
import { getPublicAvailableSlots } from "@/lib/actions/scheduling";
import { SlotPicker } from "@/components/scheduling/slot-picker";
import type { ActionState, Business, Location, Service, StaffWithServices } from "@/lib/types/booking";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, ChevronLeft, Clock } from "lucide-react";
import { useActionState, useCallback, useState } from "react";

type BookingPageProps = {
  business: Business;
  locations: Location[];
  initialLocationId?: string;
  services: Service[];
  staff: StaffWithServices[];
};

type Step = "location" | "service" | "staff" | "datetime" | "details" | "confirmed";

export function PublicBookingPage({
  business,
  locations,
  initialLocationId,
  services,
  staff,
}: BookingPageProps) {
  const defaultLocation =
    locations.find((l) => l.id === initialLocationId) ??
    locations.find((l) => l.is_default) ??
    locations[0] ??
    null;

  const [step, setStep] = useState<Step>(
    locations.length > 1 ? "location" : "service",
  );
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    defaultLocation,
  );
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffWithServices | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(bookAppointment, {} as ActionState);

  const loadSlots = useCallback(
    (serviceId: string, staffId: string, date: string) =>
      getPublicAvailableSlots(
        business.slug,
        serviceId,
        staffId,
        date,
        selectedLocation?.id,
      ),
    [business.slug, selectedLocation?.id],
  );

  const locationServices = selectedLocation
    ? services.filter((s) => s.location_id === selectedLocation.id)
    : services;

  const locationStaff = selectedLocation
    ? staff.filter((m) => m.location_id === selectedLocation.id)
    : staff;

  const availableStaff = selectedService
    ? locationStaff.filter((m) =>
        m.staff_services.some((ss) => ss.service_id === selectedService.id),
      )
    : [];

  if (state.success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-semibold">Booking confirmed!</h1>
          <p className="mt-3 text-muted-foreground">{state.success}</p>
          <p className="mt-6 text-sm text-muted-foreground">
            A confirmation has been sent to your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{business.name}</h1>
            <p className="text-sm text-muted-foreground">
              {selectedLocation ? `${selectedLocation.name} · Book an appointment` : "Book an appointment"}
            </p>
          </div>
          <Logo showText={false} href={null} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {(["location", "service", "staff", "datetime", "details"] as Step[])
            .filter((s) => s !== "location" || locations.length > 1)
            .map((s, i, arr) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                arr.indexOf(step) >= i || (step === "confirmed" && i <= arr.length)
                  ? "bg-primary"
                  : "bg-muted",
              )}
            />
          ))}
        </div>

        {step === "location" && locations.length > 1 && (
          <div className="space-y-4">
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
          </div>
        )}

        {step === "service" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Choose a service</h2>
            {locations.length > 1 && (
              <button
                type="button"
                onClick={() => setStep("location")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" /> Change location
              </button>
            )}
            <div className="grid gap-3">
              {locationServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedStaff(null);
                    setStep("staff");
                  }}
                  className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: service.color }} />
                    <div className="flex-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.duration_minutes} min · ${Number(service.price).toFixed(2)}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {service.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "staff" && selectedService && (
          <div className="space-y-4">
            <button type="button" onClick={() => setStep("service")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-lg font-semibold">Choose a provider</h2>
            <div className="grid gap-3">
              {availableStaff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaff(member);
                    setStep("datetime");
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: member.color }}>
                    {member.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.title ?? "Team member"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "datetime" && selectedService && selectedStaff && (
          <div className="space-y-4">
            <button type="button" onClick={() => setStep("staff")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-lg font-semibold">Pick a date & time</h2>
            <SlotPicker
              serviceId={selectedService.id}
              staffId={selectedStaff.id}
              date={selectedDate}
              selectedSlot={selectedSlot}
              onDateChange={(value) => {
                setSelectedDate(value);
                setSelectedSlot(null);
              }}
              onSelectSlot={setSelectedSlot}
              loadSlots={loadSlots}
            />
            <Button
              type="button"
              className="w-full"
              disabled={!selectedSlot}
              onClick={() => setStep("details")}
            >
              Continue
            </Button>
          </div>
        )}

        {step === "details" && selectedService && selectedStaff && selectedSlot && (
          <div className="space-y-4">
            <button type="button" onClick={() => setStep("datetime")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-lg font-semibold">Your details</h2>

            <Card className="border-border/60">
              <CardContent className="p-4 text-sm">
                <p><strong>{selectedService.name}</strong> with {selectedStaff.name}</p>
                <p className="text-muted-foreground">
                  {format(parseISO(selectedSlot), "EEEE, MMM d")} at {formatTime(parseISO(selectedSlot))}
                </p>
              </CardContent>
            </Card>

          {business.cancellation_policy && step === "details" && (
            <p className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <strong>Cancellation policy:</strong> {business.cancellation_policy}
            </p>
          )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="slug" value={business.slug} />
              <input type="hidden" name="location_id" value={selectedLocation?.id ?? ""} />
              <input type="hidden" name="service_id" value={selectedService.id} />
              <input type="hidden" name="staff_id" value={selectedStaff.id} />
              <input type="hidden" name="start_time" value={selectedSlot} />

              <div className="space-y-2">
                <Label htmlFor="customer_name">Full name</Label>
                <Input id="customer_name" name="customer_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input id="customer_email" name="customer_email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone">Phone (optional)</Label>
                <Input id="customer_phone" name="customer_phone" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" name="notes" placeholder="Anything we should know?" />
              </div>

              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending ? "Booking..." : "Confirm booking"}
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
