/**
 * Customer payment summary for the workspace — commerce SoT only.
 * Labels use “collected” / “outstanding”, never generic “revenue”.
 */

import type { CustomerCommerceAccount } from "@/lib/commerce/types";

export type CustomerPaymentSummaryView = {
  collectedCents: number;
  outstandingCents: number;
  invoiceCount: number;
  openInvoiceCount: number;
  depositsCents: number;
  refundsCents: number;
  refundCount: number;
  averageTransactionCents: number | null;
  storeCreditCents: number;
  giftCardBalanceCents: number;
};

export function buildCustomerPaymentSummary(
  account: CustomerCommerceAccount,
): CustomerPaymentSummaryView {
  const refundsCents = account.refunds.reduce(
    (sum, r) => sum + Number(r.amountCents ?? 0),
    0,
  );
  const succeeded = account.timeline.filter((t) => t.status === "succeeded");
  const averageTransactionCents =
    succeeded.length > 0
      ? Math.round(
          succeeded.reduce((s, t) => s + t.amountCents, 0) / succeeded.length,
        )
      : null;

  return {
    collectedCents: account.totalPaidCents,
    outstandingCents: account.outstandingBalanceCents,
    invoiceCount: account.invoices.length,
    openInvoiceCount: account.invoices.filter((i) =>
      ["open", "partial", "overdue"].includes(i.status),
    ).length,
    depositsCents: account.depositsCents,
    refundsCents,
    refundCount: account.refunds.length,
    averageTransactionCents,
    storeCreditCents: account.storeCreditCents,
    giftCardBalanceCents: account.giftCards.reduce(
      (s, g) => s + g.balanceCents,
      0,
    ),
  };
}
