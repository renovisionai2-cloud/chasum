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

  const empty: CustomerCommerceAccount = {
    customerId,
    outstandingBalanceCents: 0,
    lifetimeSpendCents: 0,
    depositsCents: 0,
    storeCreditCents: 0,
    invoices: [],
    receipts: [],
    refunds: [],
    timeline: [],
  };

  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("id, store_credit_cents")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (custErr && isSoftSchemaFallbackAllowed(custErr.message)) {
    return empty;
  }

  const [invoices, receipts, refunds, timeline] = await Promise.all([
    listInvoices({ businessId, customerId, limit: 40 }),
    listReceipts({ businessId, customerId, limit: 40 }),
    listRefunds({ businessId, customerId, limit: 40 }),
    listTransactions({ businessId, customerId, limit: 60 }),
  ]);

  const outstandingBalanceCents = invoices
    .filter((i) => ["open", "partial", "overdue"].includes(i.status))
    .reduce((s, i) => s + i.balanceCents, 0);

  const lifetimeSpendCents = timeline
    .filter(
      (t) =>
        t.status === "succeeded" &&
        (t.kind === "payment" || t.kind === "deposit"),
    )
    .reduce((s, t) => s + t.amountCents, 0);

  const depositsCents = timeline
    .filter((t) => t.kind === "deposit" && t.status === "succeeded")
    .reduce((s, t) => s + t.amountCents, 0);

  return {
    customerId,
    outstandingBalanceCents,
    lifetimeSpendCents,
    depositsCents,
    storeCreditCents: Number(customer?.store_credit_cents ?? 0),
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
    outstandingBalanceCents: account.outstandingBalanceCents,
    lifetimeSpendCents: account.lifetimeSpendCents,
    depositsCents: account.depositsCents,
    storeCreditCents: account.storeCreditCents,
    openInvoiceCount: openInvoices.length,
    openInvoices: openInvoices.slice(0, 5).map((i) => ({
      number: i.invoiceNumber,
      balanceCents: i.balanceCents,
      dueDate: i.dueDate,
      status: i.status,
    })),
    note: "Summer may explain balances and request deposits — never process card payments directly.",
  };
}
