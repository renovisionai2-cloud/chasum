"use client";

import { Button } from "@/components/ui/button";
import type { BookingNotificationStatusItem } from "@/lib/types/booking";
import { formatMoneyCents } from "@/lib/commerce/money";
import {
  BOOKING_SUCCESS_PAYMENT_LABELS,
  bookingSuccessPaymentState,
  recordedDeliveryLabel,
  type BookingSuccessPaymentState,
} from "@/lib/booking/booking-success-summary";
import { formatStaffFacingInstant } from "@/lib/business/datetime";
import { CheckCircle2 } from "lucide-react";

export type BookingSuccessInfo = {
  appointmentId: string;
  serviceName: string | null;
  customerName: string | null;
  employeeName: string | null;
  locationName: string | null;
  startIso: string;
  durationMinutes: number | null;
  appointmentTotalCents: number;
  collectedCents: number;
  remainingCents: number;
  depositRequiredCents: number;
  paymentAmountCents: number;
  paymentStatus?: "recorded" | "failed" | "skipped";
  paymentState: BookingSuccessPaymentState;
  receiptStatus?: string | null;
  notifications?: BookingNotificationStatusItem[];
  currency?: string | null;
  timezone?: string | null;
};

export function BookingSuccessState({
  info,
  onViewAppointment,
  onBookAnother,
  onDone,
  viewPending = false,
  viewError = null,
}: {
  info: BookingSuccessInfo;
  onViewAppointment?: (id: string) => void | Promise<void>;
  onBookAnother: () => void;
  onDone: () => void;
  viewPending?: boolean;
  viewError?: string | null;
}) {
  const customerEmail = info.notifications?.find(
    (n) => n.channel === "customer_email",
  );
  const businessEmail = info.notifications?.find(
    (n) => n.channel === "business_email",
  );
  const paymentRecorded = info.paymentStatus === "recorded";
  const paymentState =
    info.paymentState ??
    bookingSuccessPaymentState({
      appointmentTotalCents: info.appointmentTotalCents,
      collectedCents: info.collectedCents,
      depositRequiredCents: info.depositRequiredCents,
      paymentRecorded,
    });
  const remainingCents = Math.max(
    0,
    info.appointmentTotalCents - (paymentRecorded ? info.collectedCents : 0),
  );

  return (
    <div
      className="space-y-4 rounded-[var(--radius-md)] border border-success/30 bg-success/5 px-4 py-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <CheckCircle2
          className="mt-0.5 size-5 shrink-0 text-success"
          aria-hidden
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-success">
            Appointment booked
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {info.customerName ?? "Appointment confirmed"}
          </p>
        </div>
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Customer</dt>
          <dd className="font-medium text-right">{info.customerName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Service</dt>
          <dd className="text-right">{info.serviceName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Employee</dt>
          <dd className="text-right">{info.employeeName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Location</dt>
          <dd className="text-right">{info.locationName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">When</dt>
          <dd className="tabular-nums text-right">
            {formatStaffFacingInstant(info.startIso, info.timezone)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-border/60 pt-1.5">
          <dt className="text-muted-foreground">Appointment total</dt>
          <dd className="font-medium tabular-nums">
            {formatMoneyCents(info.appointmentTotalCents, info.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Amount collected</dt>
          <dd className="tabular-nums">
            {info.paymentStatus === "failed"
              ? "Payment failed"
              : formatMoneyCents(
                  paymentRecorded ? info.collectedCents : 0,
                  info.currency,
                )}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="text-right">
            {BOOKING_SUCCESS_PAYMENT_LABELS[paymentState]}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Remaining</dt>
          <dd className="tabular-nums">
            {remainingCents <= 0
              ? "Paid in full"
              : formatMoneyCents(remainingCents, info.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-border/60 pt-1.5">
          <dt className="text-muted-foreground">Customer confirmation</dt>
          <dd className="text-right">{recordedDeliveryLabel(customerEmail)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Business notification</dt>
          <dd className="text-right">{recordedDeliveryLabel(businessEmail)}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row">
        {onViewAppointment ? (
          <Button
            type="button"
            className="min-h-11 flex-1"
            disabled={viewPending}
            onClick={() => onViewAppointment(info.appointmentId)}
          >
            {viewPending ? "Opening…" : "View appointment"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 flex-1"
          disabled={viewPending}
          onClick={onBookAnother}
        >
          Book another
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 flex-1"
          disabled={viewPending}
          onClick={onDone}
        >
          Done
        </Button>
      </div>
      {viewError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive" role="alert">
            {viewError}
          </p>
          {onViewAppointment ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              disabled={viewPending}
              onClick={() => onViewAppointment(info.appointmentId)}
            >
              Retry opening appointment
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
