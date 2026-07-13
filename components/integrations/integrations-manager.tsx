"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/icon-button";
import {
  connectAppleCalendar,
  connectGoogleCalendar,
  connectOutlookCalendar,
  disconnectCalendar,
  syncCalendarNow,
  toggleCalendarSync,
} from "@/lib/actions/integrations";
import { getAppUrl } from "@/lib/env";
import { confirmDelete, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { Calendar, RefreshCw, Trash2 } from "lucide-react";
import { useActionState } from "react";

type Connection = {
  id: string;
  provider: string;
  staff_id: string | null;
  calendar_name: string | null;
  sync_enabled: boolean;
  ics_secret: string | null;
  last_synced_at: string | null;
  staff: { name: string } | null;
};

export function IntegrationsManager({
  connections,
  staff,
}: {
  connections: Connection[];
  staff: { id: string; name: string }[];
}) {
  const refresh = useRefresh();
  const { toast } = useToast();
  const [appleState, appleAction, applePending] = useActionState(
    connectAppleCalendar,
    {},
  );

  async function handleDisconnect(id: string) {
    if (!(await confirmDelete("Disconnect this calendar?"))) return;
    const result = await disconnectCalendar(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Disconnected.", "success");
      refresh();
    }
  }

  async function handleSync(id: string) {
    const result = await syncCalendarNow(id);
    toast(result.success ?? "Sync queued.", "success");
    refresh();
  }

  async function handleToggle(id: string, enabled: boolean) {
    const result = await toggleCalendarSync(id, enabled);
    toast(result.success ?? "Updated.", "success");
    refresh();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Connect a calendar</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <form action={connectGoogleCalendar}>
            <input type="hidden" name="staff_id" value="" />
            <Button type="submit" variant="outline" className="h-auto w-full flex-col gap-2 py-6">
              <Calendar className="h-6 w-6" aria-hidden="true" />
              Google Calendar
            </Button>
          </form>
          <form action={connectOutlookCalendar}>
            <input type="hidden" name="staff_id" value="" />
            <Button type="submit" variant="outline" className="h-auto w-full flex-col gap-2 py-6">
              <Calendar className="h-6 w-6" aria-hidden="true" />
              Outlook Calendar
            </Button>
          </form>
          <form action={appleAction} className="space-y-2">
            <Button type="submit" variant="outline" className="h-auto w-full flex-col gap-2 py-6" disabled={applePending}>
              <Calendar className="h-6 w-6" aria-hidden="true" />
              Apple Calendar (.ics)
            </Button>
            {appleState.success && (
              <p className="text-xs text-success">{appleState.success}</p>
            )}
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Connected calendars</h2>
        {connections.length === 0 ? (
          <EmptyState
            variant="panel"
            title="No calendars connected"
            description="Connect Google, Outlook, or Apple Calendar to sync appointments and detect conflicts."
          />
        ) : (
          <div className="grid gap-3">
            {connections.map((conn) => (
              <Card key={conn.id} className="ds-card-interactive">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium capitalize">
                      {conn.provider} — {conn.calendar_name ?? "Calendar"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {conn.staff?.name ? `Staff: ${conn.staff.name}` : "Business-wide"}
                      {conn.last_synced_at && ` · Last synced ${new Date(conn.last_synced_at).toLocaleString()}`}
                    </p>
                    {conn.provider === "apple" && conn.ics_secret && (
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {getAppUrl()}/api/calendar/feed/{conn.ics_secret}.ics
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {conn.provider !== "apple" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggle(conn.id, !conn.sync_enabled)}
                        >
                          {conn.sync_enabled ? "Pause" : "Enable"}
                        </Button>
                        <IconButton label="Sync now" onClick={() => handleSync(conn.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </IconButton>
                      </>
                    )}
                    <IconButton label="Disconnect" className="text-destructive" onClick={() => handleDisconnect(conn.id)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {staff.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Per-staff connections</h2>
          <p className="text-sm text-muted-foreground">
            Connect a calendar for a specific staff member to sync their schedule individually.
          </p>
          <div className="flex flex-wrap gap-2">
            {staff.map((member) => (
              <form key={member.id} action={connectGoogleCalendar}>
                <input type="hidden" name="staff_id" value={member.id} />
                <Button type="submit" size="sm" variant="outline">
                  Google — {member.name}
                </Button>
              </form>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
