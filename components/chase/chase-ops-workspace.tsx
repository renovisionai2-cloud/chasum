import type { ReactNode } from "react";
import type { ChaseOperationsSnapshot, ChasePriority } from "@/lib/chase/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

const PRIORITY_STYLES: Record<ChasePriority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/25",
  low: "bg-muted text-muted-foreground border-border",
};

function money(n: number) {
  return `$${n.toFixed(n >= 100 ? 0 : 2)}`;
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border/80 bg-background px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3" aria-labelledby={title.replace(/\s+/g, "-")}>
      <div>
        <h2
          id={title.replace(/\s+/g, "-")}
          className="text-sm font-semibold tracking-tight"
        >
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ChaseOpsWorkspace({
  snapshot,
}: {
  snapshot: ChaseOperationsSnapshot;
}) {
  const { kpis } = snapshot;

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-lg)] border border-border bg-gradient-to-br from-muted/40 via-background to-background p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Chase</h2>
              <p className="text-sm text-muted-foreground">
                AI Operations Manager for {snapshot.businessName} · recommends
                only — owners decide
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Updated {format(new Date(snapshot.generatedAt), "MMM d · h:mm a")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/reports"
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Full reports
            </Link>
            <Link
              href="/dashboard/ai-workforce/summer"
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open Summer
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="Today's revenue"
            value={money(kpis.todayRevenue)}
            hint={
              kpis.revenueWeekDeltaPct != null
                ? `Week ${kpis.revenueWeekDeltaPct >= 0 ? "+" : ""}${kpis.revenueWeekDeltaPct}% vs prior`
                : undefined
            }
          />
          <Metric
            label="Today's appointments"
            value={String(kpis.todayAppointments)}
          />
          <Metric
            label="Bookings this week"
            value={String(kpis.weekBookings)}
          />
          <Metric
            label="Staff utilization"
            value={
              kpis.staffUtilizationPct != null
                ? `${kpis.staffUtilizationPct}%`
                : "—"
            }
          />
          <Metric
            label="Available capacity"
            value={String(kpis.availableCapacitySlots)}
            hint="Open slots (engine)"
          />
          <Metric label="No-shows" value={String(kpis.noShows)} />
          <Metric
            label="Cancellation rate"
            value={
              kpis.cancellationRatePct != null
                ? `${kpis.cancellationRatePct}%`
                : "—"
            }
          />
          <Metric
            label="Repeat customer rate"
            value={
              kpis.repeatCustomerRatePct != null
                ? `${kpis.repeatCustomerRatePct}%`
                : "—"
            }
          />
          <Metric
            label="Avg booking value"
            value={money(kpis.averageBookingValue)}
          />
          <Metric
            label="Unconfirmed"
            value={String(snapshot.pendingConfirmations)}
          />
        </div>
      </div>

      <Section
        title="Commerce"
        description="Payments ledger — Chase recommends collection, never charges."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Revenue today"
            value={money(snapshot.commerce.revenueTodayCents / 100)}
          />
          <Metric
            label="Revenue this week"
            value={money(snapshot.commerce.revenueWeekCents / 100)}
          />
          <Metric
            label="Revenue this month"
            value={money(snapshot.commerce.revenueMonthCents / 100)}
          />
          <Metric
            label="Avg transaction"
            value={
              snapshot.commerce.averageTransactionCents != null
                ? money(snapshot.commerce.averageTransactionCents / 100)
                : "—"
            }
          />
          <Metric
            label="Outstanding invoices"
            value={money(snapshot.commerce.outstandingInvoicesCents / 100)}
          />
          <Metric
            label="Outstanding deposits"
            value={money(snapshot.commerce.outstandingDepositsCents / 100)}
          />
          <Metric
            label="Refunds (month)"
            value={money(snapshot.commerce.refundsTrendCents / 100)}
          />
          <Metric
            label="Avg customer value"
            value={
              snapshot.commerce.averageCustomerValueCents != null
                ? money(snapshot.commerce.averageCustomerValueCents / 100)
                : "—"
            }
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          <Link
            href="/dashboard/payments"
            className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open Payments
          </Link>{" "}
          to collect, invoice, or refund.
        </p>
      </Section>

      <Section
        title="Communications"
        description="Delivery health — Chase monitors, never sends."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric
            label="Sent today"
            value={String(snapshot.communications.sentToday)}
          />
          <Metric
            label="Failed today"
            value={String(snapshot.communications.failedToday)}
          />
          <Metric
            label="Delivery success"
            value={
              snapshot.communications.deliverySuccessRate != null
                ? `${snapshot.communications.deliverySuccessRate}%`
                : "—"
            }
          />
          <Metric
            label="SMS failures"
            value={String(snapshot.communications.smsFailures)}
          />
          <Metric
            label="Queued / unsent"
            value={String(snapshot.communications.unsentQueued)}
          />
          <Metric
            label="Fail rate"
            value={
              snapshot.communications.bounceOrFailRate != null
                ? `${snapshot.communications.bounceOrFailRate}%`
                : "—"
            }
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          <Link
            href="/dashboard/notifications"
            className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open Notification Center
          </Link>
        </p>
      </Section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Section
          title="Insights"
          description="Prioritized recommendations from real data."
        >
          <ul className="space-y-2">
            {snapshot.insights.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-md)] border border-border bg-background p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      PRIORITY_STYLES[item.priority],
                    )}
                  >
                    {item.priority}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.category}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Alerts" description="Grounded in calendar and CRM.">
          {snapshot.alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active alerts.</p>
          ) : (
            <ul className="space-y-2">
              {snapshot.alerts.map((alert) => (
                <li
                  key={alert.id}
                  className={cn(
                    "flex gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm",
                    alert.severity === "critical"
                      ? "border-destructive/30 bg-destructive/5"
                      : alert.severity === "warning"
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-border bg-background",
                  )}
                >
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.body}</p>
                    {alert.when ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {format(new Date(alert.when), "MMM d, yyyy")}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {snapshot.upcomingClosures.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Upcoming closures
              </p>
              <ul className="space-y-1.5">
                {snapshot.upcomingClosures.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      </div>

      <Section
        title="Summer activity (today)"
        description="Operational events from the Booking Engine change log."
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric
            label="Completed visits"
            value={String(snapshot.summer.bookingsCompleted)}
          />
          <Metric label="Creates" value={String(snapshot.summer.creates)} />
          <Metric
            label="Reschedules"
            value={String(snapshot.summer.reschedules)}
          />
          <Metric
            label="Cancellations"
            value={String(snapshot.summer.cancellations)}
          />
        </div>
        <p className="text-xs text-muted-foreground">{snapshot.summer.note}</p>
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Customer analytics" description="CRM + reports.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric
              label="New customers"
              value={String(snapshot.customers.newCustomers)}
            />
            <Metric
              label="Returning"
              value={String(snapshot.customers.returningCustomers)}
            />
            <Metric
              label="Retention"
              value={`${snapshot.customers.retentionRatePct}%`}
            />
            <Metric
              label="Lifetime value (avg)"
              value={money(snapshot.customers.lifetimeValueAvg)}
            />
          </div>
          {snapshot.customers.overdueFollowUp.length > 0 ? (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Users className="size-3.5" aria-hidden /> Overdue follow-up
              </p>
              <ul className="space-y-1">
                {snapshot.customers.overdueFollowUp.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex justify-between gap-2 text-sm">
                    <Link
                      href={`/dashboard/clients/${c.id}`}
                      className="truncate font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {c.name}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {c.daysSince}d
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        <Section title="Employee analytics" description="Utilization signals.">
          {snapshot.employees.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No employee production data in range.
            </p>
          ) : (
            <ul className="divide-y divide-border/80 rounded-[var(--radius-md)] border border-border">
              {snapshot.employees.rows.slice(0, 8).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {e.name}
                      {e.overtimeWarning ? (
                        <span className="ml-2 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300">
                          Watch load
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.completed} completed · {money(e.revenue)}
                      {e.averageServiceMinutes
                        ? ` · avg ${e.averageServiceMinutes}m`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {e.utilizationPct != null ? `${e.utilizationPct}%` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Booking analytics" description="Peaks and popularity.">
        <div className="grid gap-6 lg:grid-cols-3">
          <ListBlock
            title="Peak hours"
            items={snapshot.bookings.peakHours.map(
              (p) => `${p.label} · ${p.value}`,
            )}
          />
          <ListBlock
            title="Quiet hours"
            items={snapshot.bookings.quietHours.map(
              (p) => `${p.label} · ${p.value}`,
            )}
          />
          <ListBlock
            title="Busy days"
            items={snapshot.bookings.busyDays.map(
              (p) => `${p.label} · ${p.value}`,
            )}
          />
          <ListBlock
            title="Popular services"
            items={snapshot.bookings.popularServices.map(
              (p) => `${p.label} · ${p.value}`,
            )}
          />
          <ListBlock
            title="Popular employees"
            items={snapshot.bookings.popularEmployees.map(
              (p) => `${p.label} · ${money(p.value)}`,
            )}
          />
          <div className="rounded-[var(--radius-md)] border border-border bg-background p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Booking lead time
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {snapshot.bookings.bookingLeadTimeDaysAvg != null
                ? `${snapshot.bookings.bookingLeadTimeDaysAvg} days avg`
                : "Not computed yet — Chase will not estimate unavailable metrics."}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CircleDollarSign className="size-3.5" aria-hidden />
              Completed {snapshot.bookings.completed} · Cancelled{" "}
              {snapshot.bookings.cancelled} · No-shows{" "}
              {snapshot.bookings.noShows}
            </p>
          </div>
        </div>
      </Section>

      <section
        className="rounded-[var(--radius-md)] border border-dashed border-border bg-muted/20 px-4 py-3"
        aria-label="Forecasting extension points"
      >
        <p className="text-xs font-medium">Forecasting (extension points)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Revenue, capacity, staff demand, and seasonal models are reserved (
          provider: {snapshot.forecast.provider}). No prediction models run
          today — Chase never invents forecasts.
        </p>
      </section>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {items.slice(0, 6).map((item) => (
            <li key={item} className="text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
