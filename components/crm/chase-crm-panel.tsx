import Link from "next/link";
import type { ChaseCrmAnalytics } from "@/lib/crm/ai-knowledge";

export function ChaseCrmPanel({ analytics }: { analytics: ChaseCrmAnalytics }) {
  return (
    <section
      className="rounded-[var(--radius-md)] border border-border bg-muted/15 p-4"
      aria-label="Chase CRM analytics"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Chase</h2>
        <p className="text-xs text-muted-foreground">
          Read-only retention signals
        </p>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Metric
          label="Active"
          value={String(analytics.retention.activeCustomers)}
        />
        <Metric label="VIP" value={String(analytics.retention.vipCount)} />
        <Metric
          label="Repeat rate"
          value={`${analytics.retention.repeatBookingRate}%`}
        />
        <Metric
          label="Avg spend"
          value={`$${analytics.retention.averageLifetimeSpend.toFixed(0)}`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <List
          title="Overdue follow-up"
          empty="None overdue"
          items={analytics.overdueFollowUp.map((c) => ({
            id: c.id,
            label: c.name,
            detail: `${c.daysSince}d`,
          }))}
        />
        <List
          title="High value"
          empty="No high-value signals yet"
          items={analytics.highValue.map((c) => ({
            id: c.id,
            label: c.name,
            detail: `$${c.lifetimeSpend.toFixed(0)}`,
          }))}
        />
        <List
          title="Inactive"
          empty="No inactive customers"
          items={analytics.inactive.map((c) => ({
            id: c.id,
            label: c.name,
            detail: c.lastActivity?.slice(0, 10) ?? "—",
          }))}
        />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function List({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; label: string; detail: string }>;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <Link
                href={`/dashboard/clients/${item.id}`}
                className="truncate font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </Link>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
