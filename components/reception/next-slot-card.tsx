"use client";

import { BookingSection } from "@/components/booking/booking-section";
import { Button } from "@/components/ui/button";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import type { NextAvailableSlot } from "@/lib/actions/reception";
import { getNextAvailableSlot } from "@/lib/actions/reception";
import { format } from "date-fns";
import { Clock, RefreshCw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

export function NextSlotCard({
  onBookSlot,
}: {
  onBookSlot: (slot: NonNullable<NextAvailableSlot>) => void;
}) {
  const [slot, setSlot] = useState<NextAvailableSlot>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function load() {
    startTransition(async () => {
      const next = await getNextAvailableSlot({ daysAhead: 7 });
      setSlot(next);
      setLoaded(true);
      setConfirming(false);
    });
  }

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const next = await getNextAvailableSlot({ daysAhead: 7 });
      if (!cancelled) {
        setSlot(next);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BookingSection
      title="Need another time?"
      description="Next available opening across your schedule."
      collapsible
      defaultOpen={false}
    >
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={load}
          disabled={pending}
          aria-label="Refresh next available time"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
      {pending && !loaded ? (
        <p className="text-xs text-muted-foreground">Checking availability…</p>
      ) : !slot ? (
        <p className="rounded-[var(--radius-md)] border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          No open times found in the next week. Try another service or employee.
        </p>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-border/70 bg-muted/15 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Next available
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {format(parseISO(slot.start), "EEEE, MMM d")} at{" "}
            {formatTime(parseISO(slot.start))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {slot.serviceName} · {slot.staffName}
          </p>
          {confirming ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onBookSlot(slot);
                  setConfirming(false);
                }}
              >
                Use this time
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setConfirming(true)}
              >
                Use this time
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={load}
                disabled={pending}
              >
                View more options
              </Button>
            </div>
          )}
        </div>
      )}
    </BookingSection>
  );
}
