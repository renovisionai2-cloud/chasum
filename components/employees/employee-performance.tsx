import { StatCard } from "@/components/ui/stat-card";
import type { EmployeePerformance } from "@/lib/employees/types";
import {
  CalendarCheck2,
  CalendarX2,
  CircleDollarSign,
  Percent,
} from "lucide-react";

export function EmployeePerformanceDashboard({
  performance,
}: {
  performance: EmployeePerformance;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Completed"
        value={String(performance.completedAppointments)}
        description={`${performance.upcomingAppointments} upcoming`}
        icon={CalendarCheck2}
        accent="success"
      />
      <StatCard
        title="Lifetime revenue"
        value={`$${performance.lifetimeRevenue.toFixed(0)}`}
        description="From completed services"
        icon={CircleDollarSign}
        accent="primary"
      />
      <StatCard
        title="Completion rate"
        value={`${performance.completionRate}%`}
        description="Of decided appointments"
        icon={Percent}
        accent="spark"
      />
      <StatCard
        title="No-show rate"
        value={`${performance.noShowRate}%`}
        description={`${performance.noShowAppointments} no-shows · ${performance.cancelledAppointments} cancelled`}
        icon={CalendarX2}
        accent="warning"
      />
    </div>
  );
}
