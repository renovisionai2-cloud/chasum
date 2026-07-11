"use client";

import { bookAppointment, getAvailableSlots } from "@/lib/actions/public-booking";
import type { ActionState, Business, BusinessHours, Service, Staff } from "@/lib/types/booking";
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
import { useActionState, useEffect, useState, useTransition } from "react";

type StaffWithServices = Staff & {
  staff_services: { service_id: string }[];
};

type BookingPageProps = {
  business: Business;
  services: Service[];
  staff: StaffWithServices[];
  hours: BusinessHours[];
};

type Step = "service" | "staff" | "datetime" | "details" | "confirmed";

export function PublicBookingPage({
  business,
  services,
  staff,
}: BookingPageProps) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffWithServices | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, startSlotTransition] = useTransition();
  const [state, formAction, pending] = useActionState(bookAppointment, {} as ActionState);

  const availableStaff = selectedService
    ? staff.filter((m) =>
        m.staff_services.some((ss) => ss.service_id === selectedService.id),
      )
    : [];

  useEffect(() => {
    if (!selectedService || !selectedStaff || !selectedDate) return;
    startSlotTransition(async () => {
      const available = await getAvailableSlots(
        business.slug,
        selectedService.id,
        selectedStaff.id,
        selectedDate,
      );
      setSlots(available);
      setSelectedSlot(null);
    });
  }, [business.slug, selectedService, selectedStaff, selectedDate]);

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
            <p className="text-sm text-muted-foreground">Book an appointment</p>
          </div>
          <Logo showText={false} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {(["service", "staff", "datetime", "details"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                ["service", "staff", "datetime", "details"].indexOf(step) >= i
                  ? "bg-primary"
                  : "bg-muted",
              )}
            />
          ))}
        </div>

        {step === "service" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Choose a service</h2>
            <div className="grid gap-3">
              {services.map((service) => (
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
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading available times...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available times for this date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep("details");
                    }}
                    className={cn(
                      "rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:bg-accent/30",
                      selectedSlot === slot && "border-primary bg-accent",
                    )}
                  >
                    {formatTime(parseISO(slot))}
                  </button>
                ))}
              </div>
            )}
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
