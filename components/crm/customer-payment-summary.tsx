"use client";

import { formatMoneyCents } from "@/lib/commerce/money";
import { buildCustomerPaymentSummary } from "@/lib/crm/payment-summary";
import type { CustomerCommerceAccount } from "@/lib/commerce/types";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[4.5rem] flex-col justify-center rounded-[var(--radius-md)] border border-border/80 bg-background/70 px-3 py-2.5",
        emphasize && "border-amber-500/40 bg-amber-500/5",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

export function CustomerPaymentSummary({
  account,
  currency = "cad",
}: {
  account: CustomerCommerceAccount;
  currency?: string | null;
}) {
  const summary = buildCustomerPaymentSummary(account);

  return (
    <section
      aria-label="Payment summary"
      className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-sm sm:p-4"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Wallet className="size-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            Payment summary
          </h3>
          <p className="text-xs text-muted-foreground">
            Financial totals come from the commerce ledger.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <Metric
          label="Collected"
          value={formatMoneyCents(summary.collectedCents, currency)}
        />
        <Metric
          label="Appointment balance"
          value={formatMoneyCents(summary.outstandingCents, currency)}
          emphasize={summary.outstandingCents > 0}
        />
        <Metric
          label="Open invoices"
          value={String(summary.openInvoiceCount)}
        />
        <Metric
          label="Deposits"
          value={formatMoneyCents(summary.depositsCents, currency)}
        />
        <Metric
          label="Refunds"
          value={formatMoneyCents(summary.refundsCents, currency)}
        />
        <Metric
          label="Avg transaction"
          value={
            summary.averageTransactionCents != null
              ? formatMoneyCents(summary.averageTransactionCents, currency)
              : "Unavailable"
          }
        />
      </div>
    </section>
  );
}
