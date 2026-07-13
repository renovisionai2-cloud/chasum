import { StatCard } from "@/components/ui/stat-card";
import type { ReceptionBrief } from "@/lib/actions/reception";
import {
  Calendar,
  Clock,
  DollarSign,
  UserCheck,
  Users,
} from "lucide-react";

export function BusinessBrief({ brief }: { brief: ReceptionBrief }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Today's appointments"
        value={String(brief.todayAppointments)}
        description="On the calendar today"
        icon={Calendar}
        accent="primary"
      />
      <StatCard
        title="Today's revenue"
        value={`$${brief.todayRevenue.toFixed(0)}`}
        description="Completed today"
        icon={DollarSign}
        accent="success"
      />
      <StatCard
        title="Customers today"
        value={String(brief.customersToday)}
        description="Unique guests scheduled"
        icon={Users}
        accent="spark"
      />
      <StatCard
        title="Open time slots"
        value={String(brief.openTimeSlots)}
        description="Real openings left today"
        icon={Clock}
        accent="warning"
      />
      <StatCard
        title="Pending confirmations"
        value={String(brief.pendingConfirmations)}
        description="Awaiting confirmation"
        icon={UserCheck}
        accent="primary"
      />
    </div>
  );
}
