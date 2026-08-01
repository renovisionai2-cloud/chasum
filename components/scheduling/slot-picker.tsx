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
  /** Optional note when a previously selected time is no longer in the list. */
  selectedInvalidHint?: string | null;
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
  selectedInvalidHint = null,
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
  const selectedStillValid =
    !selectedSlot || slots.some((s) => s === selectedSlot);

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
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Loading available times...
        </p>
      ) : showEmpty ? (
        <p className="text-sm text-muted-foreground" role="status">
          No available times for this date.
        </p>
      ) : (
        <div className="space-y-2">
          <Label id="available-times-label">Available times</Label>
          <div
            role="listbox"
            aria-labelledby="available-times-label"
            className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 min-[520px]:grid-cols-4"
          >
            {slots.map((slot) => {
              const selected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSelectSlot(slot)}
                  className={cn(
                    "rounded-lg border border-border px-2 py-2.5 text-sm font-medium tabular-nums transition-colors hover:border-primary hover:bg-accent/30",
                    selected &&
                      "border-primary bg-accent ring-1 ring-primary/40",
                  )}
                >
                  {formatTime(parseISO(slot))}
                  {selected ? (
                    <span className="sr-only"> (selected)</span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {!selectedStillValid && selectedSlot ? (
            <p className="text-[11px] text-amber-800 dark:text-amber-200" role="status">
              {selectedInvalidHint ??
                "The previously selected time is no longer available for this service, employee, or date. Choose another time."}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
