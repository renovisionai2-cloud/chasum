import { AiEmployeeCard } from "@/components/ai-workforce/employee-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AI_EMPLOYEES } from "@/lib/ai-workforce/roster";
import { MessageSquare, Sparkles, Sun } from "lucide-react";
import Link from "next/link";

export function AiWorkforceDashboard() {
  const employees = AI_EMPLOYEES.filter(
    (e) => e.id !== "emma" && e.id !== "noah",
  );
  const summer = employees.find((e) => e.id === "summer");
  const planned = employees.filter((e) => e.id !== "summer");

  return (
    <div className="ds-page">
      <PageHeader
        eyebrow="Future Vision · Private Alpha Preview"
        title="AI Workforce"
        description="Summer is the only AI Business Manager capability in Early Access today. Additional specialist roles are planned — they are not live operational employees yet."
      >
        <Link href="/dashboard/ai-workforce/summer">
          <Button>
            <Sun className="h-4 w-4" aria-hidden="true" />
            Open Summer
          </Button>
        </Link>
        <Link href="/dashboard/workforce/chase">
          <Button variant="outline">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Open Chase
          </Button>
        </Link>
      </PageHeader>

      <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
        <p>
          <strong className="font-medium">Status: Preview / Coming Later.</strong>{" "}
          Online/idle badges, task counts, and activity feeds for non-Summer
          roles are not live business data. Do not treat this roster as an
          operational workforce dashboard.
        </p>
      </div>

      {summer ? (
        <Card className="border-primary/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" aria-hidden="true" />
              Summer · Early Access
            </CardTitle>
            <CardDescription>
              AI Business Manager — bookings, rescheduling, cancellations, and
              grounded answers from your real business data.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/dashboard/ai-workforce/summer">
              <Button>Open Summer workspace</Button>
            </Link>
            <Link href="/dashboard/ai-workforce/command">
              <Button variant="outline">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Command Center
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="ds-section-title">Planned specialist roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Concept preview only — not online, not completing tasks, and Open may
          lead to limited or unavailable experiences.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {planned.map((employee) => (
            <AiEmployeeCard
              key={employee.id}
              employee={{
                ...employee,
                status: "idle",
                tasksCompletedToday: 0,
              }}
              disableOpen={
                employee.id !== "alex" && employee.id !== "chase"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
