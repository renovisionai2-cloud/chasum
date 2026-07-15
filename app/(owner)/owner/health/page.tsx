import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OwnerPageFrame } from "@/components/owner/page-frame";
import { getOwnerOverviewMetrics } from "@/lib/owner/data";
import { Activity } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner · Platform Health",
};

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/70 py-2.5 text-sm last:border-0">
      <span>{label}</span>
      <Badge
        className={
          ok
            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        }
      >
        {ok ? "OK" : "Missing"}
      </Badge>
    </div>
  );
}

export default async function OwnerHealthPage() {
  const metrics = await getOwnerOverviewMetrics();
  const { checks } = metrics.systemHealth;

  return (
    <OwnerPageFrame
      title="Platform Health"
      description="Production dependency checks and recent platform alerts."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            System status ·{" "}
            {metrics.systemHealth.ok ? "Healthy" : "Needs attention"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CheckRow label="Supabase URL + anon key" ok={checks.supabase} />
          <CheckRow label="Service role key" ok={checks.serviceRole} />
          <CheckRow label="Resend (email)" ok={checks.email} />
          <CheckRow label="Cron secret" ok={checks.cronSecret} />
          <CheckRow label="Twilio SMS (optional)" ok={checks.sms} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentAlerts.length === 0 ? (
            <EmptyState
              variant="inline"
              glyph={Activity}
              title="No alerts"
              description="Apply migration 014 to enable platform_alerts."
            />
          ) : (
            <ul className="space-y-3">
              {metrics.recentAlerts.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-[var(--radius-md)] border border-border px-3 py-2.5"
                >
                  <p className="text-sm font-medium">{alert.title}</p>
                  {alert.body ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {alert.body}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {alert.severity} ·{" "}
                    {format(new Date(alert.created_at), "MMM d · h:mm a")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </OwnerPageFrame>
  );
}
