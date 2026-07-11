import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/types/booking";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";

const statusStyles: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  completed: "bg-muted text-muted-foreground",
  no_show: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
};

export function Badge({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | AppointmentStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium",
        variant === "default"
          ? "bg-muted text-muted-foreground"
          : statusStyles[variant],
        className,
      )}
    >
      {variant !== "default" ? APPOINTMENT_STATUS_LABELS[variant] : children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={status}>{APPOINTMENT_STATUS_LABELS[status]}</Badge>;
}
