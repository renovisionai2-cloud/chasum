"use client";

import { AppointmentFinancialActivityList } from "@/components/booking/appointment-financial-activity";
import { CollectPaymentWorkspace } from "@/components/commerce/collect-payment-workspace";
import { RefundTransactionSheet } from "@/components/commerce/refund-transaction-sheet";
import { loadAppointmentFinancialActivity } from "@/lib/actions/appointment-activity";
import { loadAppointmentLedger } from "@/lib/actions/commerce";
import type { TaxRate } from "@/lib/business/types";
import type { AppointmentFinancialActivity } from "@/lib/commerce/appointment-financial-activity";
import {
  resolveBookingFinancials,
  resolveFinancialsFromAppointment,
} from "@/lib/commerce/booking-financials";
import { formatMoneyCents } from "@/lib/commerce/money";
import { invoiceWorkspacePath } from "@/lib/commerce/document-paths";
import {
  appointmentCollectibleMoneyFromStamps,
  appointmentCollectionAction,
  appointmentCollectionFacingLabel,
} from "@/lib/commerce/money-contract";
import type { AppointmentWithRelations, Service } from "@/lib/types/booking";
import {
  isRefundableTransaction,
  remainingRefundableCents,
} from "@/lib/commerce/refundability";
import type {
  CommerceRefund,
  CommerceTransaction,
} from "@/lib/commerce/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentsSectionProps = {
  service: Service | undefined;
  appointment: AppointmentWithRelations | null | undefined;
  currency?: string | null;
  taxRates?: TaxRate[];
};

export function PaymentsSection({
  service,
  appointment,
  currency = "usd",
  taxRates = [],
}: PaymentsSectionProps) {
  const [activity, setActivity] = useState<AppointmentFinancialActivity | null>(
    null,
  );
  const [activityLoading, setActivityLoading] = useState(false);
  const [ledger, setLedger] = useState<{
    history: CommerceTransaction[];
    refunds: CommerceRefund[];
  }>({ history: [], refunds: [] });
  const [collectOpen, setCollectOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<CommerceTransaction | null>(
    null,
  );

  useEffect(() => {
    const id = appointment?.id;
    if (!id) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch lifecycle
    setActivityLoading(true);
    loadAppointmentFinancialActivity(id)
      .then((data) => {
        if (!cancelled) setActivity(data);
      })
      .catch(() => {
        if (!cancelled) setActivity(null);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });
    loadAppointmentLedger(id)
      .then((data) => {
        if (!cancelled) setLedger(data);
      })
      .catch(() => {
        if (!cancelled) setLedger({ history: [], refunds: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [appointment?.id]);

  const resolvedActivity = appointment?.id ? activity : null;
  const catalogCents = service
    ? Math.round(Number(service.price) * 100)
    : 0;

  const financials =
    appointment?.price_cents != null
      ? resolveFinancialsFromAppointment({
          priceCents: Number(appointment.price_cents),
          taxCents: Number(appointment.tax_cents ?? 0),
          depositCents:
            appointment.deposit_cents ?? service?.deposit_cents ?? null,
          amountPaidCents: appointment.amount_paid_cents,
          amountRefundedCents: appointment.amount_refunded_cents,
          currency,
        })
      : resolveBookingFinancials({
          catalogPriceCents: catalogCents,
          serviceTaxRateBps: service?.tax_rate_bps ?? 0,
          taxRates,
          depositRequiredCents: service?.deposit_cents,
          depositRequired: service?.deposit_required,
          currency,
        });

  const depositCents = financials.depositRequiredCents;
  const amountPaid = financials.paidToDateCents;
  const amountRefunded = financials.amountRefundedCents;
  const depositRequired = depositCents > 0;
  const collectible = appointment
    ? appointmentCollectibleMoneyFromStamps(appointment)
    : null;
  const outstandingTotal = collectible
    ? collectible.collectibleRemainingBalanceCents
    : financials.remainingBalanceCents;
  const statusLabel = appointment
    ? appointmentCollectionFacingLabel(appointment)
    : financials.appointmentTotalCents <= 0
      ? "No payment due"
      : appointmentCollectionFacingLabel({
          price_cents: financials.subtotalCents,
          tax_cents: financials.taxCents,
          deposit_cents: depositCents,
          amount_paid_cents: amountPaid,
          amount_refunded_cents: amountRefunded,
        });
  const depositDueNowCents = collectible
    ? collectible.collectibleDepositDueNowCents
    : financials.depositDueNowCents;

  if (financials.appointmentTotalCents <= 0) {
    return (
      <section className="space-y-1" aria-labelledby="bs-pay-heading">
        <h3 id="bs-pay-heading" className="text-sm font-semibold tracking-tight">
          Balance
        </h3>
        <p className="text-sm text-muted-foreground">No payment due.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="bs-pay-heading">
      <div>
        <h3 id="bs-pay-heading" className="text-sm font-semibold tracking-tight">
          Balance
        </h3>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border/80 bg-muted/15 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <p className="text-sm font-semibold">
              {statusLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Outstanding
            </p>
            <p
              className="text-sm font-semibold tabular-nums"
              data-amount-due={outstandingTotal}
            >
              {formatMoneyCents(outstandingTotal, currency)}
            </p>
          </div>
        </div>
        <dl className="mt-3 space-y-1.5 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Appointment total</dt>
            <dd className="font-medium tabular-nums">
              {formatMoneyCents(financials.appointmentTotalCents, currency)}
            </dd>
          </div>
          {financials.taxCents > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                Includes tax ({formatMoneyCents(financials.taxCents, currency)})
              </dt>
              <dd className="tabular-nums text-muted-foreground">
                Subtotal {formatMoneyCents(financials.subtotalCents, currency)}
              </dd>
            </div>
          ) : null}
          {depositRequired ? (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Deposit required</dt>
                <dd className="tabular-nums">
                  {formatMoneyCents(depositCents, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Deposit due now</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoneyCents(depositDueNowCents, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Remaining after deposit</dt>
                <dd className="tabular-nums">
                  {formatMoneyCents(
                    Math.max(
                      0,
                      financials.appointmentTotalCents -
                        Math.max(depositCents, amountPaid),
                    ),
                    currency,
                  )}
                </dd>
              </div>
            </>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Paid</dt>
            <dd className="font-medium tabular-nums">
              {formatMoneyCents(amountPaid, currency)}
            </dd>
          </div>
          {amountRefunded > 0 ? (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Refunded</dt>
                <dd className="tabular-nums">
                  {formatMoneyCents(amountRefunded, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Net retained</dt>
                <dd className="tabular-nums">
                  {formatMoneyCents(
                    Math.max(0, amountPaid - amountRefunded),
                    currency,
                  )}
                </dd>
              </div>
            </>
          ) : null}
        </dl>
      </div>

      {appointment?.id ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Financial activity
          </p>
          <AppointmentFinancialActivityList
            activity={resolvedActivity}
            loading={activityLoading}
            variant="panel"
          />
          {ledger.history.filter((tx) => isRefundableTransaction(tx)).length >
          0 ? (
            <ul className="space-y-1.5" role="list">
              {ledger.history
                .filter((tx) => isRefundableTransaction(tx))
                .map((tx) => {
                  const remaining = remainingRefundableCents(
                    tx,
                    ledger.refunds,
                  );
                  if (remaining <= 0) return null;
                  return (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="tabular-nums">
                        {formatMoneyCents(tx.amountCents, currency)} ·{" "}
                        {tx.kind === "deposit" ? "Deposit" : "Payment"}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setRefundTarget(tx)}
                      >
                        Refund
                      </Button>
                    </li>
                  );
                })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {appointment?.id &&
      appointmentCollectionAction(appointment) === "collect" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCollectOpen(true)}
        >
          Collect payment
        </Button>
      ) : appointment?.id &&
        appointmentCollectionAction(appointment) === "paid_in_full" ? (
        <p className="text-xs font-medium text-muted-foreground">Paid in full</p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {appointment?.invoice_number ? (
          <>
            Invoice{" "}
            <Link
              href={invoiceWorkspacePath(appointment.invoice_number)}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {appointment.invoice_number}
            </Link>
          </>
        ) : (
          "Receipts stay attached to each payment."
        )}
      </p>

      {collectOpen &&
      appointment &&
      appointmentCollectionAction(appointment) === "collect" ? (
        <CollectPaymentWorkspace
          open={collectOpen}
          onClose={() => setCollectOpen(false)}
          currency={currency}
          initialCustomerId={appointment.customer_id}
          initialAppointmentId={appointment.id}
        />
      ) : null}

      {refundTarget ? (
        <RefundTransactionSheet
          open
          onClose={() => setRefundTarget(null)}
          transaction={refundTarget}
          refunds={ledger.refunds}
          currency={currency ?? "cad"}
          appointmentLabel={service?.name ?? "Appointment"}
        />
      ) : null}
    </section>
  );
}
