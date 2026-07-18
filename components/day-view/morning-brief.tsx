"use client";

import type { MorningBriefData } from "@/lib/actions/morning-brief";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  DollarSign,
  ListOrdered,
  Sparkles,
  TrendingUp,
  UserMinus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof CalendarCheck;
  tone?: "default" | "success" | "warning" | "danger" | "spark";
}) {
  const toneClass = {
    default: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-amber-700 bg-amber-500/10 dark:text-amber-300",
    danger: "text-destructive bg-destructive/10",
    spark: "text-spark bg-spark/10",
  }[tone];

  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-[var(--radius-md)] border border-border/80 bg-card px-2.5 py-2 shadow-xs">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
          toneClass,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold tabular-nums leading-tight">
          {value}
        </p>
        {hint ? (
          <p className="truncate text-[10px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export function MorningBrief({ brief }: { brief: MorningBriefData }) {
  const revenueDelta =
    brief.chase.revenueDeltaPct == null
      ? null
      : `${brief.chase.revenueDeltaPct > 0 ? "+" : ""}${brief.chase.revenueDeltaPct}%`;

  return (
    <section
      aria-label="Morning brief"
      className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-gradient-to-br from-card via-card to-muted/30 p-3 shadow-sm sm:p-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="ds-label">Control Center</p>
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            Morning Brief
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Dense snapshot for today&apos;s floor
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
        <Metric
          label="Appointments"
          value={String(brief.todayAppointments)}
          icon={CalendarCheck}
          tone="default"
        />
        <Metric
          label="Revenue"
          value={`$${brief.todayRevenue.toFixed(0)}`}
          icon={DollarSign}
          tone="success"
        />
        <Metric
          label="Staff working"
          value={String(brief.staffWorking)}
          icon={Users}
        />
        <Metric
          label="Available slots"
          value={String(brief.availableSlots)}
          icon={Clock}
          tone="warning"
        />
        <Metric
          label="Waitlist"
          value={String(brief.waitlistCount)}
          icon={ListOrdered}
          tone="spark"
        />
        <Metric
          label="No-shows"
          value={String(brief.noShows)}
          icon={UserMinus}
          tone={brief.noShows > 0 ? "danger" : "default"}
        />
        <Metric
          label="Outstanding"
          value={String(brief.outstandingPayments)}
          hint="Payments due"
          icon={Wallet}
          tone={brief.outstandingPayments > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Link
          href="/dashboard/calendar?view=day"
          className="group flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-background/70 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-spark/10 text-spark">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold">Summer activity</p>
            <p className="mt-0.5 text-sm text-foreground">
              {brief.summer.bookingsToday} bookings ·{" "}
              {brief.summer.reschedulesToday} reschedules ·{" "}
              {brief.summer.confirmationsToday} confirmations
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground group-hover:text-foreground">
              Opens Reception — Summer never books locally
            </p>
          </div>
        </Link>

        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-background/70 px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold">
              Chase insights
              {revenueDelta ? (
                <span className="ml-2 font-medium text-success">
                  Revenue {revenueDelta}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {brief.chase.recommendation}
            </p>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span>{brief.chase.availableSlots} open slots</span>
              {brief.chase.overdueCustomers > 0 ? (
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="size-3" aria-hidden />
                  {brief.chase.overdueCustomers} overdue
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
