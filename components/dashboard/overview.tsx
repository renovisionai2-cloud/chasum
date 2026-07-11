import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getDashboardStats } from "@/lib/actions/appointments";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format } from "date-fns";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function DashboardOverview() {
  const business = await getOrCreateBusiness();
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Today's appointments",
      value: stats.todayCount.toString(),
      icon: Calendar,
    },
    {
      title: "This week",
      value: stats.weekCount.toString(),
      icon: Clock,
    },
    {
      title: "Total clients",
      value: stats.customerCount.toString(),
      change: `+${stats.newCustomersThisMonth} this month`,
      icon: Users,
    },
    {
      title: "Booking page",
      value: "Live",
      change: `/book/${business.slug}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Welcome back. Here's what's happening today."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border/60">
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
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming appointments</CardTitle>
          <Link href="/dashboard/calendar">
            <Button variant="outline" size="sm">View calendar</Button>
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
