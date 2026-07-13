import { Badge } from "@/components/ui/badge";
import {
  AI_EMPLOYEE_STATUS_LABELS,
  type AiEmployeeStatus,
} from "@/lib/ai-workforce/types";
import { cn } from "@/lib/utils";

const statusDot: Record<AiEmployeeStatus, string> = {
  online: "bg-success",
  working: "bg-primary animate-pulse",
  idle: "bg-muted-foreground/50",
};

const statusVariant: Record<
  AiEmployeeStatus,
  "default" | "primary" | "spark" | "outline"
> = {
  online: "spark",
  working: "primary",
  idle: "outline",
};

export function AiStatusBadge({
  status,
  className,
}: {
  status: AiEmployeeStatus;
  className?: string;
}) {
  return (
    <Badge variant={statusVariant[status]} className={cn("gap-1.5", className)}>
      <span
        className={cn("h-1.5 w-1.5 rounded-full", statusDot[status])}
        aria-hidden="true"
      />
      {AI_EMPLOYEE_STATUS_LABELS[status]}
    </Badge>
  );
}
