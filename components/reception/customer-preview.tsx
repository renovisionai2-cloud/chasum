"use client";

import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { preferredFromHistory } from "@/lib/reception/preferences";
import { getCustomerProfile } from "@/lib/actions/customers";
import type { Customer } from "@/lib/types/booking";
import { format } from "date-fns";
import {
  Briefcase,
  CalendarDays,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

type ProfilePayload = NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;

function ProfileSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden="true">
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-10 rounded bg-muted" />
        <div className="h-10 rounded bg-muted" />
        <div className="h-10 rounded bg-muted" />
      </div>
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-4/5 rounded bg-muted" />
      <div className="h-16 rounded bg-muted" />
    </div>
  );
}

export function CustomerPreview({
  customer,
}: {
  customer: Customer | null;
}) {
  const [cache, setCache] = useState<{
    id: string;
    profile: ProfilePayload;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!customer) return;

    let cancelled = false;
    startTransition(async () => {
      const data = await getCustomerProfile(customer.id);
      if (!cancelled && data) {
        setCache({ id: customer.id, profile: data });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [customer]);

  if (!customer) {
    return (
      <EmptyState
        variant="inline"
        glyph={User}
        icon="none"
        title="Select a customer"
        description="Search above to view upcoming visits, history, notes, and preferences."
      />
    );
  }

  const profile = cache?.id === customer.id ? cache.profile : null;
  const prefs = preferredFromHistory(profile?.appointments ?? []);
  const upcoming = profile?.upcoming?.slice(0, 3) ?? [];
  const history = profile?.history?.slice(0, 3) ?? [];
  const metrics = profile?.metrics;
  const notes = profile?.customer.notes || customer.notes;
  const loading = pending && !profile;

  return (
    <div className="space-y-3.5 rounded-[var(--radius-md)] border border-border bg-muted/20 p-3.5 animate-fade-in-up"
      style={{ animationDuration: "220ms" }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {customer.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-base font-semibold tracking-tight">
              {customer.name}
            </p>
            <Link
              href={`/dashboard/clients/${customer.id}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-md text-[11px] font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Profile
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{" "}
              {customer.email}
            </p>
            {customer.phone ? (
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{" "}
                {customer.phone}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? <ProfileSkeleton /> : null}

      {!loading && metrics ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-border/70 bg-card/60 px-2 py-2 text-center transition-colors hover:border-border">
            <p className="text-sm font-semibold tabular-nums">
              {metrics.totalVisits}
            </p>
            <p className="text-[10px] text-muted-foreground">Visits</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border/70 bg-card/60 px-2 py-2 text-center transition-colors hover:border-border">
            <p className="text-sm font-semibold tabular-nums">
              ${metrics.lifetimeRevenue.toFixed(0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Revenue</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border/70 bg-card/60 px-2 py-2 text-center transition-colors hover:border-border">
            <p className="text-sm font-semibold tabular-nums">
              {metrics.upcomingCount}
            </p>
            <p className="text-[10px] text-muted-foreground">Upcoming</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border/70 bg-card/60 px-2 py-2 text-center transition-colors hover:border-border">
            <p className="text-sm font-semibold tabular-nums">
              {metrics.lastVisit
                ? format(parseISO(metrics.lastVisit), "MMM d")
                : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Last visit</p>
          </div>
        </div>
      ) : null}

      {!loading ? (
        <div className="space-y-1.5 text-xs text-muted-foreground">
          {prefs.preferredStaffName ? (
            <p className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{" "}
              Preferred staff:{" "}
              <span className="font-medium text-foreground">
                {prefs.preferredStaffName}
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> No
              preferred staff yet
            </p>
          )}
          {prefs.preferredServiceName ? (
            <p className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{" "}
              Preferred service:{" "}
              <span className="font-medium text-foreground">
                {prefs.preferredServiceName}
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{" "}
              No preferred service yet
            </p>
          )}
          {prefs.preferredLocationName ? (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{" "}
              {prefs.preferredLocationName}
            </p>
          ) : null}
          {metrics?.lastVisit ? (
            <p className="flex items-center gap-1.5">
              <CalendarDays
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />{" "}
              Last visit{" "}
              {format(parseISO(metrics.lastVisit), "MMM d, yyyy")}
            </p>
          ) : null}
        </div>
      ) : null}

      {!loading && notes ? (
        <div>
          <p className="ds-label mb-1">Notes</p>
          <p className="rounded-[var(--radius-md)] border border-border/60 bg-card/50 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground">
            {notes}
          </p>
        </div>
      ) : !loading ? (
        <div>
          <p className="ds-label mb-1">Notes</p>
          <p className="text-xs text-muted-foreground">No notes yet.</p>
        </div>
      ) : null}

      {!loading ? (
        <div>
          <p className="ds-label mb-1.5">Upcoming</p>
          {upcoming.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-border bg-muted/15 px-2.5 py-2 text-xs text-muted-foreground">
              None scheduled.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {upcoming.map((appt) => (
                <li
                  key={appt.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-transparent px-1 py-0.5 text-xs transition-colors hover:border-border hover:bg-card/50"
                >
                  <span className="min-w-0 truncate">
                    {format(parseISO(appt.start_time), "MMM d")} ·{" "}
                    {formatTime(parseISO(appt.start_time))}
                    {appt.service &&
                    typeof appt.service === "object" &&
                    "name" in appt.service
                      ? ` · ${(appt.service as { name?: string }).name}`
                      : ""}
                  </span>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {!loading ? (
        <div>
          <p className="ds-label mb-1.5">History</p>
          {history.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-border bg-muted/15 px-2.5 py-2 text-xs text-muted-foreground">
              No past visits.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {history.map((appt) => (
                <li
                  key={appt.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-transparent px-1 py-0.5 text-xs transition-colors hover:border-border hover:bg-card/50"
                >
                  <span className="min-w-0 truncate">
                    {format(parseISO(appt.start_time), "MMM d, yyyy")}
                    {appt.service &&
                    typeof appt.service === "object" &&
                    "name" in appt.service
                      ? ` · ${(appt.service as { name?: string }).name}`
                      : ""}
                  </span>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
