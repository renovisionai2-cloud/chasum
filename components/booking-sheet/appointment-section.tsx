"use client";

import { BookingPriceSummary } from "@/components/booking/booking-price-summary";
import { BookingSection } from "@/components/booking/booking-section";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ServicePackage, TaxRate } from "@/lib/business/types";
import { filterEligibleBookingStaff } from "@/lib/booking/eligible-staff";
import {
  ASSIGN_LATER_COMING_SOON_LABEL,
  OPTIONAL_STAFF_PERSISTENCE_ENABLED,
  UNASSIGNED_ASSIGN_LATER_LABEL,
} from "@/lib/booking/optional-staff";
import { MIN_BOOKING_DURATION_MINUTES } from "@/lib/booking/resolved-duration";
import { resolveBookingFinancials } from "@/lib/commerce/booking-financials";
import { formatMoneyCents } from "@/lib/commerce/money";
import type {
  AppointmentStatus,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import {
  APPOINTMENT_STATUS_LABELS,
  DEFAULT_APPOINTMENT_STATUS_WORKFLOW,
  resolveAppointmentStatusWorkflow,
} from "@/lib/types/booking";
import { useState } from "react";

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
  serviceDefaultMinutes?: number | null;
  durationIsOverride?: boolean;
  durationUnresolved?: boolean;
  status: AppointmentStatus;
  notes: string;
  bookingSource: string;
  currency?: string | null;
  taxRates?: TaxRate[];
  onOfferTypeChange: (type: BookingOfferType) => void;
  onPackageChange: (id: string) => void;
  onServiceChange: (id: string) => void;
  onStaffChange: (id: string) => void;
  onLocationChange: (id: string) => void;
  onDateChange: (date: string) => void;
  /** Pass null to clear override and return to service default. */
  onDurationChange: (minutes: number | null) => void;
  onStatusChange: (status: AppointmentStatus) => void;
  onNotesChange: (notes: string) => void;
  /** Focus Available time after picking a date (Booking Sheet). */
  onDateSelected?: (date: string) => void;
  minDate?: string;
  statusWorkflow?: AppointmentStatus[] | null;
  /** When false, duration stays read-only (no Adjust control). */
  allowDurationOverride?: boolean;
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
  serviceDefaultMinutes = null,
  durationIsOverride = false,
  durationUnresolved = false,
  status,
  notes,
  bookingSource,
  currency,
  taxRates = [],
  onOfferTypeChange,
  onPackageChange,
  onServiceChange,
  onStaffChange,
  onLocationChange,
  onDateChange,
  onDateSelected,
  onDurationChange,
  onStatusChange,
  onNotesChange,
  minDate,
  statusWorkflow,
  allowDurationOverride = true,
}: AppointmentSectionProps) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [draftOverride, setDraftOverride] = useState(
    String(durationMinutes || ""),
  );

  const locationServices = services.filter(
    (s) => s.is_active && (!locationId || s.location_id === locationId),
  );
  const activePackages = packages.filter((p) => p.is_active);
  const selectedPackage = activePackages.find((p) => p.id === packageId);
  const selectedService = services.find((s) => s.id === serviceId);
  const eligibleStaff = filterEligibleBookingStaff(staff, {
    serviceId,
    locationId,
  });

  const workflow = resolveAppointmentStatusWorkflow(
    statusWorkflow ?? DEFAULT_APPOINTMENT_STATUS_WORKFLOW,
  );
  const statusOptions = Array.from(
    new Set<AppointmentStatus>(["pending", ...workflow, status]),
  );

  const packagePriceCents = selectedPackage?.price_cents ?? null;
  const servicePriceCents =
    selectedService != null
      ? Math.round(
          Number(
            eligibleStaff
              .find((m) => m.id === staffId)
              ?.staff_services.find((ss) => ss.service_id === serviceId)
              ?.price_override ?? selectedService.price,
          ) * 100,
        )
      : null;
  const catalogPriceCents =
    offerType === "package"
      ? (packagePriceCents ?? 0)
      : (servicePriceCents ?? 0);

  const financials = resolveBookingFinancials({
    catalogPriceCents,
    serviceTaxRateBps: selectedService?.tax_rate_bps ?? 0,
    taxRates,
    depositRequiredCents: selectedService?.deposit_cents,
    depositRequired: selectedService?.deposit_required,
    currency,
  });

  const includedNames =
    selectedPackage?.service_ids
      .map((id) => services.find((s) => s.id === id)?.name)
      .filter((n): n is string => Boolean(n)) ?? [];

  const bufferBefore = selectedService?.buffer_before_minutes ?? 0;
  const bufferAfter = selectedService?.buffer_after_minutes ?? 0;
  const cleanup = selectedService?.cleanup_minutes ?? 0;
  const depositRequired = financials.depositRequiredCents > 0;
  const depositCents = financials.depositRequiredCents;
  const catalogDuration =
    serviceDefaultMinutes ?? selectedService?.duration_minutes ?? null;

  return (
    <section className="space-y-4" aria-labelledby="bs-appt-heading">
      <div>
        <h3 id="bs-appt-heading" className="text-sm font-semibold tracking-tight">
          Appointment
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {locations.length > 1 ? (
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
        ) : (
          <input type="hidden" value={locationId} readOnly aria-hidden />
        )}

        {activePackages.length > 0 ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bs-offer-type">Book</Label>
            <Select
              id="bs-offer-type"
              value={offerType}
              onChange={(e) =>
                onOfferTypeChange(e.target.value as BookingOfferType)
              }
            >
              <option value="service">Service</option>
              <option value="package">Package</option>
            </Select>
          </div>
        ) : null}

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
                    {p.name} · {formatMoneyCents(p.price_cents, currency)} ·{" "}
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
              ).map((s) => {
                const cents = Math.round(Number(s.price) * 100);
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.duration_minutes} min ·{" "}
                    {formatMoneyCents(cents, currency)}
                  </option>
                );
              })
            )}
          </Select>
          {selectedService ? (
            <div className="rounded-[var(--radius-md)] border border-border/70 bg-muted/15 px-3 py-2.5">
              <p className="text-sm font-medium">{selectedService.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selectedService.duration_minutes} minutes
                {servicePriceCents != null
                  ? ` · ${formatMoneyCents(servicePriceCents, currency)}`
                  : ""}
                {(selectedService.tax_rate_bps ?? 0) > 0 ? " · Taxable" : ""}
                {selectedService.category
                  ? ` · ${selectedService.category}`
                  : ""}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bs-staff">Employee</Label>
          <Select
            id="bs-staff"
            value={staffId}
            onChange={(e) => onStaffChange(e.target.value)}
          >
            <option
              value=""
              disabled={!OPTIONAL_STAFF_PERSISTENCE_ENABLED}
            >
              {OPTIONAL_STAFF_PERSISTENCE_ENABLED
                ? UNASSIGNED_ASSIGN_LATER_LABEL
                : ASSIGN_LATER_COMING_SOON_LABEL}
            </option>
            {[...eligibleStaff]
              .sort((a, b) =>
                a.name.localeCompare(b.name, undefined, {
                  sensitivity: "base",
                }),
              )
              .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>

        <DateField
          id="bs-date"
          name="date"
          label="Date"
          value={date}
          min={minDate}
          onChange={onDateChange}
          onAfterSelect={onDateSelected}
        />

        <div className="space-y-1.5">
          <Label id="bs-duration-label">Duration</Label>
          <div
            className="rounded-[var(--radius-md)] border border-border bg-muted/20 px-3 py-2"
            aria-labelledby="bs-duration-label"
          >
            {durationUnresolved ? (
              <p className="text-sm text-muted-foreground">
                Waiting for service duration…
              </p>
            ) : (
              <>
                <p className="text-sm font-medium tabular-nums">
                  {durationMinutes} minutes
                </p>
                {durationIsOverride && catalogDuration != null ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Custom for this appointment · Service default:{" "}
                    {catalogDuration} minutes
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    From selected service
                  </p>
                )}
              </>
            )}
          </div>
          {allowDurationOverride && !durationUnresolved ? (
            adjustOpen ? (
              <div className="mt-2 space-y-2 rounded-[var(--radius-md)] border border-border/80 bg-card px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  Changes this appointment only. Availability will be checked
                  again for the new length.
                </p>
                {catalogDuration != null ? (
                  <p className="text-[11px] text-muted-foreground">
                    Service duration: {catalogDuration} minutes
                  </p>
                ) : null}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[7rem] flex-1 space-y-1">
                    <Label htmlFor="bs-duration-override" className="text-xs">
                      Appointment override
                    </Label>
                    <Input
                      id="bs-duration-override"
                      type="number"
                      min={MIN_BOOKING_DURATION_MINUTES}
                      step={5}
                      value={draftOverride}
                      onChange={(e) => setDraftOverride(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const n = Number(draftOverride);
                      if (
                        !Number.isFinite(n) ||
                        n < MIN_BOOKING_DURATION_MINUTES
                      ) {
                        return;
                      }
                      onDurationChange(Math.round(n));
                      setAdjustOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onDurationChange(null);
                      setDraftOverride(
                        String(catalogDuration ?? durationMinutes),
                      );
                      setAdjustOpen(false);
                    }}
                  >
                    Use service default
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-8 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setDraftOverride(String(durationMinutes));
                  setAdjustOpen(true);
                }}
              >
                Adjust duration
              </Button>
            )
          ) : null}
        </div>
      </div>

      <BookingSection
        title="Advanced"
        description="Status, source, buffers, and service rules."
        collapsible
        defaultOpen={false}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bs-status">Status</Label>
            <Select
              id="bs-status"
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as AppointmentStatus)
              }
            >
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {APPOINTMENT_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Booking source</Label>
            <p className="rounded-[var(--radius-md)] border border-border/60 bg-muted/15 px-3 py-2 text-sm text-muted-foreground">
              {bookingSource}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
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
          {depositRequired ? (
            <div>
              <p className="text-muted-foreground">Deposit</p>
              <p className="font-medium tabular-nums">
                {formatMoneyCents(depositCents, currency)}
              </p>
            </div>
          ) : null}
          {financials.taxCents > 0 ? (
            <div>
              <p className="text-muted-foreground">Tax</p>
              <p className="font-medium tabular-nums">
                {financials.formatted.tax}
                {financials.taxInclusive ? " incl." : ""}
              </p>
            </div>
          ) : null}
        </div>
      </BookingSection>

      <BookingPriceSummary
        financials={financials}
        currency={currency}
      />

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
