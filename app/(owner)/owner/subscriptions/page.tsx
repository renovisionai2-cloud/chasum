import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { OwnerPageFrame } from "@/components/owner/page-frame";
import { formatUsdFromCents } from "@/lib/owner/constants";
import { getOwnerOverviewMetrics } from "@/lib/owner/data";
import { CreditCard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner · Subscriptions",
};

export default async function OwnerSubscriptionsPage() {
  const metrics = await getOwnerOverviewMetrics();

  return (
    <OwnerPageFrame
      title="Subscriptions"
      description="Plan distribution and estimated recurring revenue by plan."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Paid"
          value={String(metrics.paidBusinesses)}
          icon={CreditCard}
          description="List-price paying businesses"
        />
        <StatCard
          title="Trials"
          value={String(metrics.trialBusinesses)}
          icon={CreditCard}
          accent="warning"
          description="Free trial tenants"
        />
        <StatCard
          title="Est. MRR"
          value={metrics.mrrLabel}
          icon={CreditCard}
          accent="success"
          description="From active paid plans"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By plan</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.planBreakdown.length === 0 ? (
            <EmptyState
              variant="inline"
              title="No subscriptions"
              description="Plan mix will populate as tenants sign up."
            />
          ) : (
            <ul className="divide-y divide-border">
              {metrics.planBreakdown.map((row) => (
                <li
                  key={row.planKey}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-medium capitalize">{row.planKey}</span>
                  <span className="text-muted-foreground">
                    {row.count} businesses · {formatUsdFromCents(row.mrrCents)}{" "}
                    MRR
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </OwnerPageFrame>
  );
}
