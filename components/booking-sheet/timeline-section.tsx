"use client";

import { Button } from "@/components/ui/button";
import type { getBookingSheetCustomerSnapshot } from "@/lib/actions/booking-sheet";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import { format } from "date-fns";
import { Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";

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
  return (
    <section className="space-y-3" aria-labelledby="bs-timeline-heading">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h3
            id="bs-timeline-heading"
            className="text-sm font-semibold tracking-tight"
          >
            Timeline
          </h3>
          <p className="text-xs text-muted-foreground">
            Visit history and notes — load when you need them
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || !appointment?.customer_id}
          onClick={onLoadHistory}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          Load history
        </Button>
      </div>

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

        {snapshot ? (
          <li className="flex items-center gap-1.5 text-muted-foreground">
            <MessageSquare className="size-3.5" aria-hidden />
            {snapshot.communicationsCount} communication
            {snapshot.communicationsCount === 1 ? "" : "s"} on file
          </li>
        ) : null}

        <li className="text-muted-foreground">
          {appointment?.customer_id ? (
            <>
              Full customer history in{" "}
              <Link
                href={`/dashboard/clients/${appointment.customer_id}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                CRM
              </Link>
            </>
          ) : (
            "No previous activity for this appointment."
          )}
        </li>
      </ol>
    </section>
  );
}
