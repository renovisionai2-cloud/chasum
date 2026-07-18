import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getNotifications, getNotificationLogs } from "@/lib/actions/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await getOrCreateBusiness();
  const [notifications, logs] = await Promise.all([
    getNotifications(),
    getNotificationLogs(20),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Communications Platform — inbox, delivery status, and queue health for email and SMS."
      />
      <NotificationsCenter notifications={notifications} />
      {logs.length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Delivery log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex justify-between text-sm">
                  <span>{log.template_key} → {log.recipient}</span>
                  <span className="text-muted-foreground">{log.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
