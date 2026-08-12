import { listInvoices } from "@/lib/commerce/invoices";
import { listActiveGiftCardsForCustomer } from "@/lib/commerce/gift-cards";
import {
  appointmentMoneyFromStamps,
  isGrossCollectionTransaction,
  isOutstandingInvoiceStatus,
} from "@/lib/commerce/money-contract";
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
        "id, price_cents, tax_cents, deposit_cents, amount_paid_cents, amount_refunded_cents, payment_status, status, services(price, deposit_cents, deposit_required)",
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
      apptRes.error.message.includes("amount_paid") ||
      apptRes.error.message.includes("tax_cents"))
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
      tax_cents: 0,
      amount_paid_cents: Number(row.deposit_cents ?? 0),
      amount_refunded_cents: 0,
      payment_status: null,
    })) as typeof appointments;
  }

  let outstandingAppointmentBalanceCents = 0;
  let outstandingDepositDueCents = 0;
  let appointmentPaid = 0;
  let appointmentDepositsCollected = 0;

  for (const appt of appointments) {
    const money = appointmentMoneyFromStamps({
      ...appt,
      services: (appt as { services?: unknown }).services,
    });
    appointmentPaid += money.netPaidCents;
    appointmentDepositsCollected += money.depositCollectedCents;
    outstandingAppointmentBalanceCents += money.remainingBalanceCents;
    outstandingDepositDueCents += money.depositDueNowCents;
  }

  const outstandingInvoiceCents = invoices
    .filter((i) => isOutstandingInvoiceStatus(i.status) && i.balanceCents > 0)
    .reduce((s, i) => s + i.balanceCents, 0);

  const ledgerSpend = sumGrossFromTimeline(timeline);

  const depositsCents = Math.max(
    timeline
      .filter((t) => t.kind === "deposit" && t.status === "succeeded")
      .reduce((s, t) => s + t.amountCents, 0),
    appointmentDepositsCollected,
  );

  const totalPaidCents = Math.max(ledgerSpend, appointmentPaid);

  return {
    customerId,
    outstandingBalanceCents: outstandingAppointmentBalanceCents,
    outstandingAppointmentBalanceCents,
    outstandingInvoiceCents,
    outstandingDepositDueCents,
    lifetimeSpendCents: totalPaidCents,
    depositsCents,
    remainingBalanceCents: outstandingAppointmentBalanceCents,
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

function sumGrossFromTimeline(
  timeline: Awaited<ReturnType<typeof listTransactions>>,
): number {
  return timeline
    .filter(isGrossCollectionTransaction)
    .reduce((s, t) => s + t.amountCents, 0);
}

/** Summer / Chase read projection — never processes payments. */
export async function getSummerCommerceSnapshot(
  businessId: string,
  customerId: string,
) {
  const account = await getCustomerCommerceAccount(businessId, customerId);
  const openInvoices = account.invoices.filter(
    (i) => isOutstandingInvoiceStatus(i.status) && i.balanceCents > 0,
  );
  return {
    outstandingBalanceCents: account.outstandingBalanceCents,
    outstandingInvoiceCents: account.outstandingInvoiceCents,
    outstandingDepositDueCents: account.outstandingDepositDueCents,
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
