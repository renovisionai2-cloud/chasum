import type { AppointmentStatus } from "@/lib/types/booking";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  no_show: "bg-muted text-muted-foreground",
};

type BadgeVariant =
  | "default"
  | "primary"
  | "spark"
  | "outline"
  | AppointmentStatus;

export function Badge({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children?: React.ReactNode;
  variant?: BadgeVariant;
}) {
  const isStatus =
    variant === "pending" ||
    variant === "confirmed" ||
    variant === "cancelled" ||
    variant === "completed" ||
    variant === "no_show";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-muted text-muted-foreground",
        variant === "primary" && "bg-accent text-accent-foreground",
        variant === "spark" && "bg-spark-muted text-spark",
        variant === "outline" && "border border-border bg-card text-foreground",
        isStatus && statusStyles[variant as AppointmentStatus],
        className,
      )}
    >
      {isStatus
        ? APPOINTMENT_STATUS_LABELS[variant as AppointmentStatus]
        : children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={status} />;
}

export function TagBadge({
  tag,
  index = 0,
}: {
  tag: string;
  index?: number;
}) {
  const colors = [
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  ];
  return (
    <span
      className={cn(
        "inline-flex rounded-lg px-2 py-0.5 text-xs font-medium",
        colors[index % colors.length],
      )}
    >
      {tag}
    </span>
  );
}
