"use client";

import { BookingSummaryCard } from "@/components/booking/booking-summary-card";

type SelectedAppointmentBannerProps = {
  startIso: string | null;
  durationMinutes: number;
  locationName: string | null;
  employeeName: string | null;
  timezone: string | null;
  slotConflict: string | null;
  serviceName?: string | null;
  customerName?: string | null;
};

export function SelectedAppointmentBanner({
  startIso,
  durationMinutes,
  locationName,
  employeeName,
  timezone,
  slotConflict,
  serviceName = null,
  customerName = null,
}: SelectedAppointmentBannerProps) {
  return (
    <BookingSummaryCard
      startIso={startIso}
      durationMinutes={durationMinutes}
      locationName={locationName}
      employeeName={employeeName}
      timezone={timezone}
      serviceName={serviceName}
      customerName={customerName}
      conflictMessage={slotConflict}
      emptyHint="Choose a date and time below, or click a slot on the calendar."
    />
  );
}
