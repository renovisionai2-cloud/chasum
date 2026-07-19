import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { onboardingPct } from "@/lib/hq/private-alpha/snapshot";
import type {
  AlphaFeedback,
  AlphaPartner,
  FeedbackStatus,
  PrivateAlphaSnapshot,
  RiskLevel,
  SupportSeverity,
  SupportStatus,
} from "@/lib/hq/private-alpha/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Lock,
  MessageSquareText,
  NotebookPen,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";

function riskClass(risk: RiskLevel): string {
  if (risk === "critical" || risk === "high") {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  if (risk === "medium") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
}

function severityClass(severity: SupportSeverity): string {
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

function supportStatusLabel(status: SupportStatus): string {
  if (status === "reported") return "Reported";
  if (status === "assigned") return "Assigned";
  return "Resolved";
}

function feedbackLabel(status: FeedbackStatus): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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

function PartnerCard({ partner }: { partner: AlphaPartner }) {
  const pct = onboardingPct(partner);

  return (
    <Card
      id={`partner-${partner.code}`}
      className="scroll-mt-24 overflow-hidden border-border/70 shadow-none"
    >
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Partner {partner.code}
            </p>
            <CardTitle className="mt-1 text-lg tracking-tight">
              {partner.companyName}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {partner.industry}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {partner.status.replace("_", " ")}
            </Badge>
            <span
              className={cn(
                "inline-flex rounded-lg px-2.5 py-0.5 text-xs font-medium capitalize",
                riskClass(partner.risk),
              )}
            >
              {partner.risk} risk
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="ds-label">Primary contact</p>
            <p className="mt-1 text-sm font-medium">{partner.primaryContact}</p>
            <p className="text-xs text-muted-foreground">{partner.email}</p>
            <p className="text-xs text-muted-foreground">{partner.phone}</p>
          </div>
          <div>
            <p className="ds-label">Activity</p>
            <p className="mt-1 text-sm">
              First login · {partner.firstLogin ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Last · {partner.lastActivity ?? "—"}
            </p>
            <p className="mt-1 text-sm font-medium">
              {partner.weeklyActiveUsers} WAU
            </p>
          </div>
          <div>
            <p className="ds-label">Usage</p>
            <p className="mt-1 text-sm font-medium">
              {partner.bookingsCreated} bookings
            </p>
            <p className="text-sm text-muted-foreground">
              Revenue {partner.revenueProcessedLabel}
            </p>
          </div>
          <div>
            <p className="ds-label">Health</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {partner.healthScore}
            </p>
            <p className="text-xs text-muted-foreground">
              CSAT {partner.customerSatisfaction}% · Support{" "}
              {partner.supportTicketsOpen} · FR {partner.featureRequestsOpen} ·
              Bugs {partner.openBugs}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="ds-label">Onboarding progress</p>
            <p className="text-xs font-medium text-muted-foreground">{pct}%</p>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {partner.onboarding.map((step) => (
              <div
                key={step.key}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                  step.done
                    ? "border-border/50 bg-muted/30 text-foreground"
                    : "border-dashed border-border/60 text-muted-foreground",
                )}
              >
                <CheckCircle2
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    step.done ? "text-success" : "text-muted-foreground/40",
                  )}
                />
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 px-3.5 py-3">
            <p className="ds-label">Next meeting</p>
            <p className="mt-1 text-sm font-medium">
              {partner.nextMeeting ?? "Not scheduled"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 px-3.5 py-3 md:col-span-1">
            <p className="ds-label">Meeting notes</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {partner.meetingNotes}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const FEEDBACK_COLUMNS: FeedbackStatus[] = [
  "new",
  "under_review",
  "planned",
  "in_progress",
  "completed",
  "rejected",
];

function FeedbackBoard({ items }: { items: AlphaFeedback[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {FEEDBACK_COLUMNS.map((col) => {
        const colItems = items.filter((f) => f.status === col);
        return (
          <div
            key={col}
            className="rounded-2xl border border-border/70 bg-card/60 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {feedbackLabel(col)}
              </p>
              <span className="text-xs text-muted-foreground">
                {colItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {colItems.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-border/50 bg-background px-3 py-2.5"
                >
                  <p className="text-sm font-medium leading-snug">{f.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {f.partnerName}
                  </p>
                  {f.roadmapLabel ? (
                    <p className="mt-2 text-[11px] font-medium text-primary">
                      → {f.roadmapLabel}
                    </p>
                  ) : null}
                </div>
              ))}
              {colItems.length === 0 ? (
                <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">
                  Empty
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PrivateAlphaWorkspace({
  snapshot,
}: {
  snapshot: PrivateAlphaSnapshot;
}) {
  const generated = format(new Date(snapshot.generatedAt), "MMM d · HH:mm");
  const { totals, weeklyReport } = snapshot;
  const openSupport = snapshot.support.filter((s) => s.status !== "resolved");

  return (
    <div className="ds-page space-y-12 pb-16">
      <PageHeader
        title="Private Alpha"
        description="Founding Design Partner operations — onboarding, feedback, support, and weekly founder review. Internal only."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Updated {generated}
          </Badge>
          <Link
            href="/dashboard/hq"
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Chasum HQ
          </Link>
        </div>
      </PageHeader>

      <nav
        className="flex flex-wrap gap-2 border-b border-border/60 pb-4"
        aria-label="Private Alpha sections"
      >
        {[
          ["overview", "Overview"],
          ["partners", "Partners"],
          ["feedback", "Feedback"],
          ["support", "Support"],
          ["weekly", "Weekly Review"],
          ["notes", "Founder Notes"],
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

      <Section
        id="overview"
        eyebrow="Cohort"
        title="Four Founding Design Partners"
        description="Private Alpha management for GVM Baby World, CarStar, Shoppers, and Darshan's General Construction."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Partners"
            value={String(totals.partners)}
            icon={Building2}
            description={`${totals.active} active · ${totals.onboarding} onboarding`}
          />
          <StatCard
            title="Avg health"
            value={String(totals.avgHealth)}
            icon={HeartPulse}
            accent="success"
            description="Cohort health score"
          />
          <StatCard
            title="Open support"
            value={String(totals.openSupport)}
            icon={Ticket}
            accent={totals.openSupport > 2 ? "warning" : "primary"}
            description="Reported + assigned"
          />
          <StatCard
            title="Open feedback"
            value={String(totals.openFeedback)}
            icon={MessageSquareText}
            accent="spark"
            description="Excludes completed / rejected"
          />
        </div>

        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Onboarding</th>
                  <th className="px-4 py-3 font-semibold">WAU</th>
                  <th className="px-4 py-3 font-semibold">Bookings</th>
                  <th className="px-4 py-3 font-semibold">Health</th>
                  <th className="px-4 py-3 font-semibold">Risk</th>
                  <th className="px-4 py-3 font-semibold">Next meeting</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.partners.map((p) => (
                  <tr
                    key={p.code}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                      {p.code}
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={`#partner-${p.code}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {p.companyName}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {p.primaryContact}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 capitalize text-muted-foreground">
                      {p.status.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${onboardingPct(p)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {onboardingPct(p)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{p.weeklyActiveUsers}</td>
                    <td className="px-4 py-3.5">{p.bookingsCreated}</td>
                    <td className="px-4 py-3.5 font-medium">{p.healthScore}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-lg px-2.5 py-0.5 text-xs font-medium capitalize",
                          riskClass(p.risk),
                        )}
                      >
                        {p.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {p.nextMeeting ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section
        id="partners"
        eyebrow="Accounts"
        title="Design Partner dossiers"
        description="Full profile, onboarding checklist, and meeting context for each company."
      >
        <div className="space-y-6">
          {snapshot.partners.map((p) => (
            <PartnerCard key={p.code} partner={p} />
          ))}
        </div>
      </Section>

      <Section
        id="feedback"
        eyebrow="Product"
        title="Feedback system"
        description="Feature requests move New → Under Review → Planned → In Progress → Completed / Rejected, linked to roadmap when applicable."
      >
        <FeedbackBoard items={snapshot.feedback} />
      </Section>

      <Section
        id="support"
        eyebrow="Success"
        title="Support log"
        description="Every issue tracked: Reported → Assigned → Resolved. Severity Critical / High / Medium / Low."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            title="Open"
            value={String(openSupport.length)}
            icon={AlertTriangle}
            accent={openSupport.length ? "warning" : "success"}
          />
          <StatCard
            title="Assigned"
            value={String(
              openSupport.filter((s) => s.status === "assigned").length,
            )}
            icon={Users}
          />
          <StatCard
            title="Resolved (all time)"
            value={String(
              snapshot.support.filter((s) => s.status === "resolved").length,
            )}
            icon={CheckCircle2}
            accent="success"
          />
        </div>

        <Card className="overflow-hidden border-border/70 shadow-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-border/60 bg-muted/40 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Issue</th>
                    <th className="px-5 py-3 font-semibold">Partner</th>
                    <th className="px-5 py-3 font-semibold">Severity</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Assigned</th>
                    <th className="px-5 py-3 font-semibold">Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.support.map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="px-5 py-3.5 font-medium">{issue.title}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {issue.partnerName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase",
                            severityClass(issue.severity),
                          )}
                        >
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {supportStatusLabel(issue.status)}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {issue.assignedTo ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {issue.reportedAt}
                        {issue.resolvedAt ? (
                          <span className="block text-[11px]">
                            Resolved {issue.resolvedAt}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section
        id="weekly"
        eyebrow="Cadence"
        title="Weekly founder review"
        description={`Week of ${weeklyReport.weekOf} — wins, problems, requests, health, and usage per company.`}
      >
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Cohort summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {weeklyReport.summary}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {weeklyReport.companies.map((co) => (
            <Card key={co.partnerCode} className="border-border/70 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {co.partnerCode}
                    </p>
                    <CardTitle className="mt-1 text-base">
                      {co.companyName}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight">
                      {co.health}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Health</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <Activity className="mr-1 inline h-3 w-3" />
                  {co.usage}
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="ds-label mb-2">Wins</p>
                  <ul className="space-y-1.5">
                    {co.wins.map((w) => (
                      <li
                        key={w}
                        className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ds-label mb-2">Problems</p>
                  <ul className="space-y-1.5">
                    {co.problems.map((w) => (
                      <li
                        key={w}
                        className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="ds-label mb-2">Requested</p>
                  <ul className="space-y-1.5">
                    {co.requestedFeatures.map((w) => (
                      <li
                        key={w}
                        className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        <MessageSquareText className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        id="notes"
        eyebrow="Confidential"
        title="Founder notes"
        description="Private notes visible only to platform owners. Never shown to partners."
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Owner-only · not customer-facing
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {snapshot.founderNotes.map((note) => (
            <Card key={note.id} className="border-border/70 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <NotebookPen className="h-4 w-4 text-muted-foreground" />
                  {note.title}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  {note.partnerCode
                    ? `Partner ${note.partnerCode}`
                    : "Cohort-wide"}{" "}
                  · Updated {note.updatedAt}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {note.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
