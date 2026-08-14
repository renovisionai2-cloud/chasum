"use client";

import {
  loadFrontDeskAppointmentContext,
  loadFrontDeskAppointmentsForCustomer,
  queueReceiptEmailAction,
  recordPaymentAction,
  type CommerceActionState,
} from "@/lib/actions/commerce";
import { CustomerSearch } from "@/components/reception/customer-search";
import { MoneyAmountInput } from "@/components/ui/money-amount-input";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { FrontDeskAppointmentOption } from "@/lib/commerce/front-desk";
import { assertCollectiblePaymentAmount } from "@/lib/commerce/front-desk";
import { formatMoneyCents } from "@/lib/commerce/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/commerce/types";
import type { Customer } from "@/lib/types/booking";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";

const initial: CommerceActionState = {};

type AmountMode = "full" | "deposit" | "custom";

type Props = {
  open: boolean;
  onClose: () => void;
  currency?: string | null;
  initialCustomerId?: string;
  initialCustomerName?: string;
  initialAppointmentId?: string;
  seedCustomers?: Customer[];
  intent?: "payment" | "deposit";
};

export function CollectPaymentWorkspace({
  open,
  onClose,
  currency = "cad",
  initialCustomerId = "",
  initialCustomerName = "",
  initialAppointmentId = "",
  seedCustomers = [],
  intent = "payment",
}: Props) {
  const [payState, payAction, payPending] = useActionState(
    recordPaymentAction,
    initial,
  );
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [appointments, setAppointments] = useState<
    FrontDeskAppointmentOption[]
  >([]);
  const [appointmentId, setAppointmentId] = useState(initialAppointmentId);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [mode, setMode] = useState<AmountMode>(
    intent === "deposit" ? "deposit" : "full",
  );
  const [customCents, setCustomCents] = useState(0);
  const [method, setMethod] = useState("cash");
  const [giftCode, setGiftCode] = useState("");
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [, startResend] = useTransition();

  const selected = useMemo(
    () => appointments.find((row) => row.id === appointmentId) ?? null,
    [appointments, appointmentId],
  );

  useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch lifecycle
    setLoadingAppts(true);
    loadFrontDeskAppointmentsForCustomer(customerId, initialAppointmentId)
      .then((rows) => {
        if (cancelled) return;
        setAppointments(rows);
        if (initialAppointmentId) {
          setAppointmentId(initialAppointmentId);
        } else if (rows.length === 1) {
          setAppointmentId(rows[0].id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAppts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, customerId, initialAppointmentId]);

  useEffect(() => {
    if (!open || !initialAppointmentId || selected) return;
    let cancelled = false;
    loadFrontDeskAppointmentContext(initialAppointmentId).then((row) => {
      if (cancelled || !row) return;
      setAppointments((prev) =>
        prev.some((item) => item.id === row.id) ? prev : [row, ...prev],
      );
      setAppointmentId(row.id);
      if (!customerId) {
        setCustomerId(row.customerId);
        setCustomerName(row.customerName);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, initialAppointmentId, selected, customerId]);

  const depositDue = selected?.depositDueNowCents ?? 0;
  const remaining = selected?.remainingCents ?? 0;
  const amountCents =
    mode === "full"
      ? remaining
      : mode === "deposit"
        ? depositDue
        : customCents;

  const cap = selected
    ? assertCollectiblePaymentAmount({
        amountCents: amountCents || 0,
        remainingCents: remaining,
      })
    : { ok: false as const, error: "Choose an appointment." };

  const money = (cents: number) => formatMoneyCents(cents, currency);
  const success = Boolean(payState.success) && !payState.error;

  function handleCustomer(customer: Customer) {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setAppointmentId("");
  }

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Collect payment"
      description="Customer → appointment → amount. No internal IDs."
      className="sm:max-w-lg"
    >
      {success ? (
        <div className="space-y-4" role="status" aria-live="polite">
          <p className="text-lg font-semibold">Payment recorded</p>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="tabular-nums font-medium">
                {money(payState.amountCents ?? amountCents)}
              </dd>
            </div>
            {payState.method ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Method</dt>
                <dd>
                  {PAYMENT_METHOD_LABELS[
                    payState.method as keyof typeof PAYMENT_METHOD_LABELS
                  ] ?? payState.method}
                </dd>
              </div>
            ) : null}
            {payState.remainingCents != null ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Updated balance</dt>
                <dd className="tabular-nums font-medium">
                  {payState.remainingCents <= 0
                    ? "Paid in full"
                    : money(payState.remainingCents)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Receipt</dt>
              <dd>
                {payState.receiptStatus === "sent"
                  ? "Sent"
                  : payState.receiptStatus === "unavailable"
                    ? "No email on file"
                    : payState.receiptStatus === "failed"
                      ? "Could not be sent"
                      : "Recorded"}
              </dd>
            </div>
          </dl>
              <AlertMessage success={payState.success} error={resendMsg ?? undefined} />
          <div className="flex flex-wrap gap-2">
            {payState.receiptId && payState.receiptStatus !== "sent" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const id = payState.receiptId;
                  if (!id) return;
                  startResend(async () => {
                    const res = await queueReceiptEmailAction(id);
                    setResendMsg(res.error ?? null);
                  });
                }}
              >
                Resend receipt
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form action={payAction} className="space-y-4">
          <input type="hidden" name="customer_id" value={customerId} />
          <input type="hidden" name="appointment_id" value={appointmentId} />
          <input
            type="hidden"
            name="amount"
            value={(amountCents / 100).toFixed(2)}
          />
          <input
            type="hidden"
            name="kind"
            value={mode === "deposit" ? "deposit" : "payment"}
          />
          <input type="hidden" name="force_manual" value="1" />

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Customer</p>
            {customerId ? (
              <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm">
                <span className="font-medium">{customerName || "Customer"}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCustomerId("");
                    setCustomerName("");
                    setAppointmentId("");
                    setAppointments([]);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <CustomerSearch
                onSelect={handleCustomer}
                seedCustomers={seedCustomers}
                autoFocus
              />
            )}
          </div>

          {customerId ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Appointment
              </p>
              {loadingAppts ? (
                <p className="text-sm text-muted-foreground">
                  Loading appointments…
                </p>
              ) : appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No collectible appointments for this customer.
                </p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto" role="list">
                  {appointments.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => setAppointmentId(row.id)}
                        className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm ${
                          appointmentId === row.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <p className="font-medium">{row.serviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.whenLabel}
                          {row.locationName ? ` · ${row.locationName}` : ""}
                          {row.staffName ? ` · ${row.staffName}` : ""}
                        </p>
                        <p className="mt-1 text-xs tabular-nums">
                          Total {money(row.totalCents)} · Paid{" "}
                          {money(row.paidCents)} · Balance{" "}
                          {money(row.remainingCents)} · {row.paymentStatusLabel}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {selected ? (
            <div className="rounded-[var(--radius-md)] border border-border/80 bg-muted/15 px-3 py-2.5 text-sm">
              <dl className="space-y-1">
                <Row label="Service" value={selected.serviceName} />
                <Row label="When" value={selected.whenLabel} />
                <Row label="Subtotal" value={money(selected.subtotalCents)} />
                {selected.taxCents > 0 ? (
                  <Row label="Tax" value={money(selected.taxCents)} />
                ) : null}
                <Row label="Total" value={money(selected.totalCents)} />
                {selected.depositRequiredCents > 0 ? (
                  <Row
                    label="Deposit required"
                    value={money(selected.depositRequiredCents)}
                  />
                ) : null}
                <Row label="Already paid" value={money(selected.paidCents)} />
                {selected.refundedCents > 0 ? (
                  <Row label="Refunded" value={money(selected.refundedCents)} />
                ) : null}
                <Row
                  label="Remaining"
                  value={money(selected.remainingCents)}
                />
              </dl>
            </div>
          ) : null}

          {selected && remaining > 0 ? (
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-muted-foreground">
                Amount
              </legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="amount_mode"
                  checked={mode === "full"}
                  onChange={() => setMode("full")}
                />
                Pay full remaining balance ({money(remaining)})
              </label>
              {depositDue > 0 ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="amount_mode"
                    checked={mode === "deposit"}
                    onChange={() => setMode("deposit")}
                  />
                  Pay deposit due ({money(depositDue)})
                </label>
              ) : null}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="amount_mode"
                  checked={mode === "custom"}
                  onChange={() => {
                    setMode("custom");
                    if (customCents <= 0) setCustomCents(remaining);
                  }}
                />
                Custom amount
              </label>
              {mode === "custom" ? (
                <MoneyAmountInput
                  amountCents={customCents}
                  onAmountCentsChange={setCustomCents}
                  aria-label="Custom payment amount"
                />
              ) : null}
            </fieldset>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="collect-method" className="text-xs font-medium text-muted-foreground">
              Payment method
            </label>
            <select
              id="collect-method"
              name="method"
              className="h-10 w-full rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {method === "gift_card" ? (
              <Input
                name="gift_card_code"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value)}
                placeholder="Gift certificate code"
                aria-label="Gift certificate code"
              />
            ) : null}
          </div>

          <AlertMessage error={payState.error} />
          {!cap.ok && selected ? (
            <p className="text-sm text-muted-foreground">{cap.error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={
                payPending ||
                !customerId ||
                !appointmentId ||
                !cap.ok
              }
            >
              {payPending ? "Recording…" : "Confirm payment"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums font-medium">{value}</dd>
    </div>
  );
}
