import type { ReactNode } from "react";
import {
  queueReceiptEmailAction,
  type CommerceActionState,
} from "@/lib/actions/commerce";
import { invoiceWorkspacePath, receiptWorkspacePath } from "@/lib/commerce/document-paths";
import type { CustomerCommerceAccount } from "@/lib/commerce/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/commerce/types";
import { formatDocumentMoneyCents } from "@/lib/commerce/document-currency";
import { formatCommerceCivilDate } from "@/lib/commerce/document-dates";
import { formatMoneyCents } from "@/lib/commerce/money";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useState, useTransition } from "react";

export function CustomerCommercePanel({
  account,
  currency = "cad",
}: {
  customerId: string;
  account: CustomerCommerceAccount;
  currency?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [emailMsg, setEmailMsg] = useState<CommerceActionState>({});

  const money = (cents: number) => formatMoneyCents(cents, currency);
  const documentMoney = (cents: number, stored: string) =>
    formatDocumentMoneyCents(cents, stored, currency);
  const hasCollectibleObligation =
    account.outstandingAppointmentBalanceCents > 0 ||
    account.outstandingInvoiceCents > 0 ||
    account.outstandingDepositDueCents > 0;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Financial totals use the customer-money contract. Appointment remaining,
        invoice remaining, and deposit due now are separate — unpaid bookings
        are not invoices.
      </p>

      <section aria-label="Balance overview">
        <h3 className="mb-2 text-sm font-semibold">Balance overview</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Outstanding appointment balance"
            value={money(account.outstandingAppointmentBalanceCents)}
            emphasize={account.outstandingAppointmentBalanceCents > 0}
          />
          <Stat
            label="Outstanding invoices"
            value={money(account.outstandingInvoiceCents)}
            emphasize={account.outstandingInvoiceCents > 0}
          />
          <Stat
            label="Deposit due now"
            value={money(account.outstandingDepositDueCents)}
            emphasize={account.outstandingDepositDueCents > 0}
          />
          <Stat label="Deposits paid" value={money(account.depositsCents)} />
          <Stat label="Total paid" value={money(account.totalPaidCents)} />
          <Stat label="Store credit" value={money(account.storeCreditCents)} />
        </div>
      </section>

      {hasCollectibleObligation ? (
      <p className="rounded-[var(--radius-md)] border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        This customer has a balance due. Collect it from the appointment using
        Collect payment — do not record an unallocated amount here.
      </p>
      ) : (
      <p className="rounded-[var(--radius-md)] border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Paid in full — no outstanding appointment balance, invoice, or deposit
        due.
      </p>
      )}

      <Section title="Invoices">
        {account.invoices.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-2 font-medium">Invoice</th>
                  <th className="py-2 pr-2 font-medium">Status</th>
                  <th className="py-2 pr-2 font-medium">Issued</th>
                  <th className="py-2 pr-2 text-right font-medium">Total</th>
                  <th className="py-2 pr-2 text-right font-medium">Paid</th>
                  <th className="py-2 pr-2 text-right font-medium">Balance</th>
                  <th className="py-2 font-medium"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {account.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 pr-2 font-medium">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 pr-2">
                      {invoiceStatusLabel(inv.status)}
                    </td>
                    <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">
                      {formatCommerceCivilDate(inv.issueDate) ?? "—"}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">
                      {documentMoney(inv.totalCents, inv.currency)}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">
                      {documentMoney(inv.amountPaidCents, inv.currency)}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">
                      {documentMoney(inv.balanceCents, inv.currency)}
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={invoiceWorkspacePath(inv.invoiceNumber)}
                        className="inline-flex h-10 min-h-9 items-center rounded-[var(--radius-sm)] border border-border px-3.5 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Receipts">
        {account.receipts.length === 0 ? (
          <Empty />
        ) : (
          <ul className="divide-y divide-border">
            {account.receipts.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{r.receiptNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {documentMoney(r.amountCents, r.currency)} · {receiptEmailLabel(r.emailStatus)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={receiptWorkspacePath(r.receiptNumber)}
                    className="inline-flex h-10 min-h-9 items-center rounded-[var(--radius-sm)] border border-border px-3.5 text-sm font-medium"
                  >
                    View
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-9"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const res = await queueReceiptEmailAction(r.id);
                        setEmailMsg(res);
                      });
                    }}
                  >
                    Email receipt
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <AlertMessage error={emailMsg.error} success={emailMsg.success} />
      </Section>

      <Section title="Payment history">
        {account.timeline.length === 0 ? (
          <Empty />
        ) : (
          <ul className="divide-y divide-border">
            {account.timeline.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-2 gap-2 py-2.5 text-sm sm:grid-cols-5"
              >
                <span className="tabular-nums text-muted-foreground">
                  {format(new Date(t.occurredAt), "MMM d, yyyy")}
                </span>
                <span className="capitalize">{t.kind}</span>
                <span>{PAYMENT_METHOD_LABELS[t.method] ?? t.method}</span>
                <span className="font-medium tabular-nums">{money(t.amountCents)}</span>
                <span className="capitalize text-muted-foreground">
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {account.refunds.length > 0 ? (
        <Section title="Refunds">
          <ul className="space-y-2 text-sm">
            {account.refunds.map((r) => (
              <li key={r.id}>
                {money(r.amountCents)} · {r.refundType}
                {r.reason ? ` · ${r.reason}` : ""}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function Stat({
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
        "rounded-[var(--radius-md)] border border-border px-3 py-2.5",
        emphasize && "border-amber-500/35",
      )}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Empty() {
  return (
    <p className="text-sm text-muted-foreground">
      Nothing here yet — activity appears after bookings and payments.
    </p>
  );
}

function invoiceStatusLabel(status: string) {
  const map: Record<string, string> = {
    open: "Open",
    partial: "Partially paid",
    paid: "Paid",
    overdue: "Overdue",
    void: "Void",
    draft: "Draft",
  };
  return map[status] ?? status;
}

function receiptEmailLabel(status: string) {
  const map: Record<string, string> = {
    not_sent: "Not emailed",
    queued: "Queued",
    sent: "Emailed",
    failed: "Email failed",
  };
  return map[status] ?? status;
}
