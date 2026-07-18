"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  AppointmentStatus,
  Location,
  Service,
  StaffWithServices,
} from "@/lib/types/booking";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";

type AppointmentSectionProps = {
  services: Service[];
  staff: StaffWithServices[];
  locations: Location[];
  serviceId: string;
  staffId: string;
  locationId: string;
  date: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes: string;
  bookingSource: string;
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
  staff,
  locations,
  serviceId,
  staffId,
  locationId,
  date,
  durationMinutes,
  status,
  notes,
  bookingSource,
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

  const price =
    selectedService != null
      ? Number(
          eligibleStaff
            .find((m) => m.id === staffId)
            ?.staff_services.find((ss) => ss.service_id === serviceId)
            ?.price_override ?? selectedService.price,
        )
      : null;

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
          Service, team, timing, and commercial details
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
          <Label htmlFor="bs-service">Service</Label>
          <Select
            id="bs-service"
            value={serviceId}
            onChange={(e) => onServiceChange(e.target.value)}
          >
            {locationServices.length === 0 ? (
              <option value="">No active services</option>
            ) : (
              locationServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.category ? `${s.category} · ` : ""}
                  {s.name} ({s.duration_minutes}m)
                </option>
              ))
            )}
          </Select>
          {categories.length > 0 ? (
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
          <p className="text-muted-foreground">Price</p>
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
          placeholder="Preferences, allergies, prep…"
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Room / resource assignment is prepared for a later release — availability
        still validates through the Booking Engine.
      </p>
    </section>
  );
}
