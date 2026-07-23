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
import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useActionState, useState, useTransition } from "react";

const initial: CommerceActionState = {};

export function CustomerCommercePanel({
  customerId,
  account,
}: {
  customerId: string;
  account: CustomerCommerceAccount;
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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Outstanding balance" value={centsToDollars(account.outstandingBalanceCents)} />
        <Stat label="Deposit paid" value={centsToDollars(account.depositsCents)} />
        <Stat label="Remaining balance" value={centsToDollars(account.remainingBalanceCents)} />
        <Stat label="Total paid" value={centsToDollars(account.totalPaidCents)} />
        <Stat label="Store credit" value={centsToDollars(account.storeCreditCents)} />
      </div>

      <form
        action={payAction}
        className="space-y-3 rounded-[var(--radius-md)] border border-dashed border-border p-4"
      >
        <p className="ds-label">Collect payment</p>
        <input type="hidden" name="customer_id" value={customerId} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input name="amount" placeholder="Amount" required inputMode="decimal" />
          <select
            name="method"
            className="h-10 rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
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
          <Input name="description" placeholder="Description" />
        </div>
        {method === "gift_card" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {account.giftCards.length > 0 ? (
              <select
                name="gift_card_id"
                className="h-10 rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
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
        <Button type="submit" size="sm" disabled={payPending}>
          {payPending ? "Saving…" : "Record payment"}
        </Button>
      </form>

      <Section title="Invoices">
        {account.invoices.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {account.invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  {inv.invoiceNumber} · {invoiceStatusLabel(inv.status)} ·{" "}
                  {centsToDollars(inv.balanceCents)} due
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
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
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Receipts">
        {account.receipts.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {account.receipts.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  {r.receiptNumber} · {centsToDollars(r.amountCents)} ·{" "}
                  {receiptEmailLabel(r.emailStatus)}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
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

      <Section title="Refunds">
        {account.refunds.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2 text-sm">
            {account.refunds.map((r) => (
              <li key={r.id}>
                {centsToDollars(r.amountCents)} · {r.refundType} · {r.reason}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Payment timeline">
        {account.timeline.length === 0 ? (
          <Empty />
        ) : (
          <ul className="divide-y divide-border">
            {account.timeline.map((t) => (
              <li key={t.id} className="flex justify-between gap-2 py-2 text-sm">
                <span>
                  {centsToDollars(t.amountCents)} · {t.kind} ·{" "}
                  {PAYMENT_METHOD_LABELS[t.method]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(t.occurredAt), "MMM d, yyyy")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

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
              <Button type="button" size="sm" variant="outline" onClick={() => setViewer(null)}>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
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
