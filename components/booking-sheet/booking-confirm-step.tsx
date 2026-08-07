"use client";

import type { BookingPaymentDraft } from "@/components/booking/booking-payment-section";
import { formatMoneyCents } from "@/lib/commerce/money";
import type { resolveBookingFinancials } from "@/lib/commerce/booking-financials";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format } from "date-fns";

type Financials = ReturnType<typeof resolveBookingFinancials>;

type BookingConfirmStepProps = {
  serviceName: string | null;
  customerName: string | null;
  employeeName: string | null;
  locationName: string | null;
  startIso: string;
  durationMinutes: number;
  financials: Financials;
  payment: BookingPaymentDraft;
  currency?: string | null;
  sendCustomerEmail?: boolean;
  sendCustomerSms?: boolean;
  sendBusinessEmail?: boolean;
};

export function BookingConfirmStep({
  serviceName,
  customerName,
  employeeName,
  locationName,
  startIso,
  durationMinutes,
  financials,
  payment,
  currency,
  sendCustomerEmail = true,
  sendCustomerSms = true,
  sendBusinessEmail = true,
}: BookingConfirmStepProps) {
  const end = new Date(parseISO(startIso).getTime() + durationMinutes * 60_000);
  const paymentToday =
    payment.mode === "none" ? 0 : Math.max(0, payment.amountCents);
  const balanceAfter = Math.max(
    0,
    financials.appointmentTotalCents - paymentToday,
  );

  return (
    <div className="space-y-4" id="bs-confirm">
      <div className="space-y-1 text-sm">
        <p className="text-base font-semibold tracking-tight">
          {serviceName ?? "Appointment"}
        </p>
        <p className="tabular-nums">
          {format(parseISO(startIso), "EEEE, MMMM d")}
        </p>
        <p className="tabular-nums text-muted-foreground">
          {formatTime(parseISO(startIso))} – {formatTime(end)}
        </p>
        {employeeName ? <p>{employeeName}</p> : null}
        {locationName ? (
          <p className="text-muted-foreground">{locationName}</p>
        ) : null}
      </div>

      {customerName ? (
        <div className="border-t border-border/70 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Customer
          </p>
          <p className="mt-0.5 text-sm font-medium">{customerName}</p>
        </div>
      ) : null}

      <dl className="space-y-1.5 border-t border-border/70 pt-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{financials.formatted.subtotal}</dd>
        </div>
        {financials.taxCents > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              Tax{financials.taxInclusive ? " (included)" : ""}
            </dt>
            <dd className="tabular-nums">{financials.formatted.tax}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 border-t border-border/60 pt-1.5">
          <dt className="font-medium">Appointment total</dt>
          <dd className="font-semibold tabular-nums">
            {financials.formatted.appointmentTotal}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Payment today</dt>
          <dd className="tabular-nums">
            {formatMoneyCents(paymentToday, currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="font-medium">Balance remaining</dt>
          <dd className="font-semibold tabular-nums">
            {formatMoneyCents(balanceAfter, currency)}
          </dd>
        </div>
      </dl>

      <div className="border-t border-border/70 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Notifications
        </p>
        <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
          <li>
            Customer confirmation email{" "}
            <span className="text-foreground">{sendCustomerEmail ? "✓" : "—"}</span>
          </li>
          <li>
            Customer SMS{" "}
            <span className="text-foreground">
              {sendCustomerSms ? "✓ when enabled" : "—"}
            </span>
          </li>
          <li>
            Business booking email{" "}
            <span className="text-foreground">{sendBusinessEmail ? "✓" : "—"}</span>
          </li>
          <li>
            Payment receipt email{" "}
            <span className="text-foreground">
              {payment.sendReceipt && paymentToday > 0 ? "✓" : "—"}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
