"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page-header";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import type { Notification } from "@/lib/types/integrations";
import { formatDistanceToNow, parseISO } from "date-fns";

export function NotificationsCenter({
  notifications,
}: {
  notifications: Notification[];
}) {
  const refresh = useRefresh();
  const { toast } = useToast();

  async function handleMarkAll() {
    const result = await markAllNotificationsRead();
    toast(result.success ?? "Done.", "success");
    refresh();
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    refresh();
  }

  const unread = notifications.filter((n) => !n.read_at);

  return (
    <div className="space-y-4">
      {unread.length > 0 && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={handleMarkAll}>
            Mark all read ({unread.length})
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Appointment activity, waitlist updates, and system alerts will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`border-border/60 ${!n.read_at ? "border-primary/30 bg-accent/20" : ""}`}
            >
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                    {!n.read_at && " · Unread"}
                  </p>
                </div>
                {!n.read_at && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
