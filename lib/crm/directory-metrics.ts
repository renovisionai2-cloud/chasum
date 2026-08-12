/**
 * Customer directory metrics — derived from appointments (and optional balances).
 * Never invent outstanding balances or visit dates.
 */

import { remainingBalanceCents } from "@/lib/commerce/money-contract";
import { isActiveBooking } from "@/lib/commerce/recognize";

export type DirectoryAppointmentRow = {
  customer_id: string | null;
  start_time: string;
  status: string | null;
  price_cents?: number | null;
  tax_cents?: number | null;
  amount_paid_cents?: number | null;
  amount_refunded_cents?: number | null;
  deposit_cents?: number | null;
  service?: { price?: number } | { price?: number }[] | null;
  /** @deprecated prefer `service` */
  services?: { price?: number } | { price?: number }[] | null;
};

export type CustomerDirectoryMetrics = {
  lastVisitAt: string | null;
  nextAppointmentAt: string | null;
  outstandingBalanceCents: number;
  visitCountCompleted: number;
};

export function appointmentPriceCents(row: DirectoryAppointmentRow): number {
  const fromCents = Number(row.price_cents ?? 0);
  if (fromCents > 0) return fromCents;
  const raw = row.service ?? row.services;
  const service = Array.isArray(raw) ? raw[0] : raw;
  return Math.round(Number(service?.price ?? 0) * 100);
}

export function buildDirectoryMetricsByCustomer(
  rows: DirectoryAppointmentRow[],
  now = new Date(),
): Map<string, CustomerDirectoryMetrics> {
  const nowMs = now.getTime();
  const map = new Map<string, CustomerDirectoryMetrics>();

  for (const row of rows) {
    if (!row.customer_id) continue;
    const existing = map.get(row.customer_id) ?? {
      lastVisitAt: null,
      nextAppointmentAt: null,
      outstandingBalanceCents: 0,
      visitCountCompleted: 0,
    };

    const startMs = new Date(row.start_time).getTime();
    if (row.status === "completed") {
      existing.visitCountCompleted += 1;
    }

    if (startMs < nowMs && row.status !== "cancelled" && row.status !== "no_show") {
      if (
        !existing.lastVisitAt ||
        startMs > new Date(existing.lastVisitAt).getTime()
      ) {
        existing.lastVisitAt = row.start_time;
      }
    }

    if (
      startMs >= nowMs &&
      isActiveBooking(row.status) &&
      row.status !== "completed"
    ) {
      if (
        !existing.nextAppointmentAt ||
        startMs < new Date(existing.nextAppointmentAt).getTime()
      ) {
        existing.nextAppointmentAt = row.start_time;
      }
    }

    if (row.status !== "cancelled") {
      existing.outstandingBalanceCents += remainingBalanceCents({
        price_cents: row.price_cents,
        tax_cents: row.tax_cents,
        amount_paid_cents: row.amount_paid_cents ?? row.deposit_cents,
        amount_refunded_cents: row.amount_refunded_cents,
        deposit_cents: row.deposit_cents,
        services: row.service ?? row.services,
      });
    }

    map.set(row.customer_id, existing);
  }

  return map;
}

export type DirectoryQuickFilter =
  | "all"
  | "active"
  | "inactive"
  | "vip"
  | "new"
  | "recent"
  | "outstanding";

export function isNewCustomer(
  createdAt: string | null | undefined,
  nowMs: number,
  windowDays = 30,
): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  return nowMs - created <= windowDays * 24 * 60 * 60 * 1000;
}
