import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import type {
  HqSnapshot,
  PipelineStage,
  RiskLevel,
} from "@/lib/hq/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Flag,
  HeartPulse,
  Inbox,
  Map,
  MessageSquare,
  Rocket,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";

const PIPELINE_ORDER: { key: PipelineStage; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "interview", label: "Interview Scheduled" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
  { key: "onboarded", label: "Onboarded" },
];

function riskClass(risk: RiskLevel): string {
  if (risk === "critical" || risk === "high") {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  if (risk === "medium") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
}

function severityClass(severity: string): string {
  if (severity === "critical") {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  if (severity === "high") {
    return "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300";
  }
  if (severity === "medium") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "bg-muted text-muted-foreground";
}

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ProgressRing({
  pct,
  label,
  tone,
}: {
  pct: number;
  label: string;
  tone: "success" | "warning" | "muted";
}) {
  const color =
    tone === "success"
      ? "stroke-success"
      : tone === "warning"
        ? "stroke-amber-500"
        : "stroke-muted-foreground/50";
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-6 py-8">
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            className="stroke-muted/60"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            className={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight">{pct}%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground">{label}</p>
    </div>
  );
}

export function HqWorkspace({ snapshot }: { snapshot: HqSnapshot }) {
  const { executive: ex } = snapshot;
  const generated = format(new Date(snapshot.generatedAt), "MMM d · HH:mm");

  return (
    <div className="ds-page space-y-12 pb-16">
      <PageHeader
        title="Chasum HQ"
        description="Founder operating system — pipeline, health, revenue, and launch readiness. Internal only."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Updated {generated}
          </Badge>
          <Link
            href="/owner"
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Owner Platform
          </Link>
        </div>
      </PageHeader>

      <nav
        className="flex flex-wrap gap-2 border-b border-border/60 pb-4"
        aria-label="HQ sections"
      >
        {[
          ["executive", "Executive"],
          ["pipeline", "Pipeline"],
          ["health", "Customer Health"],
          ["revenue", "Revenue"],
          ["product", "Product"],
          ["roadmap", "Roadmap"],
          ["launch", "Launch"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

      <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {snapshot.dataSources.note} Metrics source:{" "}
        <span className="font-medium text-foreground">
          {snapshot.dataSources.platformMetrics}
        </span>
        .
      </p>

      {/* —— Executive —— */}
      <Section
        id="executive"
        eyebrow="Command"
        title="Executive Dashboard"
        description="The company at a glance."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Applications"
            value={String(ex.applications)}
            icon={Inbox}
            description="Design partner pipeline"
          />
          <StatCard
            title="Accepted"
            value={String(ex.accepted)}
            icon={CheckCircle2}
            accent="success"
            description="Accepted + onboarded"
          />
          <StatCard
            title="Active Businesses"
            value={String(ex.activeBusinesses)}
            icon={Building2}
            description="Platform tenants"
          />
          <StatCard
            title="Weekly Active"
            value={String(ex.weeklyActive)}
            icon={Users}
            accent="spark"
            description="Engaged partners / signups"
          />
          <StatCard
            title="MRR"
            value={ex.mrrLabel}
            icon={CircleDollarSign}
            href="/owner/revenue"
            description="Estimated list-price MRR"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Bookings (7d)"
            value={String(ex.bookings7d)}
            icon={ClipboardList}
            description="Platform appointments created"
          />
          <StatCard
            title="Summer Conversations"
            value={String(ex.summerConversations)}
            icon={Sparkles}
            description="Early Access receptionist"
          />
          <StatCard
            title="Chase Reports"
            value={String(ex.chaseReports)}
            icon={Activity}
            description="Ops insight sessions"
          />
          <StatCard
            title="Support Tickets"
            value={String(ex.supportTickets)}
            icon={Ticket}
            accent={ex.supportTickets > 3 ? "warning" : "primary"}
            description="Open partner issues"
          />
          <StatCard
            title="Production Health"
            value={
              ex.productionHealth === "healthy"
                ? "Healthy"
                : ex.productionHealth === "degraded"
                  ? "Degraded"
                  : "Down"
            }
            icon={HeartPulse}
            accent={ex.productionHealth === "healthy" ? "success" : "warning"}
            href="/owner/health"
            description={ex.productionHealthLabel}
          />
        </div>
      </Section>

      {/* —— Pipeline —— */}
      <Section
        id="pipeline"
        eyebrow="Growth"
        title="Design Partner Pipeline"
        description="Applications from Applied → Onboarded."
      >
        <div className="grid gap-3 sm:grid-cols-5">
          {PIPELINE_ORDER.map((stage) => (
            <Card key={stage.key} className="border-border/70 shadow-none">
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {stage.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {snapshot.pipelineCounts[stage.key]}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden border-border/70 shadow-none">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border/60 bg-muted/40 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Business</th>
                    <th className="px-5 py-3 font-semibold">Industry</th>
                    <th className="px-5 py-3 font-semibold">Stage</th>
                    <th className="px-5 py-3 font-semibold">Volume</th>
                    <th className="px-5 py-3 font-semibold">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.applications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-foreground">
                          {app.businessName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.email}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {app.industry}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className="capitalize">
                          {app.stage.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {app.monthlyAppointments}/mo
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {app.appliedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* —— Customer Health —— */}
      <Section
        id="health"
        eyebrow="Success"
        title="Customer Health"
        description="Each design partner — activity, support, and risk."
      >
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Partner</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Weekly activity</th>
                  <th className="px-5 py-3 font-semibold">Last login</th>
                  <th className="px-5 py-3 font-semibold">Bookings</th>
                  <th className="px-5 py-3 font-semibold">Messages</th>
                  <th className="px-5 py-3 font-semibold">Support</th>
                  <th className="px-5 py-3 font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.partners.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/40 bg-card last:border-0"
                  >
                    <td className="px-5 py-3.5 font-medium">{p.businessName}</td>
                    <td className="px-5 py-3.5 capitalize text-muted-foreground">
                      {p.status.replace("_", " ")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${p.weeklyActivity}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {p.weeklyActivity}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {p.lastLogin}
                    </td>
                    <td className="px-5 py-3.5">{p.bookings7d}</td>
                    <td className="px-5 py-3.5">{p.messages7d}</td>
                    <td className="px-5 py-3.5">{p.supportOpen}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-lg px-2.5 py-0.5 text-xs font-medium capitalize",
                          riskClass(p.risk),
                        )}
                      >
                        {p.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* —— Revenue —— */}
      <Section
        id="revenue"
        eyebrow="Finance"
        title="Revenue"
        description="Platform MRR and booking velocity."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="MRR"
            value={ex.mrrLabel}
            icon={CircleDollarSign}
            accent="success"
            href="/owner/revenue"
            description="List-price estimate from Owner Platform"
          />
          <StatCard
            title="Bookings (7d)"
            value={String(ex.bookings7d)}
            icon={ClipboardList}
            description="Appointments created platform-wide"
          />
          <StatCard
            title="Active Businesses"
            value={String(ex.activeBusinesses)}
            icon={Building2}
            description="Paying / trial tenants in scope"
          />
          <StatCard
            title="Pipeline accepted"
            value={String(ex.accepted)}
            icon={Users}
            accent="spark"
            description="Design partners ready to convert"
          />
        </div>
      </Section>

      {/* —— Product Health —— */}
      <Section
        id="product"
        eyebrow="Engineering"
        title="Product Health"
        description="Readiness, bugs, and performance."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Production Readiness"
            value={`${snapshot.productHealth.productionReadinessPct}%`}
            icon={Rocket}
            accent="success"
            description="Post Milestone 6.1"
          />
          <StatCard
            title="Test Coverage"
            value="Critical"
            icon={CheckCircle2}
            description={snapshot.productHealth.testCoverageLabel}
          />
          <StatCard
            title="Deployment"
            value="Live"
            icon={Flag}
            description={snapshot.productHealth.deploymentStatus}
          />
          <StatCard
            title="Critical Bugs"
            value={String(snapshot.productHealth.criticalBugs)}
            icon={AlertTriangle}
            accent={
              snapshot.productHealth.criticalBugs > 0 ? "warning" : "success"
            }
          />
          <StatCard
            title="Open Bugs"
            value={String(snapshot.productHealth.openBugs)}
            icon={AlertTriangle}
          />
          <StatCard
            title="Performance"
            value="OK"
            icon={Activity}
            description={snapshot.productHealth.performanceLabel}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Critical & open bugs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.openBugs.map((bug) => (
                <div
                  key={bug.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/50 px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {bug.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {bug.area} · {bug.status.replace("_", " ")} ·{" "}
                      {bug.updatedAt}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase",
                      severityClass(bug.severity),
                    )}
                  >
                    {bug.severity}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-primary" />
                Feature requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.featureRequests.map((fr) => (
                <div
                  key={fr.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{fr.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {fr.source} · {fr.votes} votes
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {fr.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* —— Roadmap + Releases —— */}
      <Section
        id="roadmap"
        eyebrow="Product"
        title="Roadmap Progress"
        description="Completed · Current · Next · Future"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(["completed", "current", "next", "future"] as const).map((lane) => (
            <Card key={lane} className="border-border/70 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm capitalize">
                  <Map className="h-3.5 w-3.5 text-muted-foreground" />
                  {lane}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {snapshot.roadmap
                  .filter((item) => item.lane === lane)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground"
                    >
                      {item.title}
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Release notes
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {snapshot.releaseNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-border/60 px-4 py-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {note.version} · {note.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{note.date}</p>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {note.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex gap-2 text-xs text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>

      {/* —— Launch Readiness —— */}
      <Section
        id="launch"
        eyebrow="Go-to-market"
        title="Launch Readiness"
        description="Private Alpha · Closed Beta · Public Launch"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <ProgressRing
            pct={snapshot.launch.privateAlphaPct}
            label="Private Alpha"
            tone="success"
          />
          <ProgressRing
            pct={snapshot.launch.closedBetaPct}
            label="Closed Beta"
            tone="warning"
          />
          <ProgressRing
            pct={snapshot.launch.publicLaunchPct}
            label="Public Launch"
            tone="muted"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Private Alpha", snapshot.launch.privateAlphaNotes],
            ["Closed Beta", snapshot.launch.closedBetaNotes],
            ["Public Launch", snapshot.launch.publicLaunchNotes],
          ].map(([title, notes]) => (
            <Card key={title as string} className="border-border/70 shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">{title as string}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(notes as string[]).map((n) => (
                    <li
                      key={n}
                      className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {n}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
