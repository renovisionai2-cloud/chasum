import { StatCard } from "@/components/ui/stat-card";
import type { CrmInsights } from "@/lib/crm/types";
import { format } from "date-fns";
import {
  Calendar,
  CalendarCheck2,
  CircleDollarSign,
  Percent,
  User,
  Briefcase,
} from "lucide-react";

export function CustomerInsightsPanel({ insights }: { insights: CrmInsights }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Lifetime visits"
          value={String(insights.completedAppointments)}
          description={`Avg booking $${insights.averageSpend.toFixed(0)}`}
          icon={CalendarCheck2}
          accent="primary"
        />
        <StatCard
          title="Lifetime revenue"
          value={`$${insights.lifetimeRevenue.toFixed(0)}`}
          description={`${insights.upcomingCount} upcoming`}
          icon={CircleDollarSign}
          accent="success"
        />
        <StatCard
          title="No-show rate"
          value={`${insights.noShowRate}%`}
          description={`${insights.noShowCount} no-shows`}
          icon={Percent}
          accent="warning"
        />
        <StatCard
          title="Cancellation rate"
          value={`${insights.cancellationRate}%`}
          description={`${insights.cancellationCount} cancelled`}
          icon={Percent}
          accent="spark"
        />
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <p className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          Preferred employee: {insights.preferredEmployeeName ?? "—"}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Briefcase className="h-4 w-4" />
          Preferred service: {insights.preferredServiceName ?? "—"}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Last visit:{" "}
          {insights.lastVisit
            ? format(new Date(insights.lastVisit), "MMM d, yyyy")
            : "—"}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Next visit:{" "}
          {insights.nextAppointment
            ? format(new Date(insights.nextAppointment), "MMM d, yyyy")
            : "—"}
        </p>
      </div>
    </div>
  );
}
