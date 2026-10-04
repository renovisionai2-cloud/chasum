import {
  CUSTOMER_ACCOUNT_TENANT_SCOPE,
  projectCustomerAccountTotals,
} from "@/lib/commerce/customer-account-projection";
import { listActiveGiftCardsForCustomer } from "@/lib/commerce/gift-cards";
import { listInvoices } from "@/lib/commerce/invoices";
import { listTransactions } from "@/lib/commerce/payments";
import { listReceipts } from "@/lib/commerce/receipts";
import { listRefunds } from "@/lib/commerce/refunds";
import type { CustomerCommerceAccount } from "@/lib/commerce/types";
import { isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export async function getCustomerCommerceAccount(
  businessId: string,
  customerId: string,
): Promise<CustomerCommerceAccount> {
  const supabase = await createClient();

  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("id, store_credit_cents")
    .eq("id", customerId)
    .eq(CUSTOMER_ACCOUNT_TENANT_SCOPE.businessId, businessId)
    .maybeSingle();

  if (custErr && !isSoftSchemaFallbackAllowed(custErr.message)) {
    // Continue — billing can still aggregate from appointments / ledger.
  }

  const [invoices, receipts, refunds, timeline, apptRes, giftCards] =
    await Promise.all([
    listInvoices({ businessId, customerId, limit: 40 }),
    listReceipts({ businessId, customerId, limit: 40 }),
    listRefunds({ businessId, customerId, limit: 40 }),
    listTransactions({ businessId, customerId, limit: 60 }),
    supabase
      .from("appointments")
      .select(
        "id, price_cents, tax_cents, deposit_cents, amount_paid_cents, amount_refunded_cents, payment_status, status, services(price)",
      )
      .eq(CUSTOMER_ACCOUNT_TENANT_SCOPE.businessId, businessId)
      .eq(CUSTOMER_ACCOUNT_TENANT_SCOPE.customerId, customerId)
      .neq("status", "cancelled"),
    listActiveGiftCardsForCustomer(businessId, customerId),
  ]);

  // Missing payment columns cannot turn configured deposits into paid money.
  const appointments = apptRes.error ? [] : apptRes.data ?? [];

  const {
    depositsCents,
    totalPaidCents,
    outstandingBalanceCents,
    financialStatus,
  } = projectCustomerAccountTotals({
    appointments,
    invoices,
    timeline,
  });

  return {
    customerId,
    financialStatus,
    outstandingBalanceCents,
    lifetimeSpendCents: totalPaidCents,
    depositsCents,
    remainingBalanceCents: outstandingBalanceCents,
    totalPaidCents,
    storeCreditCents: Number(customer?.store_credit_cents ?? 0),
    giftCards: giftCards.map((g) => ({
      id: g.id,
      code: g.code,
      balanceCents: g.balance_cents,
    })),
    invoices,
    receipts,
    refunds,
    timeline,
  };
}

/** Summer / Chase read projection — never processes payments. */
export async function getSummerCommerceSnapshot(
  businessId: string,
  customerId: string,
) {
  const account = await getCustomerCommerceAccount(businessId, customerId);
  const openInvoices = account.invoices.filter((i) =>
    ["open", "partial", "overdue"].includes(i.status),
  );
  return {
    financialStatus: account.financialStatus,
    outstandingBalanceCents: account.outstandingBalanceCents,
    lifetimeSpendCents: account.lifetimeSpendCents,
    depositsCents: account.depositsCents,
    remainingBalanceCents: account.remainingBalanceCents,
    totalPaidCents: account.totalPaidCents,
    storeCreditCents: account.storeCreditCents,
    openInvoiceCount: openInvoices.length,
    openInvoices: openInvoices.slice(0, 5).map((i) => ({
      number: i.invoiceNumber,
      balanceCents: i.balanceCents,
      dueDate: i.dueDate,
      status: i.status,
    })),
    note: "Account totals are unverified because the available history may be incomplete or disagree. Summer may explain individual invoice balances and request deposits — never process card payments directly.",
  };
}
