/**
 * Truthful Week/Month density helpers.
 * Counts come only from loaded appointments — never capacity or availability.
 */

import { appointmentStatusTone } from "@/lib/calendar/appointment-status-ui";
import { isAppointmentCollectible } from "@/lib/commerce/money-contract";
import {
  paymentReadinessFromStamps,
  paymentReadinessLabel,
} from "@/lib/dashboard/appointment-ops";
import type { AppointmentStatus } from "@/lib/types/booking";

export const WEEK_VISIBLE_LIMIT = 4;
export const MONTH_VISIBLE_LIMIT = 2;

export type PlanningOverflow = {
  total: number;
  visible: number;
  overflow: number;
  label: string | null;
};

export function planningOverflow(
  total: number,
  visibleLimit: number,
): PlanningOverflow {
  const visible = Math.min(Math.max(0, total), Math.max(0, visibleLimit));
  const overflow = Math.max(0, total - visible);
  return {
    total,
    visible,
    overflow,
    label:
      overflow > 0
        ? `+${overflow} more`
        : total === 0
          ? null
          : `${total} appointment${total === 1 ? "" : "s"}`,
  };
}

export function truthfulAppointmentCountLabel(total: number): string {
  if (total <= 0) return "No appointments";
  return `${total} appointment${total === 1 ? "" : "s"}`;
}

/** Attention from real status / collectible remaining — not stored payment_status alone. */
export function planningAttentionLabel(input: {
  status?: string | null;
  paymentStatus?: string | null;
  price_cents?: number | null;
  tax_cents?: number | null;
  amount_paid_cents?: number | null;
  amount_refunded_cents?: number | null;
}): string | null {
  const status = input.status as AppointmentStatus | undefined;
  // Cancelled is hidden from active boards; never show collection pressure if stale.
  if (!isAppointmentCollectible(status, input.paymentStatus)) {
    return null;
  }
  if (status) {
    const tone = appointmentStatusTone(status);
    if (tone.attention === "action" || tone.attention === "risk") {
      return tone.label;
    }
  }
  const pay = paymentReadinessLabel(
    paymentReadinessFromStamps({
      status: input.status,
      payment_status: input.paymentStatus,
      price_cents: input.price_cents,
      tax_cents: input.tax_cents,
      amount_paid_cents: input.amount_paid_cents,
      amount_refunded_cents: input.amount_refunded_cents,
    }),
  );
  if (pay === "Balance due" || pay === "Payment due") return pay;
  return null;
}

export function dayHasPlanningAttention<
  T extends {
    status?: string | null;
    payment_status?: string | null;
    price_cents?: number | null;
    tax_cents?: number | null;
    amount_paid_cents?: number | null;
    amount_refunded_cents?: number | null;
  },
>(appointments: T[]): boolean {
  return appointments.some(
    (appointment) =>
      planningAttentionLabel({
        status: appointment.status,
        paymentStatus: appointment.payment_status,
        price_cents: appointment.price_cents,
        tax_cents: appointment.tax_cents,
        amount_paid_cents: appointment.amount_paid_cents,
        amount_refunded_cents: appointment.amount_refunded_cents,
      }) != null,
  );
}
