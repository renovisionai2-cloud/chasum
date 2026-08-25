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
import { getCommandCentreSnapshot } from "@/lib/actions/command-centre";
import { formatAppointmentEmailClock } from "@/lib/communications/appointment-datetime";
import { formatMoneyCents } from "@/lib/commerce/money";
import { receptionHref } from "@/lib/dashboard/command-centre";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  DollarSign,
  Sun,
  UserPlus,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export async function CommandCentre() {
  const snapshot = await getCommandCentreSnapshot();
  const setupDone = snapshot.setupComplete;
  const money = snapshot.money;

  return (
    <div className="ds-page">
      <PageHeader
        eyebrow={`${snapshot.dateLabel} · ${snapshot.appointmentScopeLabel}`}
        title={`${snapshot.greeting}, ${snapshot.firstName}`}
        description={snapshot.dailySummary}
      >
        {setupDone ? (
          <>
            <Link href={`${snapshot.receptionHref}&book=1`}>
              <Button className="min-h-[var(--touch-min)]">
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                New appointment
              </Button>
            </Link>
            <Link href={snapshot.receptionHref}>
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
      </PageHeader>

      <p className="ds-caption -mt-2">
        {snapshot.businessName}
        {" · "}
        Schedule: {snapshot.appointmentScopeLabel}
        {" · "}
        {snapshot.moneyScopeCaption}
      </p>

      {!setupDone ? (
        <SetupChecklist
          steps={snapshot.setupSteps}
          bookingPath={`/book/${snapshot.businessSlug}`}
        />
      ) : null}

      <section aria-label="Today" className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle>Next appointment</CardTitle>
            <CardDescription>
              {snapshot.appointmentScopeLabel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.nextAppointment ? (
              <Link
                href={snapshot.nextAppointmentHref}
                className="group block rounded-[var(--radius-md)] border border-border p-4 transition-colors hover:border-primary/35 hover:bg-accent/20 ds-focus-ring"
              >
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {snapshot.nextAppointmentClock}
                </p>
                <p className="mt-2 truncate font-medium">
                  {snapshot.nextAppointment.customerName ?? "Client"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {snapshot.nextAppointment.serviceName ?? "Service"}
                  {snapshot.nextAppointment.staffName
                    ? ` · ${snapshot.nextAppointment.staffName}`
                    : ""}
                </p>
                <div className="mt-3">
                  <StatusBadge status={snapshot.nextAppointment.status} />
                </div>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  View in Reception
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </p>
              </Link>
            ) : (
              <EmptyState
                variant="panel"
                glyph={Calendar}
                title="No upcoming appointment today"
                description="The rest of today’s active schedule is clear from now on."
              >
                <Link href={snapshot.receptionHref}>
                  <Button size="sm" variant="outline">
                    Open Reception
                  </Button>
                </Link>
              </EmptyState>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Today’s schedule</CardTitle>
              <CardDescription>
                {snapshot.appointmentsToday === 1
                  ? "1 active appointment"
                  : `${snapshot.appointmentsToday} active appointments`}
                {" · "}
                cancelled and no-shows are not in this list
              </CardDescription>
            </div>
            <Link href={snapshot.receptionHref}>
              <Button variant="outline" size="sm" className="min-h-[var(--touch-min)]">
                Reception
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {snapshot.schedule.length === 0 ? (
              <EmptyState
                variant="panel"
                glyph={Calendar}
                title="No appointments today"
                description="Your active schedule is clear for this business day."
              >
                <Link href={snapshot.receptionHref}>
                  <Button size="sm">
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Schedule
                  </Button>
                </Link>
              </EmptyState>
            ) : (
              <ul className="divide-y divide-border/80">
                {snapshot.schedule.map((appt) => {
                  const href = receptionHref({
                    dateYmd: calendarDateInTimezone(
                      appt.start_time,
                      snapshot.timezone,
                    ),
                    appointmentId: appt.id,
                  });
                  return (
                    <li key={appt.id}>
                      <Link
                        href={href}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 ds-focus-ring rounded-[var(--radius-sm)]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-primary">
                            {formatAppointmentEmailClock(
                              appt.start_time,
                              snapshot.timezone,
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {appt.customerName ?? "Client"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {appt.serviceName ?? "Service"}
                              {appt.staffName ? ` · ${appt.staffName}` : ""}
                              {snapshot.appointmentScopeMode === "all" &&
                              appt.locationName
                                ? ` · ${appt.locationName}`
                                : ""}
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
      </section>

      <section aria-label="Attention" className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>
              Only items supported by live records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.attention.length === 0 ? (
              <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-success/25 bg-success/10 px-3.5 py-3 text-sm text-success">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Nothing needs attention</p>
                  <p className="mt-0.5 text-success/90">
                    No pending confirmations, cancellations, or recorded balances
                    requiring action.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {snapshot.attention.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-muted/20 p-3.5 transition-colors hover:border-primary/35 hover:bg-accent/30 ds-focus-ring"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {item.detail}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                        {item.actionLabel}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
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
              {setupDone
                ? "The usual next steps"
                : "Finish setup first — then day-to-day ops live here"}
            </p>
          </div>
          <div className="grid gap-3">
            {(setupDone
              ? [
                  {
                    label: "New appointment",
                    description: "Book a visit on the calendar",
                    href: `${snapshot.receptionHref}&book=1`,
                    icon: CalendarPlus,
                  },
                  {
                    label: "New customer",
                    description: "Create or update a client record",
                    href: "/dashboard/clients",
                    icon: UserPlus,
                  },
                  {
                    label: "Payments / outstanding",
                    description: "Collected cash and open balances",
                    href: "/dashboard/payments",
                    icon: DollarSign,
                  },
                ]
              : snapshot.setupSteps
                  .filter((step) => !step.done)
                  .slice(0, 3)
                  .map((step) => ({
                    label: step.label,
                    description: step.description,
                    href: step.href,
                    icon: Calendar,
                  }))
            ).map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex min-h-[5.5rem] items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:border-primary/35 hover:shadow-md ds-focus-ring"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent text-primary">
                  <action.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {action.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Money" className="space-y-3">
        <div>
          <h2 className="ds-section-title">Money</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {snapshot.moneyScopeCaption} Gross payments collected is cash in,
            not recognized visit revenue.
          </p>
        </div>
        {money.available ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Gross payments collected today"
              value={formatMoneyCents(money.collectedTodayCents, snapshot.currency)}
              description={
                money.collectedTodayCents === 0
                  ? "No succeeded payments recorded for this business day"
                  : "Succeeded payments and deposits recorded today"
              }
              icon={DollarSign}
              href="/dashboard/payments"
              accent="success"
            />
            <StatCard
              title="Outstanding invoices"
              value={formatMoneyCents(
                money.outstandingInvoicesCents,
                snapshot.currency,
              )}
              description={
                money.outstandingInvoicesCount === 1
                  ? "1 open invoice"
                  : `${money.outstandingInvoicesCount} open invoices`
              }
              icon={Wallet}
              href="/dashboard/payments"
              accent="warning"
            />
            <StatCard
              title="Outstanding deposits / balances"
              value={formatMoneyCents(
                money.outstandingDepositsCents,
                snapshot.currency,
              )}
              description={
                money.outstandingDepositsCount === 1
                  ? "1 booking with an amount due"
                  : `${money.outstandingDepositsCount} bookings with an amount due`
              }
              icon={Wallet}
              href="/dashboard/payments"
              accent="warning"
            />
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                variant="panel"
                glyph={Wallet}
                title="Payments data isn’t available"
                description={money.message}
              >
                <Link href="/dashboard/payments">
                  <Button size="sm" variant="outline">
                    Open Payments
                  </Button>
                </Link>
              </EmptyState>
            </CardContent>
          </Card>
        )}
      </section>

      <section aria-label="Summer">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-accent text-primary">
                <Sun className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Summer</CardTitle>
                <CardDescription>
                  Grounded facts from today’s Command Centre records
                </CardDescription>
              </div>
            </div>
            <Link href="/dashboard/ai-workforce/summer">
              <Button variant="outline" size="sm" className="min-h-[var(--touch-min)]">
                Open Summer
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {snapshot.summerFacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No additional operating facts to show from current records.
              </p>
            ) : (
              <ul className="space-y-2">
                {snapshot.summerFacts.map((fact) => (
                  <li key={fact.id}>
                    <Link
                      href={fact.href}
                      className="block rounded-[var(--radius-md)] border border-border/80 px-3.5 py-3 text-sm leading-relaxed transition-colors hover:border-primary/35 hover:bg-accent/20 ds-focus-ring"
                    >
                      {fact.text}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
