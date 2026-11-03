"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoneyCents } from "@/lib/commerce/money";
import {
  resolveBookingFinancials,
  suggestPaymentTodayCents,
  type BookingPaymentMode,
} from "@/lib/commerce/booking-financials";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/commerce/types";
import type { TaxRate } from "@/lib/business/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const BOOKING_METHODS: PaymentMethod[] = [
  "cash",
  "debit_card",
  "credit_card",
  "e_transfer",
  "other",
];

/** Empty and partial decimals stay visible. At most one separator and two fraction digits. */
const EDITABLE_AMOUNT = /^(?:\d+\.?|\d*\.\d{0,2})$/;

function isEditableAmount(text: string): boolean {
  return text === "" || EDITABLE_AMOUNT.test(text);
}

function centsFromAmountText(text: string): number {
  if (text === "" || text === ".") return 0;
  const dollars = Number(text);
  if (!Number.isFinite(dollars) || dollars < 0) return 0;
  return Math.round(dollars * 100);
}

function formatAmountCents(cents: number): string {
  return (Math.max(0, Math.round(cents)) / 100).toFixed(2);
}

export type BookingPaymentDraft = {
  mode: BookingPaymentMode;
  amountCents: number;
  method: PaymentMethod;
  note: string;
  sendReceipt: boolean;
};

export type BookingPaymentSectionProps = {
  /** Catalog list price (service/package) — may be tax-inclusive. */
  catalogPriceCents: number;
  serviceTaxRateBps?: number | null;
  taxRates?: TaxRate[] | null;
  depositCents?: number | null;
  depositRequired?: boolean | null;
  currency?: string | null;
  value: BookingPaymentDraft;
  onChange: (next: BookingPaymentDraft) => void;
  /** Force expanded when deposit is required. */
  defaultExpanded?: boolean;
  className?: string;
  compact?: boolean;
  /** When false, parent form supplies price_cents / tax_cents / deposit_cents. */
  includePricingFields?: boolean;
};

export function BookingPaymentSection({
  catalogPriceCents,
  serviceTaxRateBps,
  taxRates,
  depositCents,
  depositRequired,
  currency = "usd",
  value,
  onChange,
  defaultExpanded = false,
  className,
  compact = false,
  includePricingFields = true,
}: BookingPaymentSectionProps) {
  const base = resolveBookingFinancials({
    catalogPriceCents,
    serviceTaxRateBps,
    taxRates,
    depositRequiredCents: depositCents,
    depositRequired,
    currency,
  });
  const withToday = resolveBookingFinancials({
    catalogPriceCents: base.subtotalCents,
    taxInclusive: false,
    taxCents: base.taxCents,
    depositRequiredCents: base.depositRequiredCents,
    paymentTodayCents: value.mode === "none" ? 0 : value.amountCents,
    currency,
  });
  const depositNeeded = base.depositRequiredCents > 0;
  const expanded = defaultExpanded || value.mode !== "none" || depositNeeded;
  const pricingKey = [
    catalogPriceCents,
    serviceTaxRateBps ?? "",
    depositCents ?? "",
    depositRequired ? 1 : 0,
    currency ?? "",
  ].join(":");
  const [editing, setEditing] = useState(false);
  const [amountText, setAmountText] = useState(() =>
    formatAmountCents(value.amountCents),
  );
  const echoRef = useRef({
    mode: value.mode,
    amountCents: value.amountCents,
    pricingKey,
  });
  const shownAmount = editing ? amountText : formatAmountCents(value.amountCents);

  useEffect(() => {
    if (!editing) return;
    const echo = echoRef.current;
    const ownKeystroke =
      value.mode === echo.mode &&
      value.amountCents === echo.amountCents &&
      pricingKey === echo.pricingKey;
    if (ownKeystroke) return;
    setAmountText(formatAmountCents(value.amountCents));
    echoRef.current = {
      mode: value.mode,
      amountCents: value.amountCents,
      pricingKey,
    };
  }, [editing, pricingKey, value.amountCents, value.mode]);

  function publishAmount(next: BookingPaymentDraft) {
    echoRef.current = {
      mode: next.mode,
      amountCents: next.amountCents,
      pricingKey,
    };
    onChange(next);
  }

  function setMode(mode: BookingPaymentMode) {
    const amountCents = suggestPaymentTodayCents(mode, base, value.amountCents);
    setEditing(false);
    setAmountText(formatAmountCents(amountCents));
    publishAmount({ ...value, mode, amountCents });
  }

  function editAmount(nextText: string) {
    if (!isEditableAmount(nextText)) return;
    setEditing(true);
    const amountCents = centsFromAmountText(nextText);
    const mode =
      value.mode === "deposit" || value.mode === "full" ? "custom" : value.mode;
    setAmountText(nextText);
    publishAmount({ ...value, mode, amountCents });
  }

  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-border bg-card px-3 py-3 space-y-3",
        className,
      )}
      aria-label="Payment"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight">Payment</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Optional — record cash or other payment with this booking.
          </p>
        </div>
        {depositNeeded ? (
          <p className="text-xs font-medium tabular-nums text-foreground shrink-0">
            Deposit {base.formatted.depositRequired}
          </p>
        ) : null}
      </div>

      <dl
        className={cn(
          "grid gap-1.5 text-sm",
          compact ? "grid-cols-1" : "sm:grid-cols-2",
        )}
      >
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-muted-foreground text-xs">Appointment total</dt>
          <dd className="font-semibold tabular-nums">
            {base.formatted.appointmentTotal}
          </dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-muted-foreground text-xs">Balance after booking</dt>
          <dd className="font-semibold tabular-nums">
            {withToday.formatted.remainingBalance}
          </dd>
        </div>
      </dl>

      {expanded ? (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="grid gap-2">
            {(
              [
                ["none", "No payment now"],
                ["deposit", depositNeeded ? `Record ${base.formatted.depositRequired} deposit` : "Record deposit"],
                ["full", `Pay in full (${base.formatted.appointmentTotal})`],
                ["custom", "Record a different amount"],
              ] as const
            ).map(([mode, label]) => (
              <label
                key={mode}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm cursor-pointer min-h-11",
                  value.mode === mode
                    ? "border-foreground/30 bg-muted/40"
                    : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="booking_payment_mode_ui"
                  className="size-4"
                  checked={value.mode === mode}
                  onChange={() => setMode(mode)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {value.mode !== "none" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="booking_payment_amount">Amount</Label>
                <Input
                  id="booking_payment_amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  value={shownAmount}
                  onFocus={() => {
                    setEditing(true);
                    const text = formatAmountCents(value.amountCents);
                    setAmountText(text);
                    echoRef.current = {
                      mode: value.mode,
                      amountCents: value.amountCents,
                      pricingKey,
                    };
                  }}
                  onBlur={() => setEditing(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault();
                  }}
                  onChange={(event) => editAmount(event.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Record payment — does not charge a card online.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="booking_payment_method">Payment method</Label>
                <Select
                  id="booking_payment_method"
                  value={value.method}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      method: e.target.value as PaymentMethod,
                    })
                  }
                >
                  {BOOKING_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                      {m === "other" ? " / Cheque" : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="booking_payment_note">Reference / note</Label>
                <Input
                  id="booking_payment_note"
                  value={value.note}
                  placeholder="Optional"
                  onChange={(e) =>
                    onChange({ ...value, note: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2 min-h-11">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={value.sendReceipt}
                  onChange={(e) =>
                    onChange({ ...value, sendReceipt: e.target.checked })
                  }
                />
                Send payment receipt email
              </label>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Payment today:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatMoneyCents(
                value.mode === "none" ? 0 : value.amountCents,
                currency,
              )}
            </span>
            {depositNeeded && value.mode === "none" ? (
              <>
                {" "}
                · Deposit required remains {base.formatted.depositRequired}
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      {/* Hidden fields for form submit */}
      <input type="hidden" name="payment_mode" value={value.mode} />
      <input
        type="hidden"
        name="payment_amount_cents"
        value={value.mode === "none" ? "0" : String(value.amountCents)}
      />
      <input type="hidden" name="payment_method" value={value.method} />
      <input type="hidden" name="payment_note" value={value.note} />
      <input
        type="hidden"
        name="payment_send_receipt"
        value={value.sendReceipt ? "1" : "0"}
      />
      {includePricingFields ? (
        <>
          <input
            type="hidden"
            name="deposit_cents"
            value={String(base.depositRequiredCents || "")}
          />
          <input
            type="hidden"
            name="price_cents"
            value={String(base.subtotalCents || "")}
          />
          <input
            type="hidden"
            name="tax_cents"
            value={String(base.taxCents || "")}
          />
        </>
      ) : (
        <input
          type="hidden"
          name="deposit_cents"
          value={String(base.depositRequiredCents || "")}
        />
      )}
    </section>
  );
}

export function defaultBookingPaymentDraft(
  depositRequiredCents = 0,
): BookingPaymentDraft {
  return {
    mode: depositRequiredCents > 0 ? "none" : "none",
    amountCents: depositRequiredCents > 0 ? depositRequiredCents : 0,
    method: "cash",
    note: "",
    sendReceipt: false,
  };
}

export function confirmButtonLabel(
  mode: BookingPaymentMode,
  amountCents: number,
  currency?: string | null,
): string {
  if (mode === "none" || amountCents <= 0) return "Confirm appointment";
  return `Confirm and record ${formatMoneyCents(amountCents, currency)}`;
}
