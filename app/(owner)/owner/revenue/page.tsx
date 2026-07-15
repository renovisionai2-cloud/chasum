import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { OwnerPageFrame } from "@/components/owner/page-frame";
import { formatUsdFromCents } from "@/lib/owner/constants";
import { getOwnerOverviewMetrics } from "@/lib/owner/data";
import { CircleDollarSign } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner · Revenue",
};

export default async function OwnerRevenuePage() {
  const metrics = await getOwnerOverviewMetrics();

  return (
    <OwnerPageFrame
      title="Revenue"
      description="Estimated recurring revenue from configured list prices. Stripe settlement will replace estimates once billing is wired."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Monthly Recurring Revenue"
          value={metrics.mrrLabel}
          icon={CircleDollarSign}
          description="Active paid plans only"
        />
        <StatCard
          title="Annual Recurring Revenue"
          value={metrics.arrLabel}
          icon={CircleDollarSign}
          accent="spark"
          description="MRR × 12"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contribution by plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.planBreakdown.map((row) => {
            const share =
              metrics.mrrCents > 0
                ? Math.round((row.mrrCents / metrics.mrrCents) * 100)
                : 0;
            return (
              <div key={row.planKey}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium capitalize">{row.planKey}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatUsdFromCents(row.mrrCents)} · {share}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
          {metrics.planBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No revenue yet — paid subscriptions will appear here.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </OwnerPageFrame>
  );
}
