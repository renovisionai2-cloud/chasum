"use client";

import {
  AvailabilitySection,
  type AvailabilitySectionHandle,
} from "@/components/booking-sheet/availability-section";
import { DateField } from "@/components/ui/date-field";
import type { BookingSheetAvailability } from "@/lib/actions/booking-sheet";
import { forwardRef } from "react";

type BookingDatetimePanelProps = {
  date: string;
  minDate?: string;
  onDateChange: (date: string) => void;
  loading: boolean;
  availability: BookingSheetAvailability | null;
  selectedSlot: string | null;
  selectedSlotValid: boolean;
  unassigned?: boolean;
  onSelectSlot: (iso: string) => void;
  onPickStaff: (staffId: string) => void;
  onPickDay: (date: string) => void;
};

/**
 * Date and time as one decision — calendar beside availability on desktop.
 */
export const BookingDatetimePanel = forwardRef<
  AvailabilitySectionHandle,
  BookingDatetimePanelProps
>(function BookingDatetimePanel(
  {
    date,
    minDate,
    onDateChange,
    loading,
    availability,
    selectedSlot,
    selectedSlotValid,
    unassigned,
    onSelectSlot,
    onPickStaff,
    onPickDay,
  },
  ref,
) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)] md:items-start">
      <div className="space-y-2">
        <DateField
          id="bs-date"
          name="date"
          label="Date"
          value={date}
          min={minDate}
          onChange={onDateChange}
        />
        <p className="text-xs text-muted-foreground md:hidden">
          Available times update for the selected date.
        </p>
      </div>
      <AvailabilitySection
        ref={ref}
        loading={loading}
        availability={availability}
        selectedSlot={selectedSlot}
        selectedSlotValid={selectedSlotValid}
        unassigned={unassigned}
        workspaceMode
        onSelectSlot={onSelectSlot}
        onPickStaff={onPickStaff}
        onPickDay={onPickDay}
      />
    </div>
  );
});
