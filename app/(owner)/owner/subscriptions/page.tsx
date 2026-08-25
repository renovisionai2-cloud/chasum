import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { OwnerPageFrame } from "@/components/owner/page-frame";
import { formatUsdFromCents } from "@/lib/owner/constants";
import { publicPlanName } from "@/lib/billing/private-alpha-plan";
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
      description="Plan mix and estimated recurring revenue at catalog list price. These figures are not collected payment."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Assigned paid-tier"
          value={String(metrics.paidBusinesses)}
          icon={CreditCard}
          description="Professional+ product plans — not collected revenue"
        />
        <StatCard
          title="Trials"
          value={String(metrics.trialBusinesses)}
          icon={CreditCard}
          accent="warning"
          description="Free trial tenants"
        />
        <StatCard
          title="Est. MRR at list price"
          value={metrics.mrrLabel}
          icon={CreditCard}
          accent="success"
          description="Catalog list price, not collected revenue"
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
                  <span className="font-medium">{publicPlanName(row.planKey)}</span>
                  <span className="text-muted-foreground">
                    {row.count} businesses · {formatUsdFromCents(row.mrrCents)}{" "}
                    list-price MRR
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
