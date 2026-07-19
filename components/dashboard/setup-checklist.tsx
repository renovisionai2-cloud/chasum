import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SetupStep } from "@/lib/onboarding/setup-progress";
import { setupProgressPct } from "@/lib/onboarding/setup-progress";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import Link from "next/link";

export function SetupChecklist({
  steps,
  bookingPath,
}: {
  steps: SetupStep[];
  bookingPath: string;
}) {
  const pct = setupProgressPct(steps);
  const next = steps.find((s) => !s.done);

  return (
    <Card className="border-primary/25 bg-gradient-to-br from-card to-primary/[0.03] shadow-sm animate-fade-in-up">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" aria-hidden />
            <CardTitle className="text-base">Get operational</CardTitle>
            <Badge variant="outline" className="rounded-full tabular-nums">
              {pct}%
            </Badge>
          </div>
          <CardDescription>
            Finish these steps before sharing your booking link or relying on
            Reception. Takes most businesses under 15 minutes.
          </CardDescription>
        </div>
        {next ? (
          <Link href={next.href}>
            <Button size="sm">Continue setup</Button>
          </Link>
        ) : (
          <Link href={bookingPath} target="_blank">
            <Button size="sm" variant="outline">
              Open booking page
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <ul className="space-y-1.5">
          {steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href}
                className="flex items-start gap-3 rounded-[var(--radius-md)] border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-muted/40"
              >
                {step.done ? (
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden
                  />
                ) : (
                  <Circle
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50"
                    aria-hidden
                  />
                )}
                <span className="min-w-0">
                  <span
                    className={
                      step.done
                        ? "text-sm text-muted-foreground line-through"
                        : "text-sm font-medium text-foreground"
                    }
                  >
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
