import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getDashboardStats, getAppointments } from "@/lib/actions/appointments";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  Calendar,
  Clock,
  DollarSign,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

export async function DashboardOverview() {
  const business = await getOrCreateBusiness();
  const stats = await getDashboardStats();
  const now = new Date();
  const todayAppts = await getAppointments(
    startOfDay(now).toISOString(),
    endOfDay(now).toISOString(),
  );

  const statCards = [
    {
      title: "Today's appointments",
      value: stats.todayCount.toString(),
      icon: Calendar,
      href: "/dashboard/calendar",
    },
    {
      title: "This week",
      value: stats.weekCount.toString(),
      icon: Clock,
      href: "/dashboard/calendar",
    },
    {
      title: "Monthly revenue",
      value: `$${stats.monthlyRevenue.toFixed(0)}`,
      change: "From completed appointments",
      icon: DollarSign,
      href: "/dashboard/calendar",
    },
    {
      title: "Total clients",
      value: stats.customerCount.toString(),
      change: `+${stats.newCustomersThisMonth} this month`,
      icon: Users,
      href: "/dashboard/clients",
    },
  ];

  const quickActions = [
    { label: "New appointment", href: "/dashboard/calendar", icon: Plus },
    { label: "Add client", href: "/dashboard/clients", icon: UserPlus },
    { label: "View calendar", href: "/dashboard/calendar", icon: Calendar },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description={`Welcome back. Here's what's happening at ${business.name}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="border-border/60 transition-colors hover:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {stat.value}
                </div>
                {stat.change && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {stat.change}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s schedule</CardTitle>
            <Link href="/dashboard/calendar">
              <Button variant="outline" size="sm">Open calendar</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppts.length === 0 ? (
              <EmptyState
                title="No appointments today"
                description="Your schedule is clear. Open the calendar to add one."
              />
            ) : (
              <div className="space-y-2">
                {todayAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-16 text-sm font-medium text-primary">
                        {formatTime(parseISO(appt.start_time))}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{appt.customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {appt.service.name} · {appt.staff.name}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>New clients</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.newCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No new clients this month.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.newCustomers.map((c) => (
                    <li key={c.id} className="text-sm">
                      <Link href={`/dashboard/clients/${c.id}`} className="font-medium hover:text-primary">
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming appointments</CardTitle>
          <Link href="/dashboard/calendar">
            <Button variant="outline" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No upcoming appointments.{" "}
              <Link href="/dashboard/calendar" className="text-primary hover:underline">
                Schedule one
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {stats.upcoming.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-primary">
                      {formatTime(parseISO(appt.start_time))}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {appt.customer?.name ?? "Client"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appt.service?.name ?? "Service"} ·{" "}
                        {format(parseISO(appt.start_time), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
