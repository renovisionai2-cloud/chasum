"use client";

import { AvailableTimeSelector } from "@/components/scheduling/available-time-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useEffect, useRef, useState, useTransition } from "react";

type SlotPickerProps = {
  serviceId: string;
  staffId: string;
  date: string;
  selectedSlot: string | null;
  onDateChange: (date: string) => void;
  onSelectSlot: (slot: string) => void;
  loadSlots: (
    serviceId: string,
    staffId: string,
    date: string,
    excludeAppointmentId?: string,
  ) => Promise<string[]>;
  excludeAppointmentId?: string;
  minDate?: string;
  selectedInvalidHint?: string | null;
};

function cacheKey(
  serviceId: string,
  staffId: string,
  date: string,
  exclude?: string,
) {
  return `${serviceId}|${staffId}|${date}|${exclude ?? ""}`;
}

export function SlotPicker({
  serviceId,
  staffId,
  date,
  selectedSlot,
  onDateChange,
  onSelectSlot,
  loadSlots,
  excludeAppointmentId,
  minDate = format(new Date(), "yyyy-MM-dd"),
  selectedInvalidHint = null,
}: SlotPickerProps) {
  const [loadingSlots, startTransition] = useTransition();
  const [slots, setSlots] = useState<string[]>([]);
  const cacheRef = useRef<Map<string, string[]>>(new Map());
  const requestId = useRef(0);

  useEffect(() => {
    if (!serviceId || !staffId || !date) {
      return;
    }

    const key = cacheKey(serviceId, staffId, date, excludeAppointmentId);
    const cached = cacheRef.current.get(key);
    if (cached) {
      setSlots(cached);
      return;
    }

    const id = ++requestId.current;
    startTransition(async () => {
      try {
        const available = await loadSlots(
          serviceId,
          staffId,
          date,
          excludeAppointmentId,
        );
        if (id !== requestId.current) return;
        cacheRef.current.set(key, available);
        setSlots(available);
      } catch {
        if (id !== requestId.current) return;
        setSlots([]);
      }
    });
  }, [serviceId, staffId, date, excludeAppointmentId, loadSlots]);

  const selectedStillValid =
    !selectedSlot || slots.some((s) => s.slice(0, 16) === selectedSlot.slice(0, 16));

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="appointment_date">Date</Label>
        <Input
          id="appointment_date"
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => onDateChange(e.target.value)}
          required
        />
      </div>

      <AvailableTimeSelector
        slots={slots.map((start) => ({ start }))}
        selectedStart={selectedSlot}
        onSelect={onSelectSlot}
        loading={loadingSlots}
        selectedInvalid={Boolean(selectedSlot && !selectedStillValid && !loadingSlots)}
        selectedInvalidHint={selectedInvalidHint}
        forceExpanded={Boolean(selectedSlot && !selectedStillValid && !loadingSlots)}
      />
    </div>
  );
}
