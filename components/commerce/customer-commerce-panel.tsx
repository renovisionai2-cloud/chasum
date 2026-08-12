import type { ReactNode } from "react";
import {
  downloadInvoiceTextAction,
  downloadReceiptTextAction,
  queueReceiptEmailAction,
  recordPaymentAction,
  type CommerceActionState,
} from "@/lib/actions/commerce";
import type { CustomerCommerceAccount } from "@/lib/commerce/types";
import {
  PAYMENT_METHOD_LABELS,
  centsToDollars,
} from "@/lib/commerce/types";
import { formatMoneyCents } from "@/lib/commerce/money";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useActionState, useState, useTransition } from "react";

const initial: CommerceActionState = {};

export function CustomerCommercePanel({
  customerId,
  account,
  currency = "cad",
}: {
  customerId: string;
  account: CustomerCommerceAccount;
  currency?: string | null;
}) {
  const [payState, payAction, payPending] = useActionState(
    recordPaymentAction,
    initial,
  );
  const [viewer, setViewer] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [emailMsg, setEmailMsg] = useState<CommerceActionState>({});
  const [method, setMethod] = useState("cash");
  const [giftCardId, setGiftCardId] = useState(
    account.giftCards[0]?.id ?? "",
  );

  const money = (cents: number) => formatMoneyCents(cents, currency);

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

      <form
        action={payAction}
        className="space-y-3 rounded-[var(--radius-md)] border border-dashed border-border p-4"
      >
        <p className="ds-label">Collect payment</p>
        <input type="hidden" name="customer_id" value={customerId} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            name="amount"
            placeholder="Amount"
            required
            inputMode="decimal"
            aria-label="Payment amount"
            className="min-h-11"
          />
          <select
            name="method"
            className="min-h-11 rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            aria-label="Method"
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Input
            name="description"
            placeholder="Description"
            aria-label="Payment description"
            className="min-h-11"
          />
        </div>
        {method === "gift_card" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {account.giftCards.length > 0 ? (
              <select
                name="gift_card_id"
                className="min-h-11 rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
                value={giftCardId}
                onChange={(e) => setGiftCardId(e.target.value)}
                aria-label="Gift certificate"
              >
                {account.giftCards.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.code} · {centsToDollars(g.balanceCents)} left
                  </option>
                ))}
              </select>
            ) : (
              <Input
                name="gift_card_code"
                placeholder="Gift certificate code"
                required
                aria-label="Gift certificate code"
                className="min-h-11"
              />
            )}
            {account.giftCards.length > 0 ? (
              <p className="self-center text-xs text-muted-foreground">
                Customer gift certificates appear here automatically.
              </p>
            ) : (
              <p className="self-center text-xs text-muted-foreground">
                No linked certificates — enter the code to redeem.
              </p>
            )}
          </div>
        ) : null}
        <AlertMessage error={payState.error} success={payState.success} />
        <Button type="submit" size="sm" className="min-h-11" disabled={payPending}>
          {payPending ? "Saving…" : "Record payment"}
        </Button>
      </form>

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
                      {inv.issueDate
                        ? format(new Date(inv.issueDate), "MMM d, yyyy")
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">
                      {money(inv.totalCents)}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">
                      {money(inv.amountPaidCents)}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">
                      {money(inv.balanceCents)}
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-9"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const res = await downloadInvoiceTextAction(inv.id);
                            if (res.text) setViewer(res.text);
                          });
                        }}
                      >
                        View
                      </Button>
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
                    {money(r.amountCents)} · {receiptEmailLabel(r.emailStatus)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-9"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const res = await downloadReceiptTextAction(r.id);
                        if (res.text) setViewer(res.text);
                      });
                    }}
                  >
                    View
                  </Button>
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

      {viewer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewer(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-[var(--radius-lg)] border border-border bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-between">
              <p className="font-semibold">Preview</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setViewer(null)}
              >
                Close
              </Button>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs">{viewer}</pre>
            <Button
              type="button"
              size="sm"
              className="mt-3"
              variant="outline"
              onClick={() => {
                const blob = new Blob([viewer], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "chasum-document.txt";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download
            </Button>
          </div>
        </div>
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
