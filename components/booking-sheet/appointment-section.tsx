"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ServicePackage } from "@/lib/business/types";
import type {
  AppointmentStatus,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";

export type BookingOfferType = "service" | "package";

type AppointmentSectionProps = {
  services: Service[];
  packages: ServicePackage[];
  staff: StaffWithServices[];
  locations: Location[];
  offerType: BookingOfferType;
  packageId: string;
  serviceId: string;
  staffId: string;
  locationId: string;
  date: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes: string;
  bookingSource: string;
  onOfferTypeChange: (type: BookingOfferType) => void;
  onPackageChange: (id: string) => void;
  onServiceChange: (id: string) => void;
  onStaffChange: (id: string) => void;
  onLocationChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onDurationChange: (minutes: number) => void;
  onStatusChange: (status: AppointmentStatus) => void;
  onNotesChange: (notes: string) => void;
  minDate?: string;
};

export function AppointmentSection({
  services,
  packages,
  staff,
  locations,
  offerType,
  packageId,
  serviceId,
  staffId,
  locationId,
  date,
  durationMinutes,
  status,
  notes,
  bookingSource,
  onOfferTypeChange,
  onPackageChange,
  onServiceChange,
  onStaffChange,
  onLocationChange,
  onDateChange,
  onDurationChange,
  onStatusChange,
  onNotesChange,
  minDate,
}: AppointmentSectionProps) {
  const locationServices = services.filter(
    (s) => s.is_active && (!locationId || s.location_id === locationId),
  );
  const activePackages = packages.filter((p) => p.is_active);
  const selectedPackage = activePackages.find((p) => p.id === packageId);
  const selectedService = services.find((s) => s.id === serviceId);
  const eligibleStaff = staff.filter(
    (m) =>
      m.is_active &&
      (!locationId || m.location_id === locationId) &&
      m.staff_services.some((ss) => ss.service_id === serviceId),
  );

  const categories = Array.from(
    new Set(
      locationServices
        .map((s) => s.category?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  );

  const packagePriceDollars =
    selectedPackage != null ? selectedPackage.price_cents / 100 : null;
  const servicePrice =
    selectedService != null
      ? Number(
          eligibleStaff
            .find((m) => m.id === staffId)
            ?.staff_services.find((ss) => ss.service_id === serviceId)
            ?.price_override ?? selectedService.price,
        )
      : null;
  const price =
    offerType === "package" ? packagePriceDollars : servicePrice;

  const includedNames =
    selectedPackage?.service_ids
      .map((id) => services.find((s) => s.id === id)?.name)
      .filter((n): n is string => Boolean(n)) ?? [];

  const bufferBefore = selectedService?.buffer_before_minutes ?? 0;
  const bufferAfter = selectedService?.buffer_after_minutes ?? 0;
  const cleanup = selectedService?.cleanup_minutes ?? 0;
  const depositRequired = Boolean(selectedService?.deposit_required);
  const depositCents = selectedService?.deposit_cents ?? 0;
  const taxRate = selectedService?.tax_rate_bps ?? 0;

  return (
    <section className="space-y-4" aria-labelledby="bs-appt-heading">
      <div>
        <h3 id="bs-appt-heading" className="text-sm font-semibold tracking-tight">
          Appointment
        </h3>
        <p className="text-xs text-muted-foreground">
          Book a single service or a package. Packages use the package price and
          include one or more services.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bs-location">Location</Label>
          <Select
            id="bs-location"
            value={locationId}
            onChange={(e) => onLocationChange(e.target.value)}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bs-offer-type">Book</Label>
          <Select
            id="bs-offer-type"
            value={offerType}
            onChange={(e) =>
              onOfferTypeChange(e.target.value as BookingOfferType)
            }
          >
            <option value="service">Service — individual appointment</option>
            <option value="package">Package — bundled visits / services</option>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {offerType === "service"
              ? "Example: Haircut, Facial, Consultation — one visit, one price."
              : "Example: Bridal package or 5-visit massage series — package price applies; first included service is scheduled."}
          </p>
        </div>

        {offerType === "package" ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bs-package">Package</Label>
            <Select
              id="bs-package"
              value={packageId}
              onChange={(e) => onPackageChange(e.target.value)}
            >
              {activePackages.length === 0 ? (
                <option value="">No active packages</option>
              ) : (
                activePackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · ${(p.price_cents / 100).toFixed(2)} ·{" "}
                    {p.total_visits} visits
                  </option>
                ))
              )}
            </Select>
            {includedNames.length > 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Includes: {includedNames.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bs-service">
            {offerType === "package" ? "Service for this visit" : "Service"}
          </Label>
          <Select
            id="bs-service"
            value={serviceId}
            onChange={(e) => onServiceChange(e.target.value)}
            disabled={offerType === "package" && includedNames.length > 0}
          >
            {locationServices.length === 0 ? (
              <option value="">No active services</option>
            ) : (
              (offerType === "package" && selectedPackage
                ? locationServices.filter((s) =>
                    selectedPackage.service_ids.includes(s.id),
                  )
                : locationServices
              ).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.category ? `${s.category} · ` : ""}
                  {s.name} ({s.duration_minutes}m)
                </option>
              ))
            )}
          </Select>
          {offerType === "service" && categories.length > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Categories: {categories.slice(0, 4).join(", ")}
              {categories.length > 4 ? "…" : ""}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bs-staff">Employee</Label>
          <Select
            id="bs-staff"
            value={
              eligibleStaff.some((m) => m.id === staffId)
                ? staffId
                : (eligibleStaff[0]?.id ?? "")
            }
            onChange={(e) => onStaffChange(e.target.value)}
          >
            {eligibleStaff.length === 0 ? (
              <option value="">No eligible employees</option>
            ) : (
              eligibleStaff.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            )}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bs-date">Date</Label>
          <Input
            id="bs-date"
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bs-duration">Duration (min)</Label>
          <Input
            id="bs-duration"
            type="number"
            min={5}
            step={5}
            value={durationMinutes}
            onChange={(e) => onDurationChange(Number(e.target.value) || 30)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bs-status">Status</Label>
          <Select
            id="bs-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as AppointmentStatus)}
          >
            {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Booking source</Label>
          <Input value={bookingSource} readOnly aria-readonly />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-border/80 bg-muted/20 p-3 text-xs sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Cleanup</p>
          <p className="font-medium tabular-nums">{cleanup}m</p>
        </div>
        <div>
          <p className="text-muted-foreground">Buffers</p>
          <p className="font-medium tabular-nums">
            {bufferBefore}/{bufferAfter}m
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {offerType === "package" ? "Package price" : "Price"}
          </p>
          <p className="font-medium tabular-nums">
            {price != null ? `$${price.toFixed(2)}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Deposit / tax</p>
          <p className="font-medium tabular-nums">
            {depositRequired
              ? `$${(depositCents / 100).toFixed(2)}`
              : "None"}
            {taxRate > 0 ? ` · ${(taxRate / 100).toFixed(1)}%` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bs-notes">Notes</Label>
        <Textarea
          id="bs-notes"
          rows={2}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Optional notes for the visit"
        />
      </div>
    </section>
  );
}
