"use client";

import type { getBookingSheetCustomerSnapshot } from "@/lib/actions/booking-sheet";
import type { Customer } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { Mail, Phone, Wallet } from "lucide-react";
import Link from "next/link";

type Snapshot = NonNullable<
  Awaited<ReturnType<typeof getBookingSheetCustomerSnapshot>>
>;

/**
 * Compact customer context for appointment management — not full CRM.
 */
export function AppointmentCustomerContext({
  customer,
  snapshot,
  loading,
  className,
}: {
  customer: Customer | null;
  snapshot: Snapshot | null;
  loading?: boolean;
  className?: string;
}) {
  if (!customer) return null;

  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-border/70 bg-muted/10 px-3 py-3 space-y-2",
        className,
      )}
      aria-label="Customer context"
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Customer
      </p>
      <p className="text-sm font-semibold tracking-tight">{customer.name}</p>
      <div className="space-y-1 text-xs text-muted-foreground">
        {customer.phone ? (
          <p className="flex items-center gap-1.5">
            <Phone className="size-3" aria-hidden />
            {customer.phone}
          </p>
        ) : null}
        {customer.email ? (
          <p className="flex items-center gap-1.5 truncate">
            <Mail className="size-3" aria-hidden />
            {customer.email}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <span>
          Upcoming:{" "}
          <span className="font-medium text-foreground">
            {loading ? "…" : (snapshot?.upcomingCount ?? 0)}
          </span>
        </span>
        {(snapshot?.outstandingBalanceCount ?? 0) > 0 ? (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
            <Wallet className="size-3" aria-hidden />
            {snapshot!.outstandingBalanceCount} balance due
          </span>
        ) : null}
      </div>
      <Link
        href={`/dashboard/clients/${customer.id}`}
        className="inline-flex min-h-10 items-center px-2 text-xs font-medium text-primary hover:underline"
      >
        View customer
      </Link>
    </section>
  );
}
