import { AiEmployeeAvatar } from "@/components/ai-workforce/employee-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { WeekBars } from "@/components/ui/chart";
import { AI_EMPLOYEES } from "@/lib/ai-workforce/roster";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getDashboardStats } from "@/lib/actions/appointments";
import { getLocationScope } from "@/lib/actions/location";
import {
  buildAiSummary,
  buildDashboardInsights,
  firstNameFromUser,
  formatComparison,
  greetingForHour,
} from "@/lib/dashboard/insights";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  Clock,
  DollarSign,
  MessageSquare,
  Plus,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

export async function DashboardOverview() {
  const business = await getOrCreateBusiness();
  const locationScope = await getLocationScope();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stats = await getDashboardStats();
  const now = new Date();
  const todayAppts = stats.todayAppointments;

  const weekSpark = (stats.weekDayCounts ?? []).map((d) => d.value);
  const scopeLabel =
    locationScope.mode === "all" ? "all locations" : "this location";
  const firstName = firstNameFromUser({
    email: user?.email,
    fullName:
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.user_metadata?.name as string | undefined) ??
      null,
  });
  const greeting = greetingForHour(now.getHours());
  const weekdayName = format(now, "EEEE");

  const aiSummary = buildAiSummary({
    todayCount: stats.todayCount,
    pendingConfirmations: stats.pendingConfirmations,
    todayRevenue: stats.todayRevenue,
    weekCount: stats.weekCount,
  });

  const insights = buildDashboardInsights({
    todayCount: stats.todayCount,
    yesterdayCount: stats.yesterdayCount,
    lastWeekSameDayCount: stats.lastWeekSameDayCount,
    weekCount: stats.weekCount,
    previousWeekCount: stats.previousWeekCount,
    pendingConfirmations: stats.pendingConfirmations,
    upcomingCount: stats.upcoming.length,
    customerCount: stats.customerCount,
    weekdayName,
  });

  const quickActions = [
    {
      label: "New appointment",
      description: "Book a visit on the calendar",
      href: "/dashboard/calendar",
      icon: CalendarPlus,
    },
    {
      label: "Add client",
      description: "Create or update a client record",
      href: "/dashboard/clients",
      icon: UserPlus,
    },
    {
      label: "Open calendar",
      description: "Day, week, and month views",
      href: "/dashboard/calendar",
      icon: Calendar,
    },
    {
      label: "AI Command Center",
      description: "Talk to your AI Workforce",
      href: "/dashboard/ai-workforce/command",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="ds-page">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-sm md:p-8 animate-fade-in-up">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(50% 80% at 0% 0%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 60%), radial-gradient(40% 60% at 100% 0%, color-mix(in srgb, var(--spark) 10%, transparent), transparent 55%)",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl space-y-3">
            <p className="ds-label">
              {format(now, "EEEE, MMMM d, yyyy")} · {scopeLabel}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">
              {greeting}, {firstName}.
            </h1>
            <p className="text-muted-foreground md:text-[0.975rem]">
              Here&apos;s what&apos;s happening at {business.name} today.
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-sm">
              <span className="rounded-full border border-border bg-background/80 px-3 py-1 tabular-nums">
                {stats.todayCount} appointment{stats.todayCount === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-border bg-background/80 px-3 py-1 tabular-nums">
                ${stats.todayRevenue.toFixed(0)} completed today
              </span>
              <span className="rounded-full border border-border bg-background/80 px-3 py-1 tabular-nums">
                {stats.pendingConfirmations} pending confirmation
                {stats.pendingConfirmations === 1 ? "" : "s"}
              </span>
            </div>
            <p className="flex items-start gap-2 rounded-[var(--radius-md)] border border-spark/20 bg-spark-muted/30 px-3 py-2.5 text-sm text-foreground">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-spark"
                aria-hidden="true"
              />
              <span>
                <strong className="font-medium">AI summary · </strong>
                {aiSummary}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/dashboard/calendar">
              <Button>
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                New appointment
              </Button>
            </Link>
            <Link href="/dashboard/ai-workforce">
              <Button variant="outline">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                AI Workforce
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today"
          value={stats.todayCount.toString()}
          description={
            stats.todayCount === 1
              ? "1 appointment scheduled"
              : `${stats.todayCount} appointments scheduled`
          }
          icon={Calendar}
          href="/dashboard/calendar"
          accent="primary"
          sparkline={weekSpark}
          comparison={formatComparison(stats.todayCount, stats.yesterdayCount)}
          style={{ animationDelay: "40ms" }}
        />
        <StatCard
          title="This week"
          value={stats.weekCount.toString()}
          description="Active bookings this week"
          icon={Clock}
          href="/dashboard/calendar"
          accent="spark"
          sparkline={weekSpark}
          comparison={formatComparison(stats.weekCount, stats.previousWeekCount)}
          style={{ animationDelay: "80ms" }}
        />
        <StatCard
          title="Monthly revenue"
          value={`$${stats.monthlyRevenue.toFixed(0)}`}
          description="From completed appointments"
          icon={DollarSign}
          href="/dashboard/calendar"
          accent="success"
          comparison={formatComparison(
            stats.monthlyRevenue,
            stats.previousMonthRevenue,
          )}
          style={{ animationDelay: "120ms" }}
        />
        <StatCard
          title="Clients"
          value={stats.customerCount.toString()}
          description={`+${stats.newCustomersThisMonth} new this month`}
          icon={Users}
          href="/dashboard/clients"
          accent="warning"
          style={{ animationDelay: "160ms" }}
        />
      </div>

      {/* Insights + Quick actions */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-spark-muted text-spark">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Today&apos;s recommendations</CardTitle>
                <CardDescription>
                  Generated from your live booking data only
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <EmptyState
                variant="panel"
                icon="spark"
                title="No recommendations yet"
                description="When appointments, confirmations, or week-over-week changes give a clear signal, your AI Workforce will surface it here."
              >
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/dashboard/calendar">
                    <Button size="sm">Open calendar</Button>
                  </Link>
                  <Link href="/dashboard/ai-workforce">
                    <Button size="sm" variant="outline">
                      Meet the team
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Tip: Keep services and hours up to date so recommendations stay
                  grounded in real capacity.
                </p>
              </EmptyState>
            ) : (
              <ul className="space-y-3">
                {insights.map((insight) => {
                  const employee = AI_EMPLOYEES.find(
                    (e) => e.id === insight.employeeId,
                  );
                  return (
                    <li key={insight.id}>
                      <Link
                        href={insight.href}
                        className="group flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-muted/20 p-3.5 transition-all duration-200 hover:border-primary/35 hover:bg-accent/30 ds-focus-ring"
                      >
                        {employee ? (
                          <AiEmployeeAvatar employee={employee} size="sm" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-spark-muted text-spark">
                            <Sparkles className="h-4 w-4" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-muted-foreground">
                            {insight.employeeName} · {insight.role}
                          </span>
                          <span className="mt-1 block text-sm text-foreground">
                            {insight.message}
                          </span>
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-2 animate-fade-in-up" style={{ animationDelay: "220ms" }}>
          <div>
            <h2 className="ds-section-title">Quick actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Common tasks, one tap away
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex min-h-[5.5rem] items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:border-primary/35 hover:shadow-md ds-focus-ring"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent text-primary transition-transform duration-200 group-hover:scale-105">
                  <action.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {action.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Week chart */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>This week</CardTitle>
            <CardDescription>Appointment volume by day</CardDescription>
          </div>
          <Link href="/dashboard/calendar">
            <Button variant="outline" size="sm">
              Calendar
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {(stats.weekDayCounts ?? []).every((d) => d.value === 0) ? (
            <EmptyState
              variant="panel"
              glyph={Calendar}
              title="Quiet week so far"
              description="Bookings will show here as they come in from the calendar or public page."
            >
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/dashboard/calendar">
                  <Button size="sm">Open calendar</Button>
                </Link>
                <Link href="/dashboard/services">
                  <Button size="sm" variant="outline">
                    Review services
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Tip: Share your public booking link from Settings once hours and
                services are set.
              </p>
            </EmptyState>
          ) : (
            <WeekBars data={stats.weekDayCounts ?? []} />
          )}
        </CardContent>
      </Card>

      {/* Schedule + new clients */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: "280ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Today&apos;s schedule</CardTitle>
              <CardDescription>{format(now, "EEEE, MMM d")}</CardDescription>
            </div>
            <Link href="/dashboard/calendar">
              <Button variant="outline" size="sm">
                Open
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppts.length === 0 ? (
              <EmptyState
                variant="panel"
                glyph={Calendar}
                title="No appointments today"
                description="Your schedule is clear. Add one when you're ready."
              >
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/dashboard/calendar">
                    <Button size="sm">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Schedule
                    </Button>
                  </Link>
                  <Link href={`/book/${business.slug}`} target="_blank">
                    <Button size="sm" variant="outline">
                      View booking page
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Tip: Confirm staff working hours so public slots stay accurate.
                </p>
              </EmptyState>
            ) : (
              <ul className="divide-y divide-border/80">
                {todayAppts.map((appt) => (
                  <li
                    key={appt.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-primary">
                        {formatTime(parseISO(appt.start_time))}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {appt.customer?.name ?? "Client"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {appt.service?.name ?? "Service"}
                          {appt.staff?.name ? ` · ${appt.staff.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>New clients</CardTitle>
              <CardDescription>This month</CardDescription>
            </div>
            <Link href="/dashboard/clients">
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.newCustomers.length === 0 ? (
              <EmptyState
                variant="inline"
                glyph={Users}
                icon="none"
                title="No new clients yet"
                description="Public bookings and manual adds appear here."
              >
                <Link href="/dashboard/clients">
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Add client
                  </Button>
                </Link>
                <p className="mt-3 text-xs text-muted-foreground">
                  Tip: Clients are shared across all locations.
                </p>
              </EmptyState>
            ) : (
              <ul className="space-y-3">
                {stats.newCustomers.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/clients/${c.id}`}
                      className="group -mx-2 block rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-muted/50 ds-focus-ring"
                    >
                      <p className="text-sm font-medium group-hover:text-primary">
                        {c.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.email}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "320ms" }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Next appointments on the books</CardDescription>
          </div>
          <Link href="/dashboard/calendar">
            <Button variant="outline" size="sm">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.upcoming.length === 0 ? (
            <EmptyState
              variant="panel"
              glyph={Calendar}
              title="Nothing upcoming"
              description="Schedule the next visit to keep the calendar full."
            >
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/dashboard/calendar">
                  <Button size="sm">Schedule appointment</Button>
                </Link>
                <Link href="/dashboard/clients">
                  <Button size="sm" variant="outline">
                    Browse clients
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Tip: Upcoming visits power reminders once notifications are
                enabled.
              </p>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border/80">
              {stats.upcoming.map((appt) => (
                <li
                  key={appt.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="shrink-0 text-left">
                      <p className="text-sm font-semibold tabular-nums text-primary">
                        {formatTime(parseISO(appt.start_time))}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(parseISO(appt.start_time), "MMM d")}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {appt.customer?.name ?? "Client"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {appt.service?.name ?? "Service"}
                        {appt.location?.name ? ` · ${appt.location.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
