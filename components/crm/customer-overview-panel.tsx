"use client";

import type { CustomerHealthSummary } from "@/lib/crm/customer-health";
import { formatHealthMetric } from "@/lib/crm/customer-health";
import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-border/80 bg-background/60 px-3 py-2.5",
        emphasize && value !== "0" && value !== "Unavailable" && "border-amber-500/30",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums tracking-tight",
          value === "Unavailable" && "text-sm font-medium text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Customer overview health — derived directory facts only.
 * Chase insight card appears only when grounded observations exist.
 */
export function CustomerOverviewPanel({
  health,
}: {
  health: CustomerHealthSummary;
}) {
  return (
    <div className="space-y-3">
      <section
        className="rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-sm sm:p-4"
        aria-label="Customer overview"
      >
        <div className="mb-3">
          <h2 className="text-sm font-semibold tracking-tight">
            Customer overview
          </h2>
          <p className="text-xs text-muted-foreground">
            Counts from your customer directory. “Customers with balances due”
            counts customers, not appointments. Payments outstanding appointment
            balances counts appointments.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Active" value={formatHealthMetric(health.active)} />
          <Metric
            label="New this month"
            value={formatHealthMetric(health.newThisMonth)}
          />
          <Metric
            label="Returning this month"
            value={formatHealthMetric(health.returningThisMonth)}
          />
          <Metric
            label="Customers with balances due"
            value={formatHealthMetric(health.withBalances)}
            emphasize
          />
          <Metric label="VIP" value={formatHealthMetric(health.vip)} />
          <Metric
            label="Inactive"
            value={formatHealthMetric(health.inactive)}
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Avg spend: {formatHealthMetric(health.averageSpend)} —{" "}
          {health.averageSpend.kind === "unavailable"
            ? health.averageSpend.reason
            : null}
        </p>
      </section>

      {health.observations.length > 0 ? (
        <section
          className="rounded-[var(--radius-md)] border border-border bg-muted/15 px-3 py-3"
          aria-label="Chase observations"
        >
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Chase · grounded observations
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {health.observations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
