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
      <p className="text-xs text-muted-foreground">
        Observed facts from appointment history. Booking values below use
        service list prices — not commerce “payments collected.”
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
          title="Completed booking value"
          value={`$${insights.lifetimeRevenue.toFixed(0)}`}
          description={`Avg $${insights.averageSpend.toFixed(0)} per completed visit`}
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
