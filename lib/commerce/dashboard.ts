import { listInvoices } from "@/lib/commerce/invoices";
import {
  getActiveProviderSummary,
  listTransactions,
} from "@/lib/commerce/payments";
import { listRefunds } from "@/lib/commerce/refunds";
import type {
  ChaseCommerceMetrics,
  CommerceDashboardSnapshot,
} from "@/lib/commerce/types";
import { isMissingSchemaError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  startOfDay,
  endOfDay,
} from "date-fns";

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

export async function getCommerceDashboardSnapshot(
  businessId: string,
  businessName: string,
): Promise<CommerceDashboardSnapshot> {
  const supabase = await createClient();
  const now = new Date();
  const provider = getActiveProviderSummary();

  const probe = await supabase
    .from("commerce_transactions")
    .select("id")
    .eq("business_id", businessId)
    .limit(1);

  if (probe.error && isMissingSchemaError(probe.error.message)) {
    return {
      businessId,
      businessName,
      generatedAt: now.toISOString(),
      schemaReady: false,
      schemaMessage:
        "Apply migration 028_commerce_platform to enable the Commerce Platform.",
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
    };
  }

  const [transactions, invoices, refunds, depositAppts] = await Promise.all([
    listTransactions({ businessId, limit: 500 }),
    listInvoices({ businessId, limit: 200 }),
    listRefunds({ businessId, limit: 100 }),
    supabase
      .from("appointments")
      .select("id, price_cents, amount_paid_cents, deposit_cents, payment_status, status")
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

  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const revenueTodayCents = sumSucceededPayments(transactions, dayStart, dayEnd);
  const revenueWeekCents = sumSucceededPayments(transactions, weekStart, weekEnd);
  const revenueMonthCents = sumSucceededPayments(
    transactions,
    monthStart,
    monthEnd,
  );

  const openInvoices = invoices.filter((i) =>
    ["open", "partial", "overdue"].includes(i.status),
  );
  const outstandingInvoicesCents = openInvoices.reduce(
    (s, i) => s + i.balanceCents,
    0,
  );

  const depositRows = depositAppts.data ?? [];
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
      at <= monthEnd.getTime()
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
