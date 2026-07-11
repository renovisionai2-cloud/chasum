"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useState, useTransition } from "react";

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
};

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
}: SlotPickerProps) {
  const [loadingSlots, startTransition] = useTransition();
  const [slots, setSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!serviceId || !staffId || !date) {
      return;
    }

    let cancelled = false;

    startTransition(async () => {
      try {
        const available = await loadSlots(
          serviceId,
          staffId,
          date,
          excludeAppointmentId,
        );
        if (!cancelled) {
          setSlots(available);
        }
      } catch {
        if (!cancelled) {
          setSlots([]);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [serviceId, staffId, date, excludeAppointmentId, loadSlots]);

  const showEmpty = !loadingSlots && slots.length === 0;

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

      {loadingSlots ? (
        <p className="text-sm text-muted-foreground">Loading available times...</p>
      ) : showEmpty ? (
        <p className="text-sm text-muted-foreground">
          No available times for this date.
        </p>
      ) : (
        <div className="space-y-2">
          <Label>Available times</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  "rounded-lg border border-border px-2 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-accent/30",
                  selectedSlot === slot && "border-primary bg-accent",
                )}
              >
                {formatTime(parseISO(slot))}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
