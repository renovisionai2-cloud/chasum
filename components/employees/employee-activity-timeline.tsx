"use client";

import { EmptyState } from "@/components/ui/empty-state";
import type { StaffActivityEvent } from "@/lib/employees/types";
import { format } from "date-fns";
import { History } from "lucide-react";

export function EmployeeActivityTimeline({
  events,
}: {
  events: StaffActivityEvent[];
}) {
  if (events.length === 0) {
    return (
      <EmptyState
        variant="panel"
        glyph={History}
        title="No activity yet"
        description="Profile updates, documents, schedule changes, and future time-clock events appear here."
      />
    );
  }

  return (
    <ul className="space-y-0 divide-y divide-border/80">
      {events.map((event) => (
        <li key={event.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{event.title}</p>
              {event.body ? (
                <p className="mt-0.5 line-clamp-3 text-sm text-muted-foreground">
                  {event.body}
                </p>
              ) : null}
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {event.event_type.replace(/_/g, " ")}
              </p>
            </div>
            <time className="shrink-0 text-xs text-muted-foreground">
              {format(new Date(event.created_at), "MMM d, yyyy · h:mm a")}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}
