"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  BOOKING_INTERVAL_EXAMPLES,
  BOOKING_INTERVAL_OPTIONS,
  BOOKING_INTERVAL_SETTING_DESCRIPTION,
  BOOKING_INTERVAL_SETTING_LABEL,
  bookingIntervalLabel,
  normalizeBookingIntervalMinutes,
} from "@/lib/booking/interval";

type BookingIntervalFieldProps = {
  id?: string;
  name?: string;
  value?: number | null;
  defaultValue?: number | null;
  required?: boolean;
  /** When set, clarifies whether this control is a location override. */
  scope?: "business" | "location";
  businessIntervalMinutes?: number | null;
  showExamples?: boolean;
  className?: string;
};

export function BookingIntervalField({
  id = "appointment_interval_minutes",
  name = "appointment_interval_minutes",
  value,
  defaultValue,
  required = true,
  scope = "business",
  businessIntervalMinutes = null,
  showExamples = true,
  className,
}: BookingIntervalFieldProps) {
  const resolvedDefault = normalizeBookingIntervalMinutes(
    value ?? defaultValue,
  );
  const businessDefault = businessIntervalMinutes != null
    ? normalizeBookingIntervalMinutes(businessIntervalMinutes)
    : null;
  const isLocationOverride =
    scope === "location" &&
    businessDefault != null &&
    resolvedDefault !== businessDefault;

  return (
    <div className={className ?? "space-y-2"}>
      <Label htmlFor={id}>{BOOKING_INTERVAL_SETTING_LABEL}</Label>
      <Select
        id={id}
        name={name}
        defaultValue={String(resolvedDefault)}
        required={required}
        aria-describedby={`${id}-help`}
      >
        {BOOKING_INTERVAL_OPTIONS.map((minutes) => (
          <option key={minutes} value={minutes}>
            {bookingIntervalLabel(minutes)}
          </option>
        ))}
      </Select>
      <div id={`${id}-help`} className="space-y-1 text-xs text-muted-foreground">
        <p>{BOOKING_INTERVAL_SETTING_DESCRIPTION}</p>
        {scope === "location" ? (
          <p>
            {isLocationOverride ? (
              <>
                <span className="font-medium text-foreground">
                  Location override active.
                </span>{" "}
                Business default is {bookingIntervalLabel(businessDefault!)}.
                This change applies only to this location.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  Currently matching the business default
                  {businessDefault
                    ? ` (${bookingIntervalLabel(businessDefault)})`
                    : ""}
                  .
                </span>{" "}
                Changing this value creates a location override. It does not
                change the business default or other locations.
              </>
            )}
          </p>
        ) : (
          <p>
            Saving updates locations that still use the previous business
            default. Locations with their own override are left unchanged.
          </p>
        )}
        {showExamples ? (
          <ul className="list-disc space-y-0.5 pl-4">
            {BOOKING_INTERVAL_EXAMPLES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
