"use client";

import { CollectPaymentWorkspace } from "@/components/commerce/collect-payment-workspace";
import { RefundTransactionSheet } from "@/components/commerce/refund-transaction-sheet";
import {
  createInvoiceAction,
  type CommerceActionState,
} from "@/lib/actions/commerce";
import {
  invoiceWorkspacePath,
  receiptWorkspacePath,
} from "@/lib/commerce/document-paths";
import type { FrontDeskAppointmentOption } from "@/lib/commerce/front-desk";
import {
  ledgerKindLabel,
  ledgerReasonLabel,
  staffFacingContextLabel,
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
import type { Customer } from "@/lib/types/booking";
import { format } from "date-fns";
import { Banknote, FileText, Receipt } from "lucide-react";
import Link from "next/link";
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
        appointmentLabels[tx.appointmentId ?? ""]
          ? staffFacingContextLabel(appointmentLabels[tx.appointmentId ?? ""])
          : "",
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
            hint={`Gross payments collected today ${money(snapshot.revenueTodayCents)} · business timezone`}
          />
          <Metric
            label="Outstanding appointment balances"
            value={money(snapshot.outstandingAppointmentBalancesCents)}
            hint={`${snapshot.outstandingAppointmentBalancesCount} appointments`}
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
            hint="Shown separately — not subtracted from gross collected"
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
            Payments and Deposits exclude refunds. Succeeded includes successful
            payments, deposits, and refunds.
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
                const appointmentLabel = staffFacingContextLabel(
                  tx.appointmentId
                    ? appointmentLabels[tx.appointmentId]
                    : "",
                );
                const customerLabel =
                  customerLabelById.get(tx.customerId) ?? "";
                const reason =
                  tx.kind === "refund"
                    ? ledgerReasonLabel(tx.description)
                    : "";
                const signedAmount =
                  tx.kind === "refund"
                    ? `−${money(tx.amountCents)}`
                    : money(tx.amountCents);
                return (
                  <li
                    key={tx.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-medium">
                        <span>{ledgerKindLabel(tx.kind)}</span>
                        <span className="tabular-nums">{signedAmount}</span>
                      </p>
                      {(customerLabel || appointmentLabel) && (
                        <p className="text-sm text-foreground/90">
                          {[customerLabel, appointmentLabel]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[tx.method]}
                        {" · "}
                        {format(new Date(tx.occurredAt), "MMM d, h:mm a")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span>{transactionStatusLabel(tx.status)}</span>
                        {refundState ? (
                          <span>{` · ${refundState}`}</span>
                        ) : null}
                      </p>
                      {reason ? (
                        <p className="text-xs text-muted-foreground">
                          Reason: {reason}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {snapshot.receiptNumberByTransactionId?.[tx.id] ? (
                        <Link
                          href={receiptWorkspacePath(
                            snapshot.receiptNumberByTransactionId[tx.id],
                          )}
                          className="inline-flex h-10 items-center px-3 text-sm font-medium underline-offset-4 hover:underline"
                        >
                          View receipt
                        </Link>
                      ) : null}
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
                      <Link
                        href={invoiceWorkspacePath(inv.invoiceNumber)}
                        className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-border px-3.5 text-sm font-medium"
                      >
                        View
                      </Link>
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
                    Refund · −{money(r.amountCents)} ·{" "}
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
              ? staffFacingContextLabel(
                  appointmentLabels[refundTarget.appointmentId],
                ) || "Linked appointment"
              : null
          }
        />
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
