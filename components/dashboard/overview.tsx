import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";

const stats = [
  {
    title: "Today's appointments",
    value: "8",
    change: "+2 from yesterday",
    icon: Calendar,
  },
  {
    title: "This week",
    value: "34",
    change: "12 confirmed, 3 pending",
    icon: Clock,
  },
  {
    title: "Total clients",
    value: "156",
    change: "+8 this month",
    icon: Users,
  },
  {
    title: "Booking rate",
    value: "94%",
    change: "+3% from last month",
    icon: TrendingUp,
  },
];

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
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
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Upcoming appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: "9:00 AM", client: "Sarah Johnson", service: "Consultation" },
              { time: "11:30 AM", client: "Mike Chen", service: "Follow-up" },
              { time: "2:00 PM", client: "Emily Davis", service: "Initial meeting" },
            ].map((appointment) => (
              <div
                key={appointment.time}
                className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-primary">
                    {appointment.time}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {appointment.client}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.service}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
