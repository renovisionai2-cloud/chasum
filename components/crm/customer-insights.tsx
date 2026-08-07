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
  const decided =
    insights.completedAppointments +
    insights.cancellationCount +
    insights.noShowCount;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Observed facts from appointment history. Completed service list value
        uses service list prices — not commerce payments collected, and not
        labeled as revenue.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Completed visits"
          value={String(insights.completedAppointments)}
          description={`${insights.upcomingCount} upcoming`}
          icon={CalendarCheck2}
          accent="primary"
        />
        <StatCard
          title="Completed service list value"
          value={
            insights.completedAppointments > 0
              ? `$${insights.lifetimeRevenue.toFixed(0)}`
              : "Unavailable"
          }
          description={
            insights.completedAppointments > 0
              ? `Avg $${insights.averageSpend.toFixed(0)} per completed visit (list price)`
              : "No completed visits with list prices"
          }
          icon={CircleDollarSign}
          accent="success"
        />
        <StatCard
          title="No-show rate"
          value={decided > 0 ? `${insights.noShowRate}%` : "Unavailable"}
          description={
            decided > 0
              ? `${insights.noShowCount} of ${decided} past appointments no-show`
              : "No decided appointments yet"
          }
          icon={Percent}
          accent="warning"
        />
        <StatCard
          title="Cancellation rate"
          value={decided > 0 ? `${insights.cancellationRate}%` : "Unavailable"}
          description={
            decided > 0
              ? `${insights.cancellationCount} of ${decided} past appointments cancelled`
              : "No decided appointments yet"
          }
          icon={Percent}
          accent="spark"
        />
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <p className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" aria-hidden />
          Preferred employee: {insights.preferredEmployeeName ?? "—"}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Briefcase className="h-4 w-4" aria-hidden />
          Preferred service: {insights.preferredServiceName ?? "—"}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" aria-hidden />
          Last visit:{" "}
          {insights.lastVisit
            ? format(new Date(insights.lastVisit), "MMM d, yyyy")
            : "—"}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" aria-hidden />
          Next visit:{" "}
          {insights.nextAppointment
            ? format(new Date(insights.nextAppointment), "MMM d, yyyy")
            : "—"}
        </p>
      </div>
    </div>
  );
}
