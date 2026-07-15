import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OwnerPageFrame } from "@/components/owner/page-frame";
import { requirePlatformOwner } from "@/lib/owner/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { LifeBuoy } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner · Support",
};

export default async function OwnerSupportPage() {
  await requirePlatformOwner();
  const service = createServiceClient();
  const { data: failed } = await service
    .from("notification_logs")
    .select("id, channel, recipient, template_key, error_message, created_at")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(25);

  const rows = failed ?? [];

  return (
    <OwnerPageFrame
      title="Support"
      description="Operational signals that often surface as support cases — failed notification deliveries first."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Failed deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              variant="inline"
              glyph={LifeBuoy}
              title="Inbox clear"
              description="No failed email/SMS deliveries in the notification log. Dedicated ticket queues will land in a later phase."
            />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.id as string} className="py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {(row.template_key as string) ?? "notification"} ·{" "}
                      {row.channel as string}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(row.created_at as string),
                        "MMM d · h:mm a",
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    To {row.recipient as string}
                    {row.error_message
                      ? ` — ${row.error_message as string}`
                      : ""}
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
