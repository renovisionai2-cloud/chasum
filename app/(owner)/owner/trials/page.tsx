import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OwnerPageFrame } from "@/components/owner/page-frame";
import { listOwnerTrials } from "@/lib/owner/data";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner · Free Trials",
};

export default async function OwnerTrialsPage() {
  const trials = await listOwnerTrials();

  return (
    <OwnerPageFrame
      title="Free Trials"
      description="Businesses currently on a trial status or with an active trial end date."
    >
      {trials.length === 0 ? (
        <EmptyState
          glyph={Clock}
          title="No active trials"
          description="Trialing businesses will list here once trials are enabled on tenant records."
        />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {trials.map((biz) => (
              <div
                key={biz.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{biz.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {biz.subscription_plan_key ?? "starter"} · /{biz.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{biz.subscription_status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {biz.trial_ends_at
                      ? `Ends ${format(new Date(biz.trial_ends_at), "MMM d, yyyy")}`
                      : "No end date set"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </OwnerPageFrame>
  );
}
