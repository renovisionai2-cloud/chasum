import { AiEmployeeAvatar } from "@/components/ai-workforce/employee-avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AI_EMPLOYEES } from "@/lib/ai-workforce/roster";
import type { AiActivityItem, AiActivityKind } from "@/lib/ai-workforce/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Sparkles } from "lucide-react";
import Link from "next/link";

const kindLabel: Record<AiActivityKind, string> = {
  system: "System",
  recommendation: "Recommendation",
  automation: "Automation",
  handoff: "Handoff",
  insight: "Insight",
};

function employeeById(id: string) {
  return AI_EMPLOYEES.find((e) => e.id === id);
}

export function AiActivityFeed({
  items,
  className,
  compact = false,
}: {
  items: AiActivityItem[];
  className?: string;
  compact?: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        variant="panel"
        icon="spark"
        title="No AI activity yet"
        description="As your workforce assists bookings, reminders, and recommendations, events will appear here."
      />
    );
  }

  return (
    <ol className={cn("relative space-y-0", className)}>
      {items.map((item, index) => {
        const employee = employeeById(item.employeeId);
        if (!employee) return null;

        return (
          <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < items.length - 1 && (
              <span
                className="absolute left-[1.35rem] top-12 bottom-0 w-px bg-border"
                aria-hidden="true"
              />
            )}
            <AiEmployeeAvatar employee={employee} size="sm" className="z-10" />
            <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-border bg-card/80 p-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{kindLabel[item.kind]}</Badge>
                {item.preview && (
                  <Badge variant="spark" className="gap-1">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Preview
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(parseISO(item.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {!compact && (
                  <Link
                    href={`/dashboard/ai-workforce/${employee.slug}`}
                    className="text-primary hover:underline"
                  >
                    {employee.name}
                  </Link>
                )}
                {!compact && " · "}
                {item.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
