"use client";

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

  function load() {
    startTransition(async () => {
      const next = await getNextAvailableSlot({ daysAhead: 7 });
      setSlot(next);
      setLoaded(true);
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
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="ds-section-title text-sm">Next available slot</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={load}
          disabled={pending}
          aria-label="Refresh next available slot"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
        </Button>
      </div>
      {pending && !loaded ? (
        <p className="text-xs text-muted-foreground">Checking real availability…</p>
      ) : !slot ? (
        <p className="rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          No open slots found in the next week from the scheduling engine.
        </p>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-border bg-card px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {format(parseISO(slot.start), "EEE, MMM d")} at{" "}
            {formatTime(parseISO(slot.start))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {slot.serviceName} · {slot.staffName}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-2 w-full"
            onClick={() => onBookSlot(slot)}
          >
            Book this slot
          </Button>
        </div>
      )}
    </section>
  );
}
