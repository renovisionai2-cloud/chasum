import { commerceDiagnosticMessage } from "@/lib/commerce/diagnostics";
import {
  CUSTOMER_ACCOUNT_TENANT_SCOPE,
  projectCustomerAccountTotals,
} from "@/lib/commerce/customer-account-projection";
import { listActiveGiftCardsForCustomer } from "@/lib/commerce/gift-cards";
import { mapInvoice, mapTransaction } from "@/lib/commerce/mappers";
import { listReceipts } from "@/lib/commerce/receipts";
import { listRefunds } from "@/lib/commerce/refunds";
import type { CustomerCommerceAccount } from "@/lib/commerce/types";
import { isSoftSchemaFallbackAllowed, logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

type AccountSource<T> = { data: T[] | null; error: unknown; count: number | null };

async function readAccountSource<T>(query: PromiseLike<AccountSource<T>>): Promise<AccountSource<T>> {
  try {
    return await query;
  } catch (error) {
    return { data: null, error, count: null };
  }
}

function isCompleteSource(source: AccountSource<unknown>): boolean {
  return !source.error && Array.isArray(source.data) &&
    Number.isInteger(source.count) && source.count !== null && source.count >= 0 &&
    source.count === source.data.length;
}

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

  const [invoiceRes, receipts, refunds, transactionRes, apptRes, giftCards] =
    await Promise.all([
    // Keep the read outcome: listInvoices' [] fallback cannot prove zero due.
    readAccountSource(supabase.from("commerce_invoices").select("*", { count: "exact" })
      .eq(CUSTOMER_ACCOUNT_TENANT_SCOPE.businessId, businessId)
      .eq(CUSTOMER_ACCOUNT_TENANT_SCOPE.customerId, customerId)
      .order("issue_date", { ascending: false }).limit(40)),
    listReceipts({ businessId, customerId, limit: 40 }),
    listRefunds({ businessId, customerId, limit: 40 }),
    readAccountSource(supabase.from("commerce_transactions").select("*", { count: "exact" })
      .eq(CUSTOMER_ACCOUNT_TENANT_SCOPE.businessId, businessId)
      .eq(CUSTOMER_ACCOUNT_TENANT_SCOPE.customerId, customerId)
      .order("occurred_at", { ascending: false }).limit(60)),
    readAccountSource(supabase
      .from("appointments")
      .select(
        "id, price_cents, tax_cents, deposit_cents, amount_paid_cents, amount_refunded_cents, payment_status, status, services(price)",
        { count: "exact" },
      )
      .eq(CUSTOMER_ACCOUNT_TENANT_SCOPE.businessId, businessId)
      .eq(CUSTOMER_ACCOUNT_TENANT_SCOPE.customerId, customerId)
      .neq("status", "cancelled")),
    listActiveGiftCardsForCustomer(businessId, customerId),
  ]);

  // Missing payment columns cannot turn configured deposits into paid money.
  const appointments = apptRes.error ? [] : apptRes.data ?? [];
  const invoices = invoiceRes.error ? [] : (invoiceRes.data ?? []).map((row) => mapInvoice(row));
  const timeline = transactionRes.error ? [] : (transactionRes.data ?? []).map((row) => mapTransaction(row));
  if (apptRes.error) logQueryError("commerce.account.appointments", commerceDiagnosticMessage(apptRes.error));
  if (invoiceRes.error) logQueryError("commerce.account.invoices", commerceDiagnosticMessage(invoiceRes.error));
  if (transactionRes.error) logQueryError("commerce.account.transactions", commerceDiagnosticMessage(transactionRes.error));

  const {
    depositsCents,
    totalPaidCents,
    outstandingBalanceCents,
    financialStatus,
  } = projectCustomerAccountTotals({
    appointments,
    invoices,
    timeline,
    currentSourcesAvailable: [apptRes, invoiceRes, transactionRes].every(isCompleteSource),
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
    note: "Lifetime paid, spend and deposit totals are unverified because history may be incomplete. Current outstanding may be stated when successfully read, untruncated appointment, invoice and payment sources agree; unavailable, truncated or disagreeing sources remain unknown and need review. Summer may explain individual invoice balances and request deposits — never process card payments directly.",
  };
}
