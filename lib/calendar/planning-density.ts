/**
 * Truthful Week/Month density helpers.
 * Counts come only from loaded appointments — never capacity or availability.
 */

import { appointmentStatusTone } from "@/lib/calendar/appointment-status-ui";
import { isAppointmentCollectible } from "@/lib/commerce/money-contract";
import {
  paymentReadinessFromStatus,
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

/** Attention from real status / payment — not invented demand language. */
export function planningAttentionLabel(input: {
  status?: string | null;
  paymentStatus?: string | null;
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
    paymentReadinessFromStatus(input.paymentStatus),
  );
  if (pay === "Balance due" || pay === "Payment due") return pay;
  return null;
}

export function dayHasPlanningAttention<
  T extends { status?: string | null; payment_status?: string | null },
>(appointments: T[]): boolean {
  return appointments.some(
    (appointment) =>
      planningAttentionLabel({
        status: appointment.status,
        paymentStatus: appointment.payment_status,
      }) != null,
  );
}
