import type { AppointmentStatus } from "@/lib/types/booking";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  no_show: "bg-muted text-muted-foreground",
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
      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium ${
        variant === "default"
          ? "bg-muted text-muted-foreground"
          : statusStyles[variant]
      } ${className ?? ""}`}
    >
      {variant !== "default" ? APPOINTMENT_STATUS_LABELS[variant] : children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={status}>{APPOINTMENT_STATUS_LABELS[status]}</Badge>;
}

export function TagBadge({
  tag,
  index = 0,
}: {
  tag: string;
  index?: number;
}) {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  ];
  return (
    <span
      className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${colors[index % colors.length]}`}
    >
      {tag}
    </span>
  );
}
