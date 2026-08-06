import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { WeekBars } from "@/components/ui/chart";
import { getCommandCentreSnapshot } from "@/lib/actions/command-centre";
import { formatAppointmentEmailClock } from "@/lib/communications/appointment-datetime";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  DollarSign,
  Plus,
  Sun,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

function paymentReadinessLabel(status: string | null): string | null {
  if (!status) return null;
  if (status === "fully_paid") return "Paid";
  if (status === "deposit_paid" || status === "partially_paid") {
    return "Balance due";
  }
  if (status === "deposit_required" || status === "unpaid") {
    return "Payment due";
  }
  return null;
}

export async function CommandCentre() {
  const snapshot = await getCommandCentreSnapshot();
  const setupDone = snapshot.setupComplete;

  const eyebrowParts = [snapshot.dateLabel];
  if (snapshot.scopeLabel) eyebrowParts.push(snapshot.scopeLabel);

  return (
    <div className="ds-page">
      <PageHeader
        eyebrow={eyebrowParts.join(" · ")}
        title={`${snapshot.greeting}, ${snapshot.firstName}`}
        description={snapshot.dailySummary}
      >
        <div className="flex flex-wrap gap-2">
          {setupDone ? (
            <>
              <Link href="/dashboard/calendar?view=day&book=1">
                <Button className="min-h-[var(--touch-min)]">
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  New appointment
                </Button>
              </Link>
              <Link href="/dashboard/calendar?view=day">
                <Button variant="outline" className="min-h-[var(--touch-min)]">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Reception
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/dashboard/business">
              <Button className="min-h-[var(--touch-min)]">Finish setup</Button>
            </Link>
          )}
        </div>
      </PageHeader>

      <p className="ds-caption -mt-2">
        {snapshot.businessName}
        {snapshot.scopeMode === "all"
          ? " · Appointment metrics respect location filter; payments are business-wide"
          : snapshot.scopeLabel
            ? ` · Viewing ${snapshot.scopeLabel}`
            : null}
      </p>

      <section aria-label="Priority status">
        {snapshot.attention.length === 0 ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-success/25 bg-success/10 px-3.5 py-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>No urgent items — nothing needs attention right now.</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-foreground">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-warning"
              aria-hidden="true"
            />
            <span>
              <strong className="font-medium">
                {snapshot.attention.length === 1
                  ? "1 item needs attention"
                  : `${snapshot.attention.length} items need attention`}
              </strong>
              <span className="text-muted-foreground">
                {" "}
                — see Attention required below.
              </span>
            </span>
          </div>
        )}
      </section>

      {!setupDone ? (
        <SetupChecklist
          steps={snapshot.setupSteps}
          bookingPath={`/book/${snapshot.bookingSlug}`}
        />
      ) : null}

      <section aria-labelledby="cc-glance-heading">
        <h2 id="cc-glance-heading" className="ds-section-title mb-3">
          Today at a glance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Appointments today"
            value={
              snapshot.appointmentsToday == null
                ? "Unavailable"
                : snapshot.appointmentsToday.toString()
            }
            description="Non-cancelled visits starting today (business timezone)"
            icon={Calendar}
            href="/dashboard/calendar?view=day"
            accent="primary"
          />
          <StatCard
            title="Payments collected today"
            value={
              snapshot.paymentsCollectedTodayAvailable
                ? (snapshot.paymentsCollectedTodayLabel ?? "—")
                : snapshot.loadErrors.includes("payments")
                  ? "Unavailable"
                  : "No data yet"
            }
            description="Succeeded deposits and payments by transaction time"
            icon={DollarSign}
            href="/dashboard/payments"
            accent="success"
          />
          <StatCard
            title="Outstanding actions"
            value={snapshot.outstandingActionsCount.toString()}
            description="Items in Attention required"
            icon={AlertTriangle}
            href="/dashboard#cc-attention"
            accent="warning"
          />
          <StatCard
            title="New customers"
            value={
              snapshot.newCustomersThisMonth == null
                ? "Unavailable"
                : snapshot.newCustomersThisMonth.toString()
            }
            description="Created this month (business-wide)"
            icon={Users}
            href="/dashboard/clients"
            accent="spark"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3 scroll-mt-24" id="cc-attention">
          <CardHeader>
            <CardTitle>Attention required</CardTitle>
            <CardDescription>
              Actionable items from live operations — not a full activity log
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.attention.length === 0 ? (
              <EmptyState
                variant="panel"
                glyph={CheckCircle2}
                title="You're clear"
                description="No payment follow-ups, failed messages, or schedule gaps need action right now."
              />
            ) : (
              <ul className="space-y-3">
                {snapshot.attention.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group block rounded-[var(--radius-md)] border border-border bg-muted/20 p-3.5 transition-colors hover:border-primary/35 hover:bg-accent/30 ds-focus-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.why}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-[var(--radius-sm)] border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {item.status}
                        </span>
                      </div>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        Open
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <div>
            <h2 className="ds-section-title">Quick actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real workflows only
            </p>
          </div>
          <div className="grid gap-3">
            {[
              {
                label: "New appointment",
                href: "/dashboard/calendar?view=day&book=1",
                icon: CalendarPlus,
              },
              {
                label: "New customer",
                href: "/dashboard/clients",
                icon: UserPlus,
              },
              {
                label: "Record payment",
                href: "/dashboard/payments",
                icon: DollarSign,
              },
              {
                label: "Open Reception",
                href: "/dashboard/calendar?view=day",
                icon: Calendar,
              },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex min-h-[var(--touch-min)] items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card p-3.5 shadow-xs transition-colors hover:border-primary/35 ds-focus-ring"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent text-primary">
                  <action.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-semibold">
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Today&apos;s schedule</CardTitle>
            <CardDescription>
              Chronological · {snapshot.timezone.replace(/_/g, " ")}
            </CardDescription>
          </div>
          <Link href="/dashboard/calendar?view=day">
            <Button variant="outline" size="sm">
              Open calendar
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {snapshot.schedule.length === 0 ? (
            <EmptyState
              variant="panel"
              glyph={Calendar}
              title="No appointments today"
              description="Your schedule is clear in this location scope."
            >
              <Link href="/dashboard/calendar?view=day&book=1">
                <Button size="sm">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Book appointment
                </Button>
              </Link>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border/80">
              {snapshot.schedule.map((appt) => {
                const ready = paymentReadinessLabel(appt.payment_status);
                const clock = formatAppointmentEmailClock(appt.start_time, {
                  businessTimezone: snapshot.timezone,
                });
                return (
                  <li key={appt.id}>
                    <Link
                      href="/dashboard/calendar?view=day"
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 ds-focus-ring rounded-[var(--radius-sm)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-primary">
                          {clock}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {appt.customer?.name ?? "Customer"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {appt.service?.name ?? "Service"}
                            {appt.location?.name
                              ? ` · ${appt.location.name}`
                              : ""}
                            {" · "}
                            {appt.staff?.name ?? "Unassigned"}
                            {ready ? ` · ${ready}` : ""}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={appt.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" aria-hidden="true" />
              <div>
                <CardTitle>Summer</CardTitle>
                <CardDescription>
                  AI Business Manager · Early Access — observed facts only
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {snapshot.summer.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No factual summary available yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {snapshot.summer.map((fact, i) => (
                  <li key={`${fact.kind}-${i}`} className="text-sm">
                    <span className="ds-caption mr-2 uppercase">
                      {fact.kind === "fact" ? "Fact" : "Suggestion"}
                    </span>
                    <span className="text-foreground">{fact.text}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/ai-workforce/summer"
              className="mt-4 inline-flex rounded-[var(--radius-sm)] text-sm font-medium text-primary ds-focus-ring"
            >
              Open Summer
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>This week&apos;s bookings</CardTitle>
            <CardDescription>
              Active appointments by business-local day (not a prior-period
              comparison)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.weekDayCounts.every((d) => d.value === 0) ? (
              <EmptyState
                variant="panel"
                glyph={Calendar}
                title="Quiet week so far"
                description="Bookings will appear as they are scheduled."
              />
            ) : (
              <WeekBars data={snapshot.weekDayCounts} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Secondary to today&apos;s priorities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snapshot.recentActivity.length === 0 ? (
            <EmptyState
              variant="inline"
              glyph={Users}
              icon="none"
              title="No recent activity"
              description="Bookings, customers, and payments will show here."
            />
          ) : (
            <ul className="divide-y divide-border/80">
              {snapshot.recentActivity.map((row) => (
                <li key={row.id}>
                  <Link
                    href={row.href}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 ds-focus-ring rounded-[var(--radius-sm)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.detail}
                      </p>
                    </div>
                    <span className="ds-caption shrink-0 capitalize">
                      {row.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
