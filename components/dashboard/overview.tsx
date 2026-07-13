import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { WeekBars } from "@/components/ui/chart";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getDashboardStats, getAppointments } from "@/lib/actions/appointments";
import { getLocationScope } from "@/lib/actions/location";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  Clock,
  DollarSign,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

export async function DashboardOverview() {
  const business = await getOrCreateBusiness();
  const locationScope = await getLocationScope();
  const stats = await getDashboardStats();
  const now = new Date();
  const todayAppts = await getAppointments(
    startOfDay(now).toISOString(),
    endOfDay(now).toISOString(),
  );

  const weekSpark = (stats.weekDayCounts ?? []).map((d) => d.value);
  const scopeLabel =
    locationScope.mode === "all" ? "all locations" : "this location";

  const quickActions = [
    {
      label: "New appointment",
      description: "Book on the calendar",
      href: "/dashboard/calendar",
      icon: CalendarPlus,
    },
    {
      label: "Add client",
      description: "Grow your client list",
      href: "/dashboard/clients",
      icon: UserPlus,
    },
    {
      label: "Manage services",
      description: "Pricing and duration",
      href: "/dashboard/services",
      icon: Plus,
    },
  ];

  return (
    <div className="ds-page">
      <PageHeader
        title="Overview"
        description={`Business health for ${business.name} · ${scopeLabel}`}
      >
        <Link href="/dashboard/calendar">
          <Button size="sm">
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            New appointment
          </Button>
        </Link>
      </PageHeader>

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
        />
        <StatCard
          title="This week"
          value={stats.weekCount.toString()}
          description="Active bookings this week"
          icon={Clock}
          href="/dashboard/calendar"
          accent="spark"
          sparkline={weekSpark}
        />
        <StatCard
          title="Monthly revenue"
          value={`$${stats.monthlyRevenue.toFixed(0)}`}
          description="From completed appointments"
          icon={DollarSign}
          href="/dashboard/calendar"
          accent="success"
        />
        <StatCard
          title="Clients"
          value={stats.customerCount.toString()}
          description={`+${stats.newCustomersThisMonth} new this month`}
          icon={Users}
          href="/dashboard/clients"
          accent="warning"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
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
                description="Bookings will show here as they come in."
              >
                <Link href="/dashboard/calendar">
                  <Button size="sm">Open calendar</Button>
                </Link>
              </EmptyState>
            ) : (
              <WeekBars data={stats.weekDayCounts ?? []} />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common tasks, one tap away</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-border/80 bg-card px-3.5 py-3 transition-all duration-200 hover:border-primary/35 hover:bg-accent/40 ds-focus-ring"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-muted text-foreground transition-colors group-hover:bg-accent group-hover:text-primary">
                  <action.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-medium text-foreground">
                    {action.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Today&apos;s schedule</CardTitle>
              <CardDescription>
                {format(now, "EEEE, MMM d")}
              </CardDescription>
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
                <Link href="/dashboard/calendar">
                  <Button size="sm">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Schedule
                  </Button>
                </Link>
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
                          {appt.customer.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {appt.service.name} · {appt.staff.name}
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

        <Card className="lg:col-span-2">
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
              />
            ) : (
              <ul className="space-y-3">
                {stats.newCustomers.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/clients/${c.id}`}
                      className="group block rounded-[var(--radius-sm)] transition-colors hover:bg-muted/50 -mx-2 px-2 py-1.5 ds-focus-ring"
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

      <Card>
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
              <Link href="/dashboard/calendar">
                <Button size="sm">Schedule appointment</Button>
              </Link>
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
