"use client";

import {
  AvailabilitySection,
  type AvailabilitySectionHandle,
} from "@/components/booking-sheet/availability-section";
import { DateField } from "@/components/ui/date-field";
import type { BookingSheetAvailability } from "@/lib/actions/booking-sheet";
import { forwardRef, useImperativeHandle, useRef } from "react";

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
 * Date and time as one decision — date control above availability (no empty side column).
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
  const availabilityRef = useRef<AvailabilitySectionHandle>(null);
  useImperativeHandle(ref, () => ({
    focusTimes: () => availabilityRef.current?.focusTimes(),
  }));

  return (
    <div className="space-y-3">
      <DateField
        id="bs-date"
        name="date"
        label="Date"
        value={date}
        min={minDate}
        onChange={onDateChange}
        onAfterSelect={() => {
          window.setTimeout(() => availabilityRef.current?.focusTimes(), 40);
        }}
      />
      <AvailabilitySection
        ref={availabilityRef}
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
