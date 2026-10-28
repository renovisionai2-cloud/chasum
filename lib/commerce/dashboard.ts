import "server-only";
import { requireBusiness } from "@/lib/actions/business";
import { listInvoices } from "@/lib/commerce/invoices";
import { getActiveProviderSummary, listTransactions } from "@/lib/commerce/payments";
import { listRefunds } from "@/lib/commerce/refunds";
import { readFinancialAggregate } from "./financial-aggregate/reader";
import { singleFinancialAmount, unknownMoney } from "./financial-aggregate/types";
import type { ChaseCommerceMetrics, CommerceDashboardSnapshot } from "./types";

/** Recent documents are display lists, never aggregate completeness evidence. */
export async function getCommerceDashboardSnapshot(
  businessId: string, businessName: string, _options?: { currency?: string | null; timezone?: string | null },
): Promise<CommerceDashboardSnapshot> {
  void _options; // Period/currency authority is resolved server-side, never from caller hints.
  const business = await requireBusiness();
  if (business.id !== businessId) throw new Error("Not authorized");
  const [today, week, month, transactions, invoices, refunds] = await Promise.all([
    readFinancialAggregate({ period: "today" }), readFinancialAggregate({ period: "week" }), readFinancialAggregate({ period: "month" }),
    listTransactions({ businessId: business.id, limit: 25 }), listInvoices({ businessId: business.id, limit: 20 }), listRefunds({ businessId: business.id, limit: 15 }),
  ]);
  const openInvoices = invoices.filter(i => ["open", "partial", "overdue"].includes(i.status));
  return {
    businessId: business.id, businessName: businessName || business.name, currency: business.currency ?? "",
    generatedAt: new Date().toISOString(), schemaReady: today.state !== "UNKNOWN", schemaMessage: today.state === "UNKNOWN" ? "Collected money is unverified." : null,
    revenueTodayCents: singleFinancialAmount(today), revenueWeekCents: singleFinancialAmount(week), revenueMonthCents: singleFinancialAmount(month),
    outstandingInvoicesCents: unknownMoney("DOCUMENT_LIST_IS_NOT_COMPLETE_BALANCE"), outstandingInvoicesCount: openInvoices.length,
    outstandingDepositsCents: unknownMoney("CONFIGURED_DEPOSIT_IS_NOT_COLLECTION"), outstandingDepositsCount: 0,
    refundsMonthCents: unknownMoney("REFUNDS_ARE_VETO_EVIDENCE_ONLY"),
    averageTransactionCents: unknownMoney("AVERAGE_NOT_PROVEN"), averageCustomerValueCents: unknownMoney("LIFETIME_HISTORY_UNVERIFIED"),
    recentTransactions: transactions, openInvoices, recentRefunds: refunds, provider: getActiveProviderSummary(),
  };
}
export async function getChaseCommerceMetrics(businessId: string): Promise<ChaseCommerceMetrics> {
  const snap = await getCommerceDashboardSnapshot(businessId, "");
  return { revenueTodayCents: snap.revenueTodayCents, revenueWeekCents: snap.revenueWeekCents, revenueMonthCents: snap.revenueMonthCents,
    outstandingInvoicesCents: snap.outstandingInvoicesCents, outstandingDepositsCents: snap.outstandingDepositsCents,
    refundsTrendCents: snap.refundsMonthCents, averageTransactionCents: snap.averageTransactionCents, averageCustomerValueCents: snap.averageCustomerValueCents };
}
