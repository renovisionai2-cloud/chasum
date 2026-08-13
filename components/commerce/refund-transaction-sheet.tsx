"use client";

import {
  refundPaymentAction,
  type CommerceActionState,
} from "@/lib/actions/commerce";
import {
  humanizeRefundError,
  remainingRefundableCents,
} from "@/lib/commerce/refundability";
import {
  centsToDollars,
  PAYMENT_METHOD_LABELS,
  type CommerceRefund,
  type CommerceTransaction,
} from "@/lib/commerce/types";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useActionState, useMemo, useState } from "react";
import { useFormAction } from "@/hooks/use-form-action";

const initial: CommerceActionState = {};

type Props = {
  open: boolean;
  onClose: () => void;
  transaction: CommerceTransaction;
  refunds: CommerceRefund[];
  currency: string;
  customerLabel?: string | null;
  appointmentLabel?: string | null;
};

export function RefundTransactionSheet({
  open,
  onClose,
  transaction,
  refunds,
  currency,
  customerLabel,
  appointmentLabel,
}: Props) {
  const money = (cents: number) => centsToDollars(cents, currency);
  const remaining = useMemo(
    () => remainingRefundableCents(transaction, refunds),
    [transaction, refunds],
  );
  const already = Math.max(0, transaction.amountCents - remaining);
  const resetKey = `${transaction.id}:${remaining}:${open ? "1" : "0"}`;
  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState((remaining / 100).toFixed(2));
  const [state, action, pending] = useActionState(refundPaymentAction, initial);

  useFormAction(state as { error?: string; success?: string }, () => {
    if (state.success) onClose();
  });

  if (open && appliedResetKey !== resetKey) {
    setAppliedResetKey(resetKey);
    setMode("full");
    setAmount((remaining / 100).toFixed(2));
  }

  if (!open) return null;

  const displayError = humanizeRefundError(state.error);
  const amountCents =
    mode === "full"
      ? remaining
      : Math.round(
          Number(String(amount).replace(/[^0-9.]/g, "") || "0") * 100,
        );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-sheet-title"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-[var(--radius-lg)] border border-border bg-background p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id="refund-sheet-title" className="text-base font-semibold">
              Refund payment
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Refund from this payment record. Transaction ID is handled
              internally.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <dl className="mb-4 space-y-1.5 rounded-[var(--radius-md)] border border-border/80 bg-muted/30 px-3 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="font-medium text-right">
              {customerLabel?.trim() || "Customer"}
            </dd>
          </div>
          {appointmentLabel ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Appointment</dt>
              <dd className="font-medium text-right">{appointmentLabel}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Payment date</dt>
            <dd className="tabular-nums">
              {format(new Date(transaction.occurredAt), "MMM d, yyyy")}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Method</dt>
            <dd>{PAYMENT_METHOD_LABELS[transaction.method]}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Original amount</dt>
            <dd className="tabular-nums font-medium">
              {money(transaction.amountCents)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Previously refunded</dt>
            <dd className="tabular-nums">{money(already)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Refundable now</dt>
            <dd className="tabular-nums font-semibold">{money(remaining)}</dd>
          </div>
        </dl>

        {remaining <= 0 ? (
          <p className="text-sm text-muted-foreground">
            This payment has already been fully refunded.
          </p>
        ) : (
          <form action={action} className="space-y-3">
            <input type="hidden" name="transaction_id" value={transaction.id} />
            <input
              type="hidden"
              name="amount"
              value={(amountCents / 100).toFixed(2)}
            />

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Refund type
              </legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="refund_mode"
                  checked={mode === "full"}
                  onChange={() => {
                    setMode("full");
                    setAmount((remaining / 100).toFixed(2));
                  }}
                />
                Full refund ({money(remaining)})
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="refund_mode"
                  checked={mode === "partial"}
                  onChange={() => setMode("partial")}
                />
                Partial refund
              </label>
            </fieldset>

            {mode === "partial" ? (
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Refund amount"
                inputMode="decimal"
                required
                aria-label="Partial refund amount"
              />
            ) : null}

            <select
              name="approval"
              className="h-10 w-full rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
              defaultValue="approved"
              aria-label="Approval"
            >
              <option value="approved">Approve now</option>
              <option value="pending">Pending approval</option>
            </select>

            <Input
              name="reason"
              placeholder="Reason (required)"
              required
              aria-label="Refund reason"
            />

            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Technical details</summary>
              <p className="mt-1 break-all font-mono">
                Transaction {transaction.id}
              </p>
            </details>

            <AlertMessage
              error={state.error ? displayError : undefined}
              success={state.success}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={pending || amountCents <= 0 || amountCents > remaining}
              >
                {pending ? "Processing…" : "Confirm refund"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClose}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
