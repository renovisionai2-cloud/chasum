"use client";

import { CollectPaymentWorkspace } from "@/components/commerce/collect-payment-workspace";
import { RefundTransactionSheet } from "@/components/commerce/refund-transaction-sheet";
import {
  createInvoiceAction,
  downloadInvoiceTextAction,
  type CommerceActionState,
} from "@/lib/actions/commerce";
import type { FrontDeskAppointmentOption } from "@/lib/commerce/front-desk";
import {
  ledgerKindLabel,
  ledgerReasonLabel,
  transactionStatusLabel,
} from "@/lib/commerce/front-desk";
import {
  isRefundableTransaction,
  remainingRefundableCents,
} from "@/lib/commerce/refundability";
import type {
  CommerceDashboardSnapshot,
  CommerceTransaction,
} from "@/lib/commerce/types";
import {
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
import type { Customer } from "@/lib/types/booking";
import { format } from "date-fns";
import { Banknote, FileText, Receipt } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

type FilterKey =
  | "all"
  | "payment"
  | "deposit"
  | "refund"
  | "succeeded"
  | "failed"
  | "requires_action";

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
  customers = [],
  seedCustomers = [],
  initialCustomerId = "",
  initialAppointmentId = "",
  outstandingBalances = [],
  outstandingDeposits = [],
  appointmentLabels = {},
}: {
  snapshot: CommerceDashboardSnapshot;
  customers?: Array<{ id: string; label: string }>;
  seedCustomers?: Customer[];
  initialCustomerId?: string;
  initialAppointmentId?: string;
  outstandingBalances?: FrontDeskAppointmentOption[];
  outstandingDeposits?: FrontDeskAppointmentOption[];
  appointmentLabels?: Record<string, string>;
}) {
  const money = (cents: number) => centsToDollars(cents, snapshot.currency);
  const [collectOpen, setCollectOpen] = useState(
    Boolean(initialCustomerId || initialAppointmentId),
  );
  const [collectIntent, setCollectIntent] = useState<"payment" | "deposit">(
    "payment",
  );
  const [collectCustomerId, setCollectCustomerId] = useState(initialCustomerId);
  const [collectAppointmentId, setCollectAppointmentId] = useState(
    initialAppointmentId,
  );
  const [collectCustomerName, setCollectCustomerName] = useState(
    customers.find((c) => c.id === initialCustomerId)?.label ?? "",
  );
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [viewer, setViewer] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [invoiceMsg, setInvoiceMsg] = useState<CommerceActionState>({});
  const [refundTarget, setRefundTarget] = useState<CommerceTransaction | null>(
    null,
  );

  const customerLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customers) map.set(c.id, c.label);
    return map;
  }, [customers]);

  const filteredTx = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snapshot.recentTransactions.filter((tx) => {
      if (filter === "payment" && tx.kind !== "payment") return false;
      if (filter === "deposit" && tx.kind !== "deposit") return false;
      if (filter === "refund" && tx.kind !== "refund") return false;
      if (filter === "succeeded" && tx.status !== "succeeded") return false;
      if (filter === "failed" && tx.status !== "failed") return false;
      if (filter === "requires_action" && tx.status !== "requires_action") {
        return false;
      }
      if (!q) return true;
      const hay = [
        customerLabelById.get(tx.customerId),
        appointmentLabels[tx.appointmentId ?? ""],
        PAYMENT_METHOD_LABELS[tx.method],
        ledgerKindLabel(tx.kind),
        ledgerReasonLabel(tx.description),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [
    snapshot.recentTransactions,
    filter,
    query,
    customerLabelById,
    appointmentLabels,
  ]);

  function openCollect(input: {
    customerId?: string;
    appointmentId?: string;
    intent?: "payment" | "deposit";
  }) {
    setCollectIntent(input.intent ?? "payment");
    setCollectCustomerId(input.customerId ?? "");
    setCollectAppointmentId(input.appointmentId ?? "");
    setCollectCustomerName(
      input.customerId
        ? (customerLabelById.get(input.customerId) ?? "")
        : "",
    );
    setCollectOpen(true);
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
              <h2 className="text-lg font-semibold tracking-tight">Payments</h2>
              <p className="text-sm text-muted-foreground">
                Collect, refund, and follow outstanding balances for{" "}
                {snapshot.businessName}
              </p>
            </div>
          </div>
          <Button type="button" onClick={() => openCollect({})} className="min-h-11">
            Collect payment
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="Gross payments collected this month"
            value={money(snapshot.revenueMonthCents)}
            hint={`Gross payments collected today ${money(snapshot.revenueTodayCents)}`}
          />
          <Metric
            label="Outstanding appointment balances"
            value={money(snapshot.outstandingAppointmentBalancesCents)}
            hint={`${snapshot.outstandingAppointmentBalancesCount} bookings`}
          />
          <Metric
            label="Outstanding deposits"
            value={money(snapshot.outstandingDepositsCents)}
            hint={`${snapshot.outstandingDepositsCount} required deposits due now`}
          />
          <Metric
            label="Outstanding invoices"
            value={money(snapshot.outstandingInvoicesCents)}
            hint={`${snapshot.outstandingInvoicesCount} commerce invoices`}
          />
          <Metric
            label="Refunds (month)"
            value={money(snapshot.refundsMonthCents)}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <QueueCard
          title="Outstanding appointment balances"
          empty="No outstanding appointment balances."
          rows={outstandingBalances}
          money={money}
          actionLabel="Collect payment"
          onAction={(row) =>
            openCollect({ customerId: row.customerId, appointmentId: row.id })
          }
        />
        <QueueCard
          title="Outstanding deposits"
          empty="No deposits are currently due."
          rows={outstandingDeposits}
          money={money}
          deposit
          actionLabel="Collect deposit"
          onAction={(row) =>
            openCollect({
              customerId: row.customerId,
              appointmentId: row.id,
              intent: "deposit",
            })
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
          <CardDescription>
            Payments, deposits, and refunds stay on separate rows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, service, method…"
              aria-label="Search transactions"
              className="sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "All"],
                  ["payment", "Payments"],
                  ["deposit", "Deposits"],
                  ["refund", "Refunds"],
                  ["succeeded", "Succeeded"],
                  ["failed", "Failed"],
                  ["requires_action", "Needs action"],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={filter === key ? "primary" : "outline"}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          {filteredTx.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent transactions match these filters.
            </p>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {filteredTx.map((tx) => {
                const remaining = remainingRefundableCents(
                  tx,
                  snapshot.recentRefunds,
                );
                const refundable =
                  isRefundableTransaction(tx) && remaining > 0;
                const refundState = !isRefundableTransaction(tx)
                  ? null
                  : remaining <= 0
                    ? "Refunded"
                    : remaining < tx.amountCents
                      ? "Partially refunded"
                      : "Refundable";
                return (
                  <li
                    key={tx.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums">
                        {ledgerKindLabel(tx.kind)} · {money(tx.amountCents)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transactionStatusLabel(tx.status)}
                        {refundState ? ` · ${refundState}` : ""}
                        {` · ${PAYMENT_METHOD_LABELS[tx.method]}`}
                        {customerLabelById.get(tx.customerId)
                          ? ` · ${customerLabelById.get(tx.customerId)}`
                          : ""}
                        {tx.appointmentId && appointmentLabels[tx.appointmentId]
                          ? ` · ${appointmentLabels[tx.appointmentId]}`
                          : ""}
                        {ledgerReasonLabel(tx.description)
                          ? ` · ${ledgerReasonLabel(tx.description)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(tx.occurredAt), "MMM d")}
                      </span>
                      {refundable ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setRefundTarget(tx)}
                        >
                          Refund
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" aria-hidden />
            Outstanding invoices
          </CardTitle>
          <CardDescription>
            Commerce invoices only — not booking balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snapshot.openInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open invoices.</p>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {snapshot.openInvoices.map((inv) => {
                const custName =
                  (inv.customerSnapshot?.name as string | null | undefined) ??
                  customerLabelById.get(inv.customerId) ??
                  null;
                return (
                  <li
                    key={inv.id}
                    className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {custName ? `${custName} · ` : ""}
                        {transactionStatusLabel(inv.status)} · total{" "}
                        {money(inv.totalCents)} · paid {money(inv.amountPaidCents)}{" "}
                        · balance {money(inv.balanceCents)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inv.appointmentId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openCollect({
                              customerId: inv.customerId,
                              appointmentId: inv.appointmentId ?? "",
                            })
                          }
                        >
                          Collect payment
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const res = await downloadInvoiceTextAction(inv.id);
                            if (res.text) {
                              setViewer({
                                title: `Invoice ${inv.invoiceNumber}`,
                                body: res.text,
                              });
                            }
                          });
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

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
                    Refund · {money(r.amountCents)} ·{" "}
                    {transactionStatusLabel(String(r.status))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.refundType === "full" ? "Full" : "Partial"}
                    {r.reason ? ` · Reason: ${r.reason}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {collectAppointmentId ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              const id = collectAppointmentId;
              startTransition(async () => {
                setInvoiceMsg(await createInvoiceAction(id));
              });
            }}
          >
            Create invoice for selected appointment
          </Button>
          <AlertMessage error={invoiceMsg.error} success={invoiceMsg.success} />
        </div>
      ) : null}

      <CollectPaymentWorkspace
        key={`${collectOpen}-${collectCustomerId}-${collectAppointmentId}-${collectIntent}`}
        open={collectOpen}
        onClose={() => setCollectOpen(false)}
        currency={snapshot.currency}
        initialCustomerId={collectCustomerId}
        initialCustomerName={collectCustomerName}
        initialAppointmentId={collectAppointmentId}
        seedCustomers={seedCustomers}
        intent={collectIntent}
      />

      {refundTarget ? (
        <RefundTransactionSheet
          open
          onClose={() => setRefundTarget(null)}
          transaction={refundTarget}
          refunds={snapshot.recentRefunds}
          currency={snapshot.currency}
          customerLabel={customerLabelById.get(refundTarget.customerId) ?? null}
          appointmentLabel={
            refundTarget.appointmentId
              ? (appointmentLabels[refundTarget.appointmentId] ??
                "Linked appointment")
              : null
          }
        />
      ) : null}

      {viewer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="commerce-viewer-title"
          onClick={() => setViewer(null)}
        >
          <div
            className={cn(
              "max-h-[85vh] w-full max-w-lg overflow-auto rounded-[var(--radius-lg)] border border-border bg-background p-5 shadow-lg",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 id="commerce-viewer-title" className="text-base font-semibold">
                {viewer.title}
              </h3>
              <Button type="button" size="sm" variant="outline" onClick={() => setViewer(null)}>
                Close
              </Button>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
              {viewer.body}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QueueCard({
  title,
  empty,
  rows,
  money,
  onAction,
  actionLabel,
  deposit,
}: {
  title: string;
  empty: string;
  rows: FrontDeskAppointmentOption[];
  money: (cents: number) => string;
  onAction: (row: FrontDeskAppointmentOption) => void;
  actionLabel: string;
  deposit?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y divide-border" role="list">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{row.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.serviceName} · {row.whenLabel} · {row.paymentStatusLabel}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {deposit
                      ? `Deposit due ${money(row.depositDueNowCents)} · required ${money(row.depositRequiredCents)}`
                      : `Total ${money(row.totalCents)} · Paid ${money(row.paidCents)} · Balance ${money(row.remainingCents)}`}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(row)}
                >
                  {actionLabel}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
