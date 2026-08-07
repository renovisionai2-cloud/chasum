"use client";

import { Button } from "@/components/ui/button";
import type { getBookingSheetCustomerSnapshot } from "@/lib/actions/booking-sheet";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Snapshot = NonNullable<
  Awaited<ReturnType<typeof getBookingSheetCustomerSnapshot>>
>;

type TimelineSectionProps = {
  appointment: AppointmentWithRelations | null | undefined;
  snapshot: Snapshot | null;
  loading: boolean;
  onLoadHistory: () => void;
};

export function TimelineSection({
  appointment,
  snapshot,
  loading,
  onLoadHistory,
}: TimelineSectionProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="min-h-11 text-xs text-muted-foreground"
          onClick={() => {
            setOpen(true);
            onLoadHistory();
          }}
        >
          View customer history
        </Button>
        {appointment?.customer_id ? (
          <Link
            href={`/dashboard/clients/${appointment.customer_id}`}
            className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            Open profile
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="bs-timeline-heading">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h3
            id="bs-timeline-heading"
            className="text-sm font-semibold tracking-tight"
          >
            Customer history
          </h3>
          <p className="text-xs text-muted-foreground">
            Secondary context — not required to confirm a booking
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="min-h-11"
          onClick={() => setOpen(false)}
        >
          Hide
        </Button>
      </div>

      {loading ? (
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Loading history…
        </p>
      ) : null}

      <ol className="space-y-3 border-l border-border pl-3 text-xs">
        {appointment ? (
          <li>
            <p className="font-medium">This appointment</p>
            <p className="text-muted-foreground">
              {format(parseISO(appointment.start_time), "EEE, MMM d")} ·{" "}
              {formatTime(parseISO(appointment.start_time))} –{" "}
              {formatTime(parseISO(appointment.end_time))} ·{" "}
              <span className="capitalize">
                {appointment.status.replace("_", " ")}
              </span>
            </p>
          </li>
        ) : (
          <li className="text-muted-foreground">
            Save the booking to start the appointment timeline.
          </li>
        )}

        {(snapshot?.historyPreview ?? []).map((row) => (
          <li key={row.id}>
            <p className="font-medium">{row.serviceName}</p>
            <p className="text-muted-foreground">
              {format(parseISO(row.start), "MMM d, yyyy")} ·{" "}
              <span className="capitalize">{row.status.replace("_", " ")}</span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
