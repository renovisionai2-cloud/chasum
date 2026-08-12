import { listInvoices } from "@/lib/commerce/invoices";
import {
  getActiveProviderSummary,
  listTransactions,
} from "@/lib/commerce/payments";
import { listRefunds } from "@/lib/commerce/refunds";
import { normalizeCurrency } from "@/lib/commerce/money";
import {
  appointmentCollectibleMoneyFromStamps,
  isCommerceInvoiceRecord,
  isGrossCollectionTransaction,
  isOutstandingInvoiceStatus,
} from "@/lib/commerce/money-contract";
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
      if (!isGrossCollectionTransaction(t)) return false;
      const at = new Date(t.occurredAt).getTime();
      return at >= from.getTime() && at <= to.getTime();
    })
    .reduce((s, t) => s + t.amountCents, 0);
}

function isOutstandingInvoice(invoice: CommerceInvoice): boolean {
  if (!isCommerceInvoiceRecord(invoice.id)) return false;
  if (invoice.balanceCents <= 0) return false;
  return isOutstandingInvoiceStatus(invoice.status);
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
    outstandingAppointmentBalancesCents: 0,
    outstandingAppointmentBalancesCount: 0,
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
        "id, customer_id, price_cents, tax_cents, amount_paid_cents, amount_refunded_cents, deposit_cents, payment_status, status, invoice_number, services(price, deposit_cents, deposit_required)",
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

  const openInvoices = invoices.filter(isOutstandingInvoice);

  const outstandingInvoicesCents = openInvoices.reduce(
    (s, i) => s + i.balanceCents,
    0,
  );

  const depositRows = depositAppts.data ?? [];
  let outstandingDepositsCents = 0;
  let outstandingDepositsCount = 0;
  let outstandingAppointmentBalancesCents = 0;
  let outstandingAppointmentBalancesCount = 0;
  for (const a of depositRows) {
    const money = appointmentCollectibleMoneyFromStamps({
      ...a,
      services: (a as { services?: unknown }).services,
    });
    if (money.collectibleDepositDueNowCents > 0) {
      outstandingDepositsCents += money.collectibleDepositDueNowCents;
      outstandingDepositsCount += 1;
    }
    if (money.collectibleRemainingBalanceCents > 0) {
      outstandingAppointmentBalancesCents +=
        money.collectibleRemainingBalanceCents;
      outstandingAppointmentBalancesCount += 1;
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

  const succeeded = transactions.filter(isGrossCollectionTransaction);
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
    outstandingAppointmentBalancesCents,
    outstandingAppointmentBalancesCount,
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
    outstandingDepositsCount: snap.outstandingDepositsCount,
    outstandingAppointmentBalancesCents: snap.outstandingAppointmentBalancesCents,
    refundsTrendCents: snap.refundsMonthCents,
    averageTransactionCents: snap.averageTransactionCents,
    averageCustomerValueCents: snap.averageCustomerValueCents,
  };
}
