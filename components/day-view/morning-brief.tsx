"use client";

import { Button } from "@/components/ui/button";
import type { MorningBriefData } from "@/lib/actions/morning-brief";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ListOrdered,
  UserMinus,
  UserPlus,
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
  const s = brief.statusCounts;

  return (
    <section
      aria-label="Reception daily status"
      className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-gradient-to-br from-card via-card to-muted/30 p-3 shadow-sm sm:p-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="ds-label">Today’s operating centre</p>
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            {brief.dateLabel}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {brief.locationLabel}
            <span className="text-muted-foreground/80">
              {" "}
              · {brief.locationScopeNote}
            </span>
          </p>
          {brief.nextAppointmentClock ? (
            <p className="mt-2 text-sm text-foreground">
              <span className="font-medium">Next:</span>{" "}
              {brief.nextAppointmentClock}
              {brief.nextAppointmentCustomer
                ? ` · ${brief.nextAppointmentCustomer}`
                : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No upcoming appointments remaining today for this location scope.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/calendar?view=day&book=1">
            <Button className="min-h-[var(--touch-min)]">
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              New appointment
            </Button>
          </Link>
          <Link href="/dashboard/clients">
            <Button variant="outline" className="min-h-[var(--touch-min)]">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              New customer
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <Metric
          label="Scheduled"
          value={String(brief.todayAppointments)}
          hint="Active today"
          icon={CalendarCheck}
          tone="default"
        />
        <Metric
          label="Payment due"
          value={String(s.paymentAttention)}
          hint="From payment status"
          icon={Wallet}
          tone={s.paymentAttention > 0 ? "warning" : "default"}
        />
        <Metric
          label="Checked in"
          value={String(s.checkedIn)}
          icon={CheckCircle2}
          tone={s.checkedIn > 0 ? "success" : "default"}
        />
        <Metric
          label="In progress"
          value={String(s.inProgress)}
          icon={Clock}
        />
        <Metric
          label="Completed"
          value={String(s.completed)}
          icon={CheckCircle2}
          tone="success"
        />
        <Metric
          label="Cancelled"
          value={String(s.cancelled)}
          icon={UserMinus}
        />
        <Metric
          label="No-show"
          value={String(s.noShow)}
          icon={UserMinus}
          tone={s.noShow > 0 ? "danger" : "default"}
        />
        <Metric
          label="Unassigned"
          value={String(s.unassigned)}
          icon={Users}
          tone={s.unassigned > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div
          className={cn(
            "rounded-[var(--radius-md)] border bg-background/70 px-3 py-2.5",
            brief.attention.length > 0
              ? "border-amber-500/40"
              : "border-border",
          )}
        >
          <p className="text-xs font-semibold">Attention required</p>
          {brief.attention.length === 0 ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              No urgent Reception items right now.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {brief.attention.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="block rounded-[var(--radius-sm)] border border-border/80 bg-card px-2.5 py-2 text-sm transition-colors hover:border-primary/35 ds-focus-ring"
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.why}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border bg-background/70 px-3 py-2.5">
          <p className="text-xs font-semibold">Floor context</p>
          <p className="text-sm text-foreground">{brief.chase.recommendation}</p>
          <p className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" aria-hidden />
              {brief.staffWorking} staff working
            </span>
            <span className="inline-flex items-center gap-1">
              <ListOrdered className="size-3" aria-hidden />
              {brief.waitlistCount} on waitlist
            </span>
            {brief.pendingConfirmations > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-3" aria-hidden />
                {brief.pendingConfirmations} pending
              </span>
            ) : null}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Availability slot totals are not shown — open the booking sheet for
            real Availability Engine openings by service and employee.
          </p>
        </div>
      </div>
    </section>
  );
}
