import { AiActivityFeed } from "@/components/ai-workforce/activity-feed";
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
import { StatCard } from "@/components/ui/stat-card";
import {
  AI_ACTIVITY_PREVIEW,
  AI_EMPLOYEES,
} from "@/lib/ai-workforce/roster";
import { Bot, MessageSquare, Sparkles, Users } from "lucide-react";
import Link from "next/link";

export function AiWorkforceDashboard() {
  const employees = AI_EMPLOYEES.filter(
    (e) => e.id !== "emma" && e.id !== "noah",
  );
  const onlineCount = employees.filter(
    (e) => e.status === "online" || e.status === "working",
  ).length;
  const tasksToday = employees.reduce(
    (sum, e) => sum + e.tasksCompletedToday,
    0,
  );

  return (
    <div className="ds-page">
      <PageHeader
        title="AI Workforce"
        description="Manage your AI employees — assistance first, automation when you are ready. Owners stay in control."
      >
        <Link href="/dashboard/workforce/chase">
          <Button variant="outline">
            <Bot className="h-4 w-4" aria-hidden="true" />
            Open Chase
          </Button>
        </Link>
        <Link href="/dashboard/ai-workforce/summer">
          <Button variant="outline">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Open Summer
          </Button>
        </Link>
        <Link href="/dashboard/ai-workforce/command">
          <Button>
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Command Center
          </Button>
        </Link>
      </PageHeader>

      <div className="rounded-[var(--radius-md)] border border-spark/25 bg-spark-muted/40 px-4 py-3 text-sm text-foreground">
        <p className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-spark" aria-hidden="true" />
          <span>
            <strong className="font-medium">Summer is live.</strong> Book,
            reschedule, and cancel through the Booking Engine. Other AI
            employees assist as the workforce expands — never inventing
            availability or prices.
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="AI employees"
          value={String(employees.length)}
          description="Named roles with clear responsibilities"
          icon={Users}
          accent="spark"
        />
        <StatCard
          title="Available now"
          value={String(onlineCount)}
          description="Online or working"
          icon={Bot}
          accent="primary"
        />
        <StatCard
          title="Tasks today"
          value={String(tasksToday)}
          description="Completed by the workforce"
          icon={Sparkles}
          accent="success"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="ds-section-title">Your team</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each employee has one job. Open a profile to review metrics and
              settings.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <AiEmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Activity feed</CardTitle>
            <CardDescription>
              Recent workforce events and recommendations
            </CardDescription>
          </div>
          <Link href="/dashboard/ai-workforce/command">
            <Button variant="outline" size="sm">
              Ask the team
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <AiActivityFeed items={AI_ACTIVITY_PREVIEW} />
        </CardContent>
      </Card>
    </div>
  );
}
