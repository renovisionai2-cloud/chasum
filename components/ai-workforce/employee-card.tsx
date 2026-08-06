import { AiEmployeeAvatar } from "@/components/ai-workforce/employee-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AiEmployee } from "@/lib/ai-workforce/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function AiEmployeeCard({
  employee,
  disableOpen = false,
}: {
  employee: AiEmployee;
  /** When true, hide Open for roles that are not live. */
  disableOpen?: boolean;
}) {
  const href =
    employee.id === "chase"
      ? "/dashboard/workforce/chase"
      : employee.id === "summer"
        ? "/dashboard/ai-workforce/summer"
        : `/dashboard/ai-workforce/${employee.slug}`;

  return (
    <Card className="h-full">
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
          <span className="rounded-[var(--radius-sm)] border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Coming later
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {employee.summary}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/80 pt-4">
          <div>
            <p className="ds-label">Live tasks</p>
            <p className="text-sm text-muted-foreground">Not available yet</p>
          </div>
          {disableOpen ? (
            <Button variant="outline" size="sm" disabled>
              Coming later
            </Button>
          ) : (
            <Link href={href}>
              <Button size="sm" variant="outline">
                Open
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
