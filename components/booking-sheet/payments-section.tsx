"use client";

import { AppointmentFinancialActivityList } from "@/components/booking/appointment-financial-activity";
import { loadAppointmentFinancialActivity } from "@/lib/actions/appointment-activity";
import type { TaxRate } from "@/lib/business/types";
import type { AppointmentFinancialActivity } from "@/lib/commerce/appointment-financial-activity";
import { resolveBookingFinancials } from "@/lib/commerce/booking-financials";
import { formatMoneyCents } from "@/lib/commerce/money";
import type { AppointmentWithRelations, Service } from "@/lib/types/booking";
import {
  APPOINTMENT_PAYMENT_STATUS_LABELS,
  type AppointmentPaymentStatus,
} from "@/lib/commerce/types";
import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentsSectionProps = {
  service: Service | undefined;
  appointment: AppointmentWithRelations | null | undefined;
  currency?: string | null;
  taxRates?: TaxRate[];
};

function deriveStatus(input: {
  totalCents: number;
  depositCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  paymentStatus?: string | null;
  depositRequired: boolean;
}): AppointmentPaymentStatus | "no_payment_due" {
  if (input.totalCents <= 0) {
    return "no_payment_due";
  }
  if (
    input.paymentStatus &&
    input.paymentStatus in APPOINTMENT_PAYMENT_STATUS_LABELS
  ) {
    return input.paymentStatus as AppointmentPaymentStatus;
  }
  const net = Math.max(0, input.amountPaidCents - input.amountRefundedCents);
  if (input.amountRefundedCents > 0 && net <= 0) return "refunded";
  if (net >= input.totalCents && input.totalCents > 0) return "fully_paid";
  if (input.depositRequired && net <= 0) return "deposit_required";
  if (
    input.depositRequired &&
    net >= input.depositCents &&
    net < input.totalCents
  ) {
    return "deposit_paid";
  }
  if (net > 0 && net < input.totalCents) return "partially_paid";
  return "unpaid";
}

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

  useEffect(() => {
    const id = appointment?.id;
    if (!id) {
      setActivity(null);
      return;
    }
    let cancelled = false;
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
    return () => {
      cancelled = true;
    };
  }, [appointment?.id]);

  const catalogCents =
    appointment?.price_cents != null && appointment?.tax_cents != null
      ? Number(appointment.price_cents) + Number(appointment.tax_cents)
      : appointment?.price_cents != null
        ? Number(appointment.price_cents)
        : service
          ? Math.round(Number(service.price) * 100)
          : 0;

  const financials =
    appointment?.price_cents != null && appointment?.tax_cents != null
      ? resolveBookingFinancials({
          catalogPriceCents:
            Number(appointment.price_cents) + Number(appointment.tax_cents),
          taxInclusive: true,
          taxCents: Number(appointment.tax_cents),
          depositRequiredCents:
            appointment.deposit_cents ?? service?.deposit_cents,
          depositRequired: service?.deposit_required,
          paidToDateCents: appointment.amount_paid_cents,
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
  const netPaid = Math.max(0, amountPaid - amountRefunded);
  const outstandingTotal = financials.remainingBalanceCents;
  const status = deriveStatus({
    totalCents: financials.appointmentTotalCents,
    depositCents,
    amountPaidCents: amountPaid,
    amountRefundedCents: amountRefunded,
    paymentStatus: appointment?.payment_status,
    depositRequired,
  });

  if (status === "no_payment_due") {
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
              {APPOINTMENT_PAYMENT_STATUS_LABELS[status]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Outstanding
            </p>
            <p className="text-sm font-semibold tabular-nums">
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
                <dt className="text-muted-foreground">Deposit due now</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoneyCents(depositCents, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Remaining after deposit</dt>
                <dd className="tabular-nums">
                  {formatMoneyCents(
                    Math.max(0, financials.appointmentTotalCents - depositCents),
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
        </dl>
      </div>

      {appointment?.id ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Financial activity
          </p>
          <AppointmentFinancialActivityList
            activity={activity}
            loading={activityLoading}
            variant="panel"
          />
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        <Link
          href="/dashboard/payments"
          className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open Payments
        </Link>
        {appointment?.invoice_number
          ? ` · Invoice #${appointment.invoice_number}`
          : null}
      </p>
    </section>
  );
}
