"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import type { CommunicationRecord } from "@/lib/communication/types";
import { format } from "date-fns";
import {
  Bell,
  Bot,
  Mail,
  MessageSquare,
  NotebookPen,
  Phone,
  Smartphone,
} from "lucide-react";

const CHANNEL_META: Record<
  string,
  { label: string; icon: typeof Phone }
> = {
  call: { label: "Call", icon: Phone },
  sms: { label: "SMS", icon: MessageSquare },
  email: { label: "Email", icon: Mail },
  push: { label: "Push", icon: Smartphone },
  whatsapp: { label: "WhatsApp", icon: MessageSquare },
  note: { label: "Note", icon: NotebookPen },
  reminder: { label: "Reminder", icon: Bell },
  ai: { label: "AI", icon: Bot },
};

export function CommunicationTimeline({
  items,
  emptyTitle = "No communications yet",
  emptyDescription = "Calls, texts, emails, and notes will appear here.",
}: {
  items: CommunicationRecord[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        variant="panel"
        glyph={MessageSquare}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="divide-y divide-border/80">
      {items.map((item) => {
        const meta = CHANNEL_META[item.channel] ?? CHANNEL_META.note;
        const Icon = meta.icon;
        return (
          <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{meta.label}</p>
                <Badge variant="outline" className="capitalize">
                  {item.status.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs capitalize text-muted-foreground">
                  {item.direction}
                </span>
              </div>
              {item.subject ? (
                <p className="truncate text-sm">{item.subject}</p>
              ) : null}
              {item.body ? (
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {item.body}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {format(new Date(item.createdAt), "MMM d, yyyy · h:mm a")}
                {item.recipient ? ` · ${item.recipient}` : ""}
                {item.provider ? ` · ${item.provider}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
