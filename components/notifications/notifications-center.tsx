"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import {
  archiveNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import type { Notification } from "@/lib/types/integrations";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useMemo, useState } from "react";

type Filter = "all" | "unread" | "archived";

export function NotificationsCenter({
  notifications,
}: {
  notifications: Notification[];
}) {
  const refresh = useRefresh();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<string>("all");

  async function handleMarkAll() {
    const result = await markAllNotificationsRead();
    toast(result.success ?? "Done.", "success");
    refresh();
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    refresh();
  }

  async function handleArchive(id: string) {
    await archiveNotification(id);
    refresh();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications.filter((n) => {
      const archived = Boolean(
        (n as Notification & { archived_at?: string | null }).archived_at,
      );
      const nPriority =
        (n as Notification & { priority?: string }).priority ?? "normal";

      if (filter === "unread" && (n.read_at || archived)) return false;
      if (filter === "archived" && !archived) return false;
      if (filter === "all" && archived) return false;
      if (priority !== "all" && nPriority !== priority) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
      );
    });
  }, [notifications, filter, query, priority]);

  const unread = notifications.filter(
    (n) =>
      !n.read_at &&
      !(n as Notification & { archived_at?: string | null }).archived_at,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications"
            aria-label="Search notifications"
          />
        </div>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter">
          {(
            [
              ["all", "Inbox"],
              ["unread", "Unread"],
              ["archived", "Archived"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={filter === key ? "primary" : "outline"}
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
              {key === "unread" ? ` (${unread.length})` : ""}
            </Button>
          ))}
        </div>
        <select
          className="h-9 rounded-[var(--radius-md)] border border-input bg-background px-2 text-sm"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Priority filter"
        >
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        {unread.length > 0 && filter !== "archived" ? (
          <Button size="sm" variant="outline" onClick={handleMarkAll}>
            Mark all read
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="spark"
          title="No notifications"
          description="Appointment activity, delivery alerts, and system messages appear here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const nPriority =
              (n as Notification & { priority?: string }).priority ?? "normal";
            const archived = Boolean(
              (n as Notification & { archived_at?: string | null }).archived_at,
            );
            return (
              <Card
                key={n.id}
                className={cn(
                  !n.read_at && !archived
                    ? "border-primary/30 bg-accent/20"
                    : "ds-card-interactive",
                )}
              >
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {nPriority}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {n.channel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(n.created_at), {
                        addSuffix: true,
                      })}
                      {!n.read_at && !archived ? " · Unread" : ""}
                      {archived ? " · Archived" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {!n.read_at && !archived ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        Mark read
                      </Button>
                    ) : null}
                    {!archived ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArchive(n.id)}
                      >
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
