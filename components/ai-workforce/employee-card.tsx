import { AiEmployeeAvatar } from "@/components/ai-workforce/employee-avatar";
import { AiStatusBadge } from "@/components/ai-workforce/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AiEmployee } from "@/lib/ai-workforce/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function AiEmployeeCard({ employee }: { employee: AiEmployee }) {
  return (
    <Card className="ds-card-interactive h-full">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <AiEmployeeAvatar employee={employee} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {employee.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {employee.role}
              </p>
            </div>
          </div>
          <AiStatusBadge status={employee.status} />
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {employee.summary}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/80 pt-4">
          <div>
            <p className="ds-label">Tasks today</p>
            <p className="text-lg font-semibold tabular-nums tracking-tight">
              {employee.tasksCompletedToday}
            </p>
          </div>
          <Link
            href={
              employee.id === "chase"
                ? "/dashboard/workforce/chase"
                : employee.id === "summer"
                  ? "/dashboard/ai-workforce/summer"
                  : `/dashboard/ai-workforce/${employee.slug}`
            }
          >
            <Button size="sm" variant="outline">
              Open
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
