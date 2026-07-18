"use client";

import {
  createInvoiceAction,
  downloadInvoiceTextAction,
  recordPaymentAction,
  refundPaymentAction,
  type CommerceActionState,
} from "@/lib/actions/commerce";
import type { CommerceDashboardSnapshot } from "@/lib/commerce/types";
import {
  APPOINTMENT_PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  centsToDollars,
} from "@/lib/commerce/types";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Banknote,
  FileText,
  Receipt,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

const initial: CommerceActionState = {};

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border/80 bg-background px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function PaymentsDashboard({
  snapshot,
}: {
  snapshot: CommerceDashboardSnapshot;
}) {
  const [payState, payAction, payPending] = useActionState(
    recordPaymentAction,
    initial,
  );
  const [refundState, refundAction, refundPending] = useActionState(
    refundPaymentAction,
    initial,
  );
  const [viewer, setViewer] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [invoiceApptId, setInvoiceApptId] = useState("");
  const [invoiceMsg, setInvoiceMsg] = useState<CommerceActionState>({});

  function openText(title: string, body: string) {
    setViewer({ title, body });
  }

  return (
    <div className="space-y-8">
      {!snapshot.schemaReady ? (
        <div
          className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
          role="status"
        >
          {snapshot.schemaMessage}
        </div>
      ) : null}

      <div className="rounded-[var(--radius-lg)] border border-border bg-gradient-to-br from-muted/40 via-background to-background p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Banknote className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Commerce
              </h2>
              <p className="text-sm text-muted-foreground">
                Payments & billing for {snapshot.businessName} — part of every
                customer journey
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Provider: {snapshot.provider.active}
                {snapshot.provider.stripeConfigured
                  ? " · Stripe configured"
                  : " · Stripe key not set (manual methods active)"}
                {" · "}
                Updated {format(new Date(snapshot.generatedAt), "MMM d · h:mm a")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/clients"
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              CRM accounts
            </Link>
            <Link
              href="/dashboard/workforce/chase"
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open Chase
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Revenue today"
            value={centsToDollars(snapshot.revenueTodayCents)}
          />
          <Metric
            label="Revenue this week"
            value={centsToDollars(snapshot.revenueWeekCents)}
          />
          <Metric
            label="Revenue this month"
            value={centsToDollars(snapshot.revenueMonthCents)}
          />
          <Metric
            label="Avg transaction"
            value={
              snapshot.averageTransactionCents != null
                ? centsToDollars(snapshot.averageTransactionCents)
                : "—"
            }
          />
          <Metric
            label="Outstanding invoices"
            value={centsToDollars(snapshot.outstandingInvoicesCents)}
            hint={`${snapshot.outstandingInvoicesCount} open`}
          />
          <Metric
            label="Outstanding deposits"
            value={centsToDollars(snapshot.outstandingDepositsCents)}
            hint={`${snapshot.outstandingDepositsCount} bookings`}
          />
          <Metric
            label="Refunds (month)"
            value={centsToDollars(snapshot.refundsMonthCents)}
          />
          <Metric
            label="Avg customer value"
            value={
              snapshot.averageCustomerValueCents != null
                ? centsToDollars(snapshot.averageCustomerValueCents)
                : "—"
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" aria-hidden />
              Record payment
            </CardTitle>
            <CardDescription>
              Cash, e-transfer, gift card, store credit, or card (Stripe when
              configured). Never stores card numbers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={payAction} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  name="customer_id"
                  placeholder="Customer ID"
                  required
                  aria-label="Customer ID"
                />
                <Input
                  name="appointment_id"
                  placeholder="Appointment ID (optional)"
                  aria-label="Appointment ID"
                />
                <Input
                  name="amount"
                  placeholder="Amount"
                  required
                  inputMode="decimal"
                  aria-label="Amount"
                />
                <select
                  name="method"
                  className="h-10 rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
                  defaultValue="cash"
                  aria-label="Payment method"
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  name="kind"
                  className="h-10 rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm sm:col-span-2"
                  defaultValue="payment"
                  aria-label="Payment kind"
                >
                  <option value="payment">Payment</option>
                  <option value="deposit">Deposit</option>
                </select>
                <Input
                  name="description"
                  placeholder="Description"
                  className="sm:col-span-2"
                  aria-label="Description"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" name="force_manual" value="1" />
                Record card as manual POS (skip Stripe intent)
              </label>
              <AlertMessage error={payState.error} success={payState.success} />
              {payState.requiresAction ? (
                <p className="text-xs text-muted-foreground">
                  Client secret ready for Stripe Elements — complete collection
                  on the client.
                </p>
              ) : null}
              <Button type="submit" size="sm" disabled={payPending}>
                {payPending ? "Recording…" : "Record payment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCcw className="size-4" aria-hidden />
              Refund workflow
            </CardTitle>
            <CardDescription>
              Full or partial refunds with reason, approval, and audit history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={refundAction} className="space-y-3">
              <Input
                name="transaction_id"
                placeholder="Transaction ID"
                required
                aria-label="Transaction ID"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  name="amount"
                  placeholder="Refund amount"
                  required
                  inputMode="decimal"
                  aria-label="Refund amount"
                />
                <select
                  name="approval"
                  className="h-10 rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
                  defaultValue="approved"
                  aria-label="Approval"
                >
                  <option value="approved">Approve now</option>
                  <option value="pending">Pending approval</option>
                </select>
              </div>
              <Input
                name="reason"
                placeholder="Reason (required)"
                required
                aria-label="Refund reason"
              />
              <AlertMessage
                error={refundState.error}
                success={refundState.success}
              />
              <Button type="submit" size="sm" variant="outline" disabled={refundPending}>
                {refundPending ? "Processing…" : "Process refund"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" aria-hidden />
            Generate invoice from appointment
          </CardTitle>
          <CardDescription>
            Professional invoice with business/customer details, services, tax,
            discounts, payments, and balance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Input
            value={invoiceApptId}
            onChange={(e) => setInvoiceApptId(e.target.value)}
            placeholder="Appointment ID"
            className="max-w-sm"
            aria-label="Appointment ID for invoice"
          />
          <Button
            type="button"
            size="sm"
            disabled={pending || !invoiceApptId.trim()}
            onClick={() => {
              startTransition(async () => {
                const res = await createInvoiceAction(invoiceApptId.trim());
                setInvoiceMsg(res);
              });
            }}
          >
            Create invoice
          </Button>
          <AlertMessage error={invoiceMsg.error} success={invoiceMsg.success} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction history</CardTitle>
            <CardDescription>Recent ledger activity</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <ul className="divide-y divide-border" role="list">
                {snapshot.recentTransactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums">
                        {centsToDollars(tx.amountCents)} ·{" "}
                        {PAYMENT_METHOD_LABELS[tx.method]}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tx.kind} · {tx.status} · {tx.id.slice(0, 8)}…
                        {tx.description ? ` · ${tx.description}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(tx.occurredAt), "MMM d")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outstanding invoices</CardTitle>
            <CardDescription>Open balances</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.openInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open invoices.</p>
            ) : (
              <ul className="divide-y divide-border" role="list">
                {snapshot.openInvoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.status} · balance {centsToDollars(inv.balanceCents)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const res = await downloadInvoiceTextAction(inv.id);
                          if (res.text) {
                            openText(`Invoice ${inv.invoiceNumber}`, res.text);
                          }
                        });
                      }}
                    >
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-4" aria-hidden />
            Recent refunds
          </CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.recentRefunds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No refunds yet.</p>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {snapshot.recentRefunds.map((r) => (
                <li key={r.id} className="py-2.5 text-sm">
                  <p className="font-medium tabular-nums">
                    {centsToDollars(r.amountCents)} · {r.refundType} ·{" "}
                    {r.approvalStatus}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Booking statuses:{" "}
        {Object.values(APPOINTMENT_PAYMENT_STATUS_LABELS).join(" · ")}
      </p>

      {viewer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="commerce-viewer-title"
          onClick={() => setViewer(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setViewer(null);
          }}
        >
          <div
            className={cn(
              "max-h-[85vh] w-full max-w-lg overflow-auto rounded-[var(--radius-lg)] border border-border bg-background p-5 shadow-lg",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3
                id="commerce-viewer-title"
                className="text-base font-semibold"
              >
                {viewer.title}
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setViewer(null)}
              >
                Close
              </Button>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
              {viewer.body}
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(viewer.body);
                }}
              >
                Copy
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const blob = new Blob([viewer.body], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${viewer.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
