import { listInvoices } from "@/lib/commerce/invoices";
import { listActiveGiftCardsForCustomer } from "@/lib/commerce/gift-cards";
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
    .eq("business_id", businessId)
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
        "id, price_cents, deposit_cents, amount_paid_cents, amount_refunded_cents, payment_status, status, services(price)",
      )
      .eq("business_id", businessId)
      .eq("customer_id", customerId)
      .neq("status", "cancelled"),
    listActiveGiftCardsForCustomer(businessId, customerId),
  ]);

  let appointments = apptRes.data ?? [];
  if (
    apptRes.error &&
    (apptRes.error.message.includes("price_cents") ||
      apptRes.error.message.includes("payment_status") ||
      apptRes.error.message.includes("amount_paid"))
  ) {
    const fallback = await supabase
      .from("appointments")
      .select("id, deposit_cents, status, services(price)")
      .eq("business_id", businessId)
      .eq("customer_id", customerId)
      .neq("status", "cancelled");
    appointments = (fallback.data ?? []).map((row) => ({
      ...row,
      price_cents: null,
      amount_paid_cents: Number(row.deposit_cents ?? 0),
      amount_refunded_cents: 0,
      payment_status: null,
    }));
  }

  let appointmentOutstanding = 0;
  let appointmentDeposits = 0;
  let appointmentPaid = 0;

  for (const appt of appointments) {
    const service = appt.services as
      | { price?: number }
      | { price?: number }[]
      | null;
    const serviceRow = Array.isArray(service) ? service[0] : service;
    const price =
      Number(appt.price_cents ?? 0) ||
      Math.round(Number(serviceRow?.price ?? 0) * 100);
    const paid = Number(
      appt.amount_paid_cents ?? appt.deposit_cents ?? 0,
    );
    const refunded = Number(appt.amount_refunded_cents ?? 0);
    const netPaid = Math.max(0, paid - refunded);
    appointmentPaid += netPaid;
    appointmentDeposits += Math.min(
      netPaid,
      Number(appt.deposit_cents ?? 0) || netPaid,
    );
    appointmentOutstanding += Math.max(0, price - netPaid);
  }

  const invoiceOutstanding = invoices
    .filter((i) => ["open", "partial", "overdue"].includes(i.status))
    .reduce((s, i) => s + i.balanceCents, 0);

  const ledgerSpend = timeline
    .filter(
      (t) =>
        t.status === "succeeded" &&
        (t.kind === "payment" ||
          t.kind === "deposit" ||
          t.kind === "gift_card" ||
          t.method === "gift_card"),
    )
    .reduce((s, t) => s + t.amountCents, 0);

  const depositsCents = Math.max(
    timeline
      .filter((t) => t.kind === "deposit" && t.status === "succeeded")
      .reduce((s, t) => s + t.amountCents, 0),
    appointmentDeposits,
  );

  const totalPaidCents = Math.max(ledgerSpend, appointmentPaid);
  // Prefer live appointment balances; fall back to open invoices.
  const outstandingBalanceCents = Math.max(
    appointmentOutstanding,
    invoiceOutstanding,
  );

  return {
    customerId,
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
    note: "Summer may explain balances and request deposits — never process card payments directly.",
  };
}
