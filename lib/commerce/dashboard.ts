import { listInvoices } from "@/lib/commerce/invoices";
import {
  getActiveProviderSummary,
  listTransactions,
} from "@/lib/commerce/payments";
import { listRefunds } from "@/lib/commerce/refunds";
import { normalizeCurrency } from "@/lib/commerce/money";
import type {
  ChaseCommerceMetrics,
  CommerceDashboardSnapshot,
  CommerceInvoice,
} from "@/lib/commerce/types";
import {
  endOfBusinessDay,
  startOfBusinessDay,
  startOfBusinessMonth,
  startOfBusinessWeek,
} from "@/lib/business/datetime";
import { isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { addDays } from "date-fns";

/**
 * Gross payments collected (cash-in) for a period.
 * Succeeded deposit + payment ledger rows by occurredAt.
 * Refunds are NOT subtracted — display refunds separately.
 */
export function sumGrossPaymentsCollectedCents(
  txs: Awaited<ReturnType<typeof listTransactions>>,
  from: Date,
  to: Date,
): number {
  return sumSucceededPayments(txs, from, to);
}

function sumSucceededPayments(
  txs: Awaited<ReturnType<typeof listTransactions>>,
  from: Date,
  to: Date,
): number {
  return txs
    .filter((t) => {
      if (t.status !== "succeeded") return false;
      if (t.kind !== "payment" && t.kind !== "deposit") return false;
      const at = new Date(t.occurredAt).getTime();
      return at >= from.getTime() && at <= to.getTime();
    })
    .reduce((s, t) => s + t.amountCents, 0);
}

function isOutstandingInvoice(invoice: CommerceInvoice): boolean {
  if (invoice.balanceCents <= 0) return false;
  if (["paid", "void", "refunded"].includes(invoice.status)) return false;
  return true;
}

export async function getCommerceDashboardSnapshot(
  businessId: string,
  businessName: string,
  options?: { currency?: string | null; timezone?: string | null },
): Promise<CommerceDashboardSnapshot> {
  const supabase = await createClient();
  const now = new Date();
  const provider = getActiveProviderSummary();
  const currency = normalizeCurrency(options?.currency);
  const localeInput = {
    timezone: options?.timezone ?? "America/Toronto",
    currency,
  };

  const empty = (
    schemaReady: boolean,
    schemaMessage: string | null,
  ): CommerceDashboardSnapshot => ({
    businessId,
    businessName,
    currency,
    generatedAt: now.toISOString(),
    schemaReady,
    schemaMessage,
    revenueTodayCents: 0,
    revenueWeekCents: 0,
    revenueMonthCents: 0,
    outstandingInvoicesCents: 0,
    outstandingInvoicesCount: 0,
    outstandingDepositsCents: 0,
    outstandingDepositsCount: 0,
    refundsMonthCents: 0,
    averageTransactionCents: null,
    averageCustomerValueCents: null,
    recentTransactions: [],
    openInvoices: [],
    recentRefunds: [],
    provider,
  });

  const probe = await supabase
    .from("commerce_transactions")
    .select("id")
    .eq("business_id", businessId)
    .limit(1);

  if (probe.error && isSoftSchemaFallbackAllowed(probe.error.message)) {
    return empty(
      false,
      "Payments aren't fully set up yet. Contact support or your admin to finish commerce setup.",
    );
  }

  const [transactions, invoices, refunds, depositAppts] = await Promise.all([
    listTransactions({ businessId, limit: 500 }),
    listInvoices({ businessId, limit: 200 }),
    listRefunds({ businessId, limit: 100 }),
    supabase
      .from("appointments")
      .select(
        "id, customer_id, price_cents, amount_paid_cents, amount_refunded_cents, deposit_cents, payment_status, status, invoice_number, customer:customers(name)",
      )
      .eq("business_id", businessId)
      .in("payment_status", [
        "unpaid",
        "deposit_required",
        "deposit_paid",
        "partially_paid",
      ])
      .not("status", "eq", "cancelled")
      .limit(200),
  ]);

  const dayStart = startOfBusinessDay(now, localeInput);
  const dayEnd = endOfBusinessDay(now, localeInput);
  const weekStart = startOfBusinessWeek(now, localeInput);
  const weekEndBiz = endOfBusinessDay(addDays(weekStart, 6), localeInput);
  const monthStart = startOfBusinessMonth(now, localeInput);
  const nextMonthStart = startOfBusinessMonth(
    addDays(monthStart, 35),
    localeInput,
  );
  const monthEndBiz = new Date(nextMonthStart.getTime() - 1);

  const revenueTodayCents = sumSucceededPayments(transactions, dayStart, dayEnd);
  const revenueWeekCents = sumSucceededPayments(
    transactions,
    weekStart,
    weekEndBiz,
  );
  const revenueMonthCents = sumSucceededPayments(
    transactions,
    monthStart,
    monthEndBiz,
  );

  let openInvoices = invoices.filter(isOutstandingInvoice);

  // Surface unpaid appointment balances that have no matching open commerce invoice.
  const openInvoiceApptIds = new Set(
    openInvoices
      .map((i) => i.appointmentId)
      .filter((id): id is string => Boolean(id)),
  );
  const depositRows = depositAppts.data ?? [];
  const syntheticFromAppts: CommerceInvoice[] = [];
  for (const a of depositRows) {
    if (openInvoiceApptIds.has(String(a.id))) continue;
    const price = Number(a.price_cents ?? 0);
    const paid = Number(a.amount_paid_cents ?? 0);
    const refunded = Number(a.amount_refunded_cents ?? 0);
    const balance = Math.max(0, price - Math.max(0, paid - refunded));
    if (balance <= 0) continue;
    const cust = a.customer as
      | { name?: string | null }
      | { name?: string | null }[]
      | null;
    const custName = Array.isArray(cust)
      ? cust[0]?.name
      : cust?.name;
    syntheticFromAppts.push({
      id: `appt:${a.id}`,
      businessId,
      customerId: String(a.customer_id ?? ""),
      appointmentId: String(a.id),
      invoiceNumber:
        (a.invoice_number as string | null) ||
        `Booking ${String(a.id).slice(0, 8)}`,
      status:
        paid > 0 ? "partial" : ("open" as const),
      issueDate: now.toISOString().slice(0, 10),
      dueDate: null,
      currency,
      subtotalCents: price,
      taxCents: 0,
      discountCents: 0,
      totalCents: price,
      amountPaidCents: Math.max(0, paid - refunded),
      amountRefundedCents: refunded,
      balanceCents: balance,
      notes: null,
      businessSnapshot: {},
      customerSnapshot: { name: custName ?? null },
      lines: [],
      createdAt: now.toISOString(),
    });
  }
  openInvoices = [...openInvoices, ...syntheticFromAppts];

  const outstandingInvoicesCents = openInvoices.reduce(
    (s, i) => s + i.balanceCents,
    0,
  );

  let outstandingDepositsCents = 0;
  let outstandingDepositsCount = 0;
  for (const a of depositRows) {
    const price = Number(a.price_cents ?? 0);
    const paid = Number(a.amount_paid_cents ?? a.deposit_cents ?? 0);
    const due = Math.max(0, price - paid);
    if (due > 0) {
      outstandingDepositsCents += due;
      outstandingDepositsCount += 1;
    }
  }

  const monthRefunds = refunds.filter((r) => {
    const at = new Date(r.createdAt).getTime();
    return (
      r.status === "succeeded" &&
      at >= monthStart.getTime() &&
      at <= monthEndBiz.getTime()
    );
  });
  const refundsMonthCents = monthRefunds.reduce((s, r) => s + r.amountCents, 0);

  const succeeded = transactions.filter(
    (t) =>
      t.status === "succeeded" &&
      (t.kind === "payment" || t.kind === "deposit"),
  );
  const averageTransactionCents =
    succeeded.length > 0
      ? Math.round(
          succeeded.reduce((s, t) => s + t.amountCents, 0) / succeeded.length,
        )
      : null;

  const byCustomer = new Map<string, number>();
  for (const t of succeeded) {
    byCustomer.set(
      t.customerId,
      (byCustomer.get(t.customerId) ?? 0) + t.amountCents,
    );
  }
  const values = [...byCustomer.values()];
  const averageCustomerValueCents =
    values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : null;

  return {
    businessId,
    businessName,
    currency,
    generatedAt: now.toISOString(),
    schemaReady: true,
    schemaMessage: null,
    revenueTodayCents,
    revenueWeekCents,
    revenueMonthCents,
    outstandingInvoicesCents,
    outstandingInvoicesCount: openInvoices.length,
    outstandingDepositsCents,
    outstandingDepositsCount,
    refundsMonthCents,
    averageTransactionCents,
    averageCustomerValueCents,
    recentTransactions: transactions.slice(0, 25),
    openInvoices: openInvoices.slice(0, 20),
    recentRefunds: refunds.slice(0, 15),
    provider,
  };
}

export async function getChaseCommerceMetrics(
  businessId: string,
): Promise<ChaseCommerceMetrics> {
  const snap = await getCommerceDashboardSnapshot(businessId, "");
  return {
    revenueTodayCents: snap.revenueTodayCents,
    revenueWeekCents: snap.revenueWeekCents,
    revenueMonthCents: snap.revenueMonthCents,
    outstandingInvoicesCents: snap.outstandingInvoicesCents,
    outstandingDepositsCents: snap.outstandingDepositsCents,
    refundsTrendCents: snap.refundsMonthCents,
    averageTransactionCents: snap.averageTransactionCents,
    averageCustomerValueCents: snap.averageCustomerValueCents,
  };
}
