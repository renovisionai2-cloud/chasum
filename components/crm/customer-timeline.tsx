"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { CrmTimelineItem } from "@/lib/crm/types";
import { format } from "date-fns";
import {
  Ban,
  Bell,
  Calendar,
  CalendarX2,
  CircleDollarSign,
  FileText,
  History,
  Mail,
  MessageSquare,
  NotebookPen,
  Phone,
} from "lucide-react";
import Link from "next/link";

const ICONS = {
  appointment: Calendar,
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  note: NotebookPen,
  document: FileText,
  payment: CircleDollarSign,
  cancellation: Ban,
  no_show: CalendarX2,
  reminder: Bell,
  other: History,
} as const;

export function CustomerTimeline({
  items,
  onAddNote,
}: {
  items: CrmTimelineItem[];
  onAddNote?: () => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        variant="panel"
        glyph={History}
        title="No timeline activity yet"
        description="Appointments, notes, and payments will show up here after the first visit."
      >
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard/calendar"
            className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Book appointment
          </Link>
          {onAddNote ? (
            <Button type="button" size="sm" variant="outline" onClick={onAddNote}>
              Add note
            </Button>
          ) : null}
        </div>
      </EmptyState>
    );
  }

  return (
    <ul className="divide-y divide-border/80">
      {items.map((item) => {
        const Icon = ICONS[item.type] ?? History;
        return (
          <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                {item.status ? (
                  <span className="text-xs capitalize text-muted-foreground">
                    {item.status.replace(/_/g, " ")}
                  </span>
                ) : null}
              </div>
              {item.body ? (
                <p className="mt-0.5 line-clamp-3 text-sm text-muted-foreground">
                  {item.body}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {format(new Date(item.occurredAt), "MMM d, yyyy · h:mm a")}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
