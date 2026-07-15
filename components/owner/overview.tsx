import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  OwnerErrorState,
  OwnerPageFrame,
} from "@/components/owner/page-frame";
import type { OwnerOverviewMetrics } from "@/lib/owner/data";
import { formatUsdFromCents } from "@/lib/owner/constants";
import { format } from "date-fns";
import {
  Activity,
  Building2,
  CircleDollarSign,
  Clock,
  CreditCard,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

function statusClass(status: string): string {
  if (status === "active") {
    return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
  }
  if (status === "trialing") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  if (status === "past_due" || status === "canceled") {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  return "";
}

function severityClass(severity: string): string {
  if (severity === "critical") {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  if (severity === "warning") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "";
}

export function OwnerOverview({ metrics }: { metrics: OwnerOverviewMetrics }) {
  return (
    <OwnerPageFrame
      title="Overview"
      description="Platform-wide snapshot for Chasum owners. Customer businesses never see this surface."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Businesses"
          value={String(metrics.totalBusinesses)}
          icon={Building2}
          href="/owner/businesses"
          description="All registered tenants"
        />
        <StatCard
          title="Active Businesses"
          value={String(metrics.activeBusinesses)}
          icon={Activity}
          accent="success"
          description="Active, trial, or past due"
        />
        <StatCard
          title="Trial Businesses"
          value={String(metrics.trialBusinesses)}
          icon={Clock}
          accent="warning"
          href="/owner/trials"
          description="Currently on a free trial"
        />
        <StatCard
          title="Paid Businesses"
          value={String(metrics.paidBusinesses)}
          icon={CreditCard}
          href="/owner/subscriptions"
          description="Paying list-price plans"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={metrics.mrrLabel}
          icon={CircleDollarSign}
          href="/owner/revenue"
          description="Estimated from list prices"
        />
        <StatCard
          title="Annual Recurring Revenue"
          value={metrics.arrLabel}
          icon={CircleDollarSign}
          accent="spark"
          href="/owner/revenue"
          description="MRR × 12"
        />
        <StatCard
          title="New Signups (7d)"
          value={String(metrics.newSignups7d)}
          icon={UserPlus}
          description={`${metrics.newSignups30d} in the last 30 days`}
        />
        <StatCard
          title="System Health"
          value={metrics.systemHealth.ok ? "Healthy" : "Attention"}
          icon={Activity}
          accent={metrics.systemHealth.ok ? "success" : "warning"}
          href="/owner/health"
          description="Core production dependencies"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Link
              href="/owner/businesses"
              className="text-xs font-medium text-primary hover:underline"
            >
              View businesses
            </Link>
          </CardHeader>
          <CardContent>
            {metrics.recentBusinesses.length === 0 ? (
              <EmptyState
                variant="inline"
                title="No businesses yet"
                description="New tenant signups will appear here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {metrics.recentBusinesses.map((biz) => (
                  <li
                    key={biz.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{biz.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        /{biz.slug} · {biz.subscription_plan_key ?? "starter"} ·{" "}
                        {format(new Date(biz.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={statusClass(biz.subscription_status)}>
                      {biz.subscription_status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent alerts</CardTitle>
            <Link
              href="/owner/health"
              className="text-xs font-medium text-primary hover:underline"
            >
              Platform health
            </Link>
          </CardHeader>
          <CardContent>
            {metrics.recentAlerts.length === 0 ? (
              <EmptyState
                variant="inline"
                title="No alerts"
                description="Platform alerts will show here once migration 014 is applied."
              />
            ) : (
              <ul className="space-y-3">
                {metrics.recentAlerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="rounded-[var(--radius-md)] border border-border px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <Badge className={severityClass(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    {alert.body ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {alert.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {format(new Date(alert.created_at), "MMM d · h:mm a")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan mix</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.planBreakdown.length === 0 ? (
            <EmptyState
              variant="inline"
              title="No plan data"
              description="Businesses will appear in the plan mix after signup."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium">Businesses</th>
                    <th className="pb-2 font-medium">Est. MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.planBreakdown.map((row) => (
                    <tr key={row.planKey} className="border-b border-border/60">
                      <td className="py-2.5 font-medium capitalize">
                        {row.planKey}
                      </td>
                      <td className="py-2.5 tabular-nums">{row.count}</td>
                      <td className="py-2.5 tabular-nums">
                        {formatUsdFromCents(row.mrrCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </OwnerPageFrame>
  );
}

export { OwnerErrorState };
