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
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getDashboardStats } from "@/lib/actions/appointments";
import { getLocationScope } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import {
  buildAiSummary,
  firstNameFromUser,
  formatComparison,
  greetingForHour,
} from "@/lib/dashboard/insights";
import {
  buildSetupSteps,
  isSetupComplete,
} from "@/lib/onboarding/setup-progress";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CalendarPlus,
  Clock,
  DollarSign,
  MessageSquare,
  Plus,
  Sparkles,
  UserCog,
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

  const [stats, services, staff, locationsRes] = await Promise.all([
    getDashboardStats(),
    getServices(),
    getStaff(),
    supabase
      .from("locations")
      .select("id")
      .eq("business_id", business.id)
      .limit(5),
  ]);

  const locationIds = (locationsRes.data ?? []).map((l) => l.id);
  let hasHours = false;
  if (locationIds.length > 0) {
    const { data: hoursRows } = await supabase
      .from("location_hours")
      .select("id, is_open")
      .in("location_id", locationIds)
      .eq("is_open", true)
      .limit(1);
    hasHours = (hoursRows?.length ?? 0) > 0;
  }

  const setupSteps = buildSetupSteps({
    business,
    serviceCount: services.length,
    staffCount: staff.length,
    hasHours,
  });
  const setupDone = isSetupComplete(setupSteps);

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

  const aiSummary = buildAiSummary({
    todayCount: stats.todayCount,
    pendingConfirmations: stats.pendingConfirmations,
    todayRevenue: stats.todayRevenue,
    weekCount: stats.weekCount,
  });

  const quickActions = setupDone
    ? [
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
      ]
    : [
        {
          label: "Business profile",
          description: "Name, slug, contact, branding",
          href: "/dashboard/business",
          icon: Building2,
        },
        {
          label: "Add a service",
          description: "What customers can book",
          href: "/dashboard/services",
          icon: Briefcase,
        },
        {
          label: "Add an employee",
          description: "Someone who can take appointments",
          href: "/dashboard/employees",
          icon: UserCog,
        },
        {
          label: "Booking settings",
          description: "Hours and public booking link",
          href: "/dashboard/settings",
          icon: Calendar,
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
              {setupDone
                ? `Here's what's happening at ${business.name} today.`
                : `Welcome to Chasum — finish setup so ${business.name} can take real bookings.`}
            </p>
            {setupDone ? (
              <>
                <div className="flex flex-wrap gap-3 pt-1 text-sm">
                  <span className="rounded-full border border-border bg-background/80 px-3 py-1 tabular-nums">
                    {stats.todayCount} appointment
                    {stats.todayCount === 1 ? "" : "s"}
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
              </>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {setupDone ? (
              <>
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
                <Link href="/dashboard/reports">
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4" aria-hidden="true" />
                    Reports
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard/business">
                  <Button>
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                    Set up business
                  </Button>
                </Link>
                <Link href="/dashboard/services">
                  <Button variant="outline">Add service</Button>
                </Link>
                <Link href="/dashboard/employees">
                  <Button variant="outline">Add employee</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {!setupDone ? (
        <SetupChecklist
          steps={setupSteps}
          bookingPath={`/book/${business.slug}`}
        />
      ) : null}

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
          title="Today's revenue"
          value={`$${stats.todayRevenue.toFixed(0)}`}
          description="From completed appointments today"
          icon={DollarSign}
          href="/dashboard/calendar"
          accent="success"
          style={{ animationDelay: "80ms" }}
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

      {/* Business alerts + Quick actions */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Bell className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Business alerts</CardTitle>
                <CardDescription>
                  Unread notifications from your live operations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats.businessAlerts.length === 0 ? (
              <EmptyState
                variant="panel"
                glyph={Bell}
                title="No alerts right now"
                description="New bookings, confirmations, and changes appear here as they happen."
              >
                <Link href="/dashboard/notifications">
                  <Button size="sm" variant="outline">
                    Notification center
                  </Button>
                </Link>
              </EmptyState>
            ) : (
              <ul className="space-y-3">
                {stats.businessAlerts.map((alert) => (
                  <li key={alert.id}>
                    <Link
                      href="/dashboard/notifications"
                      className="group block rounded-[var(--radius-md)] border border-border bg-muted/20 p-3.5 transition-colors hover:border-primary/35 hover:bg-accent/30 ds-focus-ring"
                    >
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {alert.body}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-2 animate-fade-in-up" style={{ animationDelay: "220ms" }}>
          <div>
            <h2 className="ds-section-title">Quick actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {setupDone
                ? "Common tasks, one tap away"
                : "Finish setup first — then day-to-day ops live here"}
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
                Tip: Share your public booking link from Settings once hours,
                services, and staff are set.
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
              <CardTitle>Recent clients</CardTitle>
              <CardDescription>Latest client records</CardDescription>
            </div>
            <Link href="/dashboard/clients">
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentCustomers.length === 0 ? (
              <EmptyState
                variant="inline"
                glyph={Users}
                icon="none"
                title="No clients yet"
                description="Public bookings and manual adds appear here."
              >
                <Link href="/dashboard/clients">
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Add client
                  </Button>
                </Link>
              </EmptyState>
            ) : (
              <ul className="space-y-3">
                {stats.recentCustomers.map((c) => (
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

      {/* Recent bookings */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "320ms" }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent bookings</CardTitle>
            <CardDescription>Latest appointments created</CardDescription>
          </div>
          <Link href="/dashboard/calendar">
            <Button variant="outline" size="sm">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length === 0 ? (
            <EmptyState
              variant="panel"
              glyph={Calendar}
              title="No bookings yet"
              description="Appointments from the calendar or public page appear here."
            >
              <Link href="/dashboard/calendar">
                <Button size="sm">Schedule appointment</Button>
              </Link>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border/80">
              {stats.recentBookings.map((row) => {
                const customer = Array.isArray(row.customer)
                  ? row.customer[0]
                  : row.customer;
                const service = Array.isArray(row.service)
                  ? row.service[0]
                  : row.service;
                const location = Array.isArray(row.location)
                  ? row.location[0]
                  : row.location;
                return (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {customer?.name ?? "Client"} ·{" "}
                      {service?.name ?? "Service"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {format(parseISO(row.start_time), "MMM d, yyyy")} at{" "}
                      {formatTime(parseISO(row.start_time))}
                      {location?.name ? ` · ${location.name}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
