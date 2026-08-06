"use client";

import { formatMoneyCents } from "@/lib/commerce/money";
import {
  buildCustomerPaymentSummary,
} from "@/lib/crm/payment-summary";
import type { CustomerCommerceAccount } from "@/lib/commerce/types";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

function Metric({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-border/80 bg-background/70 px-3 py-2.5",
        emphasize && "border-amber-500/35",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
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
      className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-gradient-to-br from-card via-card to-muted/25 p-3 shadow-sm sm:p-4"
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
            Collected payments from the commerce ledger — not appointment
            list prices and not labeled as revenue.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <Metric
          label="Collected"
          value={formatMoneyCents(summary.collectedCents, currency)}
          hint="Gross payments collected"
        />
        <Metric
          label="Outstanding"
          value={formatMoneyCents(summary.outstandingCents, currency)}
          hint="Balance still due"
          emphasize={summary.outstandingCents > 0}
        />
        <Metric
          label="Invoices"
          value={String(summary.invoiceCount)}
          hint={`${summary.openInvoiceCount} open`}
        />
        <Metric
          label="Deposits"
          value={formatMoneyCents(summary.depositsCents, currency)}
        />
        <Metric
          label="Refunds"
          value={formatMoneyCents(summary.refundsCents, currency)}
          hint={
            summary.refundCount > 0
              ? `${summary.refundCount} recorded`
              : undefined
          }
        />
        <Metric
          label="Avg transaction"
          value={
            summary.averageTransactionCents != null
              ? formatMoneyCents(summary.averageTransactionCents, currency)
              : "Unavailable"
          }
          hint={
            summary.averageTransactionCents == null
              ? "No succeeded transactions yet"
              : "Succeeded ledger average"
          }
        />
      </div>

      {(summary.storeCreditCents > 0 || summary.giftCardBalanceCents > 0) && (
        <p className="text-[11px] text-muted-foreground">
          {summary.storeCreditCents > 0
            ? `Store credit ${formatMoneyCents(summary.storeCreditCents, currency)}`
            : null}
          {summary.storeCreditCents > 0 && summary.giftCardBalanceCents > 0
            ? " · "
            : null}
          {summary.giftCardBalanceCents > 0
            ? `Gift card balance ${formatMoneyCents(summary.giftCardBalanceCents, currency)}`
            : null}
        </p>
      )}
    </section>
  );
}
