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
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

type ProfilePayload = NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;

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
        description="Search above to view contact details and history."
      />
    );
  }

  const profile = cache?.id === customer.id ? cache.profile : null;
  const prefs = preferredFromHistory(profile?.appointments ?? []);
  const upcoming = profile?.upcoming?.slice(0, 3) ?? [];
  const history = profile?.history?.slice(0, 3) ?? [];
  const metrics = profile?.metrics;

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-muted/20 p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {customer.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">{customer.name}</p>
            <Link
              href={`/dashboard/clients/${customer.id}`}
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              Profile
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {pending && !profile ? (
            <p className="text-xs text-muted-foreground">Loading profile…</p>
          ) : null}
        </div>
      </div>

      {metrics ? (
        <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-md)] border border-border/70 bg-card/60 px-2 py-2 text-center">
          <div>
            <p className="text-sm font-semibold tabular-nums">
              {metrics.totalVisits}
            </p>
            <p className="text-[10px] text-muted-foreground">Visits</p>
          </div>
          <div>
            <p className="text-sm font-semibold tabular-nums">
              ${metrics.lifetimeRevenue.toFixed(0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Revenue</p>
          </div>
          <div>
            <p className="text-sm font-semibold tabular-nums">
              {metrics.cancellationCount}
            </p>
            <p className="text-[10px] text-muted-foreground">Cancels</p>
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 truncate">
          <Mail className="h-3.5 w-3.5 shrink-0" /> {customer.email}
        </p>
        {customer.phone ? (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0" /> {customer.phone}
          </p>
        ) : null}
        {prefs.preferredStaffName ? (
          <p className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0" /> Preferred staff:{" "}
            {prefs.preferredStaffName}
          </p>
        ) : null}
        {prefs.preferredServiceName ? (
          <p className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 shrink-0" /> Preferred service:{" "}
            {prefs.preferredServiceName}
          </p>
        ) : null}
        {prefs.preferredLocationName ? (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />{" "}
            {prefs.preferredLocationName}
          </p>
        ) : null}
        {(profile?.customer.referral_source || customer.referral_source) ? (
          <p className="text-xs">
            Referral:{" "}
            {profile?.customer.referral_source || customer.referral_source}
          </p>
        ) : null}
      </div>

      {(profile?.customer.notes || customer.notes) && (
        <div>
          <p className="ds-label mb-1">Internal notes</p>
          <p className="text-xs text-muted-foreground">
            {profile?.customer.notes || customer.notes}
          </p>
        </div>
      )}

      <div>
        <p className="ds-label mb-1.5">Upcoming</p>
        {upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground">None scheduled.</p>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map((appt) => (
              <li
                key={appt.id}
                className="flex items-center justify-between gap-2 text-xs"
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

      <div>
        <p className="ds-label mb-1.5">History</p>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No past visits.</p>
        ) : (
          <ul className="space-y-1.5">
            {history.map((appt) => (
              <li
                key={appt.id}
                className="flex items-center justify-between gap-2 text-xs"
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
    </div>
  );
}
