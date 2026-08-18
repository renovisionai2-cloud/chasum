/**
 * Commerce payment ledger — records payments via provider abstraction.
 * Mirrors to customer_payment_events for CRM timeline compatibility.
 */

import { writeCommerceAudit } from "@/lib/commerce/audit";
import { createInvoiceForAppointment } from "@/lib/commerce/invoices";
import { mapTransaction } from "@/lib/commerce/mappers";
import { resolveNewCommerceCurrency } from "@/lib/commerce/money";
import { appointmentMoneyFromStamps } from "@/lib/commerce/money-contract";
import {
  getActiveProviderSummary,
  resolvePaymentProvider,
} from "@/lib/commerce/providers";
import { createReceiptForTransaction } from "@/lib/commerce/receipts";
import type {
  CommerceTransaction,
  PaymentMethod,
  TransactionKind,
} from "@/lib/commerce/types";
import { logQueryError, isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export type RecordPaymentInput = {
  businessId: string;
  customerId: string;
  amountCents: number;
  method: PaymentMethod;
  kind?: TransactionKind;
  appointmentId?: string | null;
  invoiceId?: string | null;
  description?: string | null;
  currency?: string;
  actorId?: string | null;
  /** When true, create/update invoice for appointment */
  ensureInvoice?: boolean;
  /** Force manual recording for cards when Stripe not completing client-side */
  forceManual?: boolean;
  /** Gift certificate code when method is gift_card */
  giftCardCode?: string | null;
  /** Gift certificate id when method is gift_card */
  giftCardId?: string | null;
  /** When true, queue/send receipt email after recording. Default false. */
  sendReceiptEmail?: boolean;
};

export type RecordPaymentResult = {
  ok: boolean;
  error?: string;
  transaction?: CommerceTransaction;
  clientSecret?: string | null;
  requiresAction?: boolean;
};

async function syncAppointmentPayment(
  businessId: string,
  appointmentId: string,
  paidDeltaCents: number,
  client?: Awaited<ReturnType<typeof createClient>>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = client ?? (await createClient());
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select(
      "id, price_cents, tax_cents, deposit_cents, amount_paid_cents, amount_refunded_cents, payment_status, services(price, deposit_cents, deposit_required)",
    )
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (apptErr) {
    // Retry without commerce columns if schema is behind.
    if (
      apptErr.message.includes("payment_status") ||
      apptErr.message.includes("amount_paid") ||
      apptErr.message.includes("price_cents")
    ) {
      return {
        ok: false,
        error:
          "Payments aren't fully set up yet. Contact support to finish commerce setup so deposits and balances can sync.",
      };
    }
    return { ok: false, error: apptErr.message };
  }

  if (!appt) {
    return { ok: false, error: "Appointment not found for payment sync." };
  }

  const nextPaid =
    Number(appt.amount_paid_cents ?? 0) + Math.max(0, paidDeltaCents);
  const money = appointmentMoneyFromStamps({
    ...appt,
    amount_paid_cents: nextPaid,
    services: appt.services,
  });

  const { error: updErr } = await supabase
    .from("appointments")
    .update({
      price_cents: money.subtotalCents || null,
      tax_cents: money.taxCents,
      amount_paid_cents: nextPaid,
      payment_status: money.paymentStatus,
      // Preserve an existing explicit deposit; never inflate with a % of subtotal.
      deposit_cents:
        Number(appt.deposit_cents ?? 0) > 0
          ? Number(appt.deposit_cents)
          : money.depositRequiredCents,
    })
    .eq("id", appointmentId);

  if (updErr) {
    return {
      ok: false,
      error: updErr.message.includes("payment_status")
        ? "Couldn't update the appointment payment status. Payments may not be fully set up yet."
        : updErr.message,
    };
  }
  return { ok: true };
}

async function applyInvoicePayment(
  businessId: string,
  invoiceId: string,
  paidDeltaCents: number,
  client?: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const supabase = client ?? (await createClient());
  const { data: inv } = await supabase
    .from("commerce_invoices")
    .select("amount_paid_cents, total_cents, status")
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!inv) return;
  const amountPaid = Number(inv.amount_paid_cents ?? 0) + paidDeltaCents;
  const totalCents = Number(inv.total_cents ?? 0);
  const balance = Math.max(0, totalCents - amountPaid);
  const status =
    balance <= 0 ? "paid" : amountPaid > 0 ? "partial" : String(inv.status);

  await supabase
    .from("commerce_invoices")
    .update({
      amount_paid_cents: amountPaid,
      balance_cents: balance,
      status,
      paid_at: balance <= 0 ? new Date().toISOString() : null,
    })
    .eq("id", invoiceId)
    .eq("business_id", businessId);
}

export async function recordCommercePayment(
  input: RecordPaymentInput,
): Promise<RecordPaymentResult> {
  if (input.amountCents <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const supabase = await createClient();
  let currency = resolveNewCommerceCurrency(input.currency);
  if (!String(input.currency ?? "").trim()) {
    const { data: biz } = await supabase
      .from("businesses")
      .select("currency")
      .eq("id", input.businessId)
      .maybeSingle();
    currency = resolveNewCommerceCurrency(input.currency, biz?.currency);
  }
  let invoiceId = input.invoiceId ?? null;

  if (input.ensureInvoice && input.appointmentId && !invoiceId) {
    const created = await createInvoiceForAppointment({
      businessId: input.businessId,
      appointmentId: input.appointmentId,
      actorId: input.actorId,
    });
    invoiceId = created.invoice?.id ?? null;
  }

  const { data: customer, error: customerErr } = await supabase
    .from("customers")
    .select("id, payment_provider_customer_id, store_credit_cents")
    .eq("id", input.customerId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  let customerRow = customer as {
    id: string;
    payment_provider_customer_id?: string | null;
    store_credit_cents?: number | null;
  } | null;

  if (customerErr) {
    if (
      customerErr.message.includes("store_credit") ||
      customerErr.message.includes("payment_provider") ||
      isSoftSchemaFallbackAllowed(customerErr.message)
    ) {
      const fallback = await supabase
        .from("customers")
        .select("id")
        .eq("id", input.customerId)
        .eq("business_id", input.businessId)
        .maybeSingle();
      if (fallback.error) {
        return {
          ok: false,
          error: fallback.error.message.includes("schema")
            ? "Payments aren't fully set up yet. Contact support to finish commerce setup."
            : fallback.error.message,
        };
      }
      if (!fallback.data) {
        return { ok: false, error: "Customer not found for this business." };
      }
      customerRow = {
        id: String(fallback.data.id),
        payment_provider_customer_id: null,
        store_credit_cents: 0,
      };
    } else {
      return { ok: false, error: customerErr.message };
    }
  }

  if (!customerRow) {
    return { ok: false, error: "Customer not found for this business." };
  }

  if (input.method === "store_credit") {
    const credit = Number(customerRow.store_credit_cents ?? 0);
    if (credit < input.amountCents) {
      return {
        ok: false,
        error: `Insufficient store credit (available $${(credit / 100).toFixed(2)}).`,
      };
    }
  }

  let giftCardRow: {
    id: string;
    code: string;
    balance_cents: number;
    status: string;
  } | null = null;

  if (input.method === "gift_card") {
    const code = (input.giftCardCode ?? "").trim().toUpperCase();
    const giftId = (input.giftCardId ?? "").trim();
    let query = supabase
      .from("gift_cards")
      .select("id, code, balance_cents, status")
      .eq("business_id", input.businessId)
      .eq("status", "active");
    if (giftId) query = query.eq("id", giftId);
    else if (code) query = query.eq("code", code);
    else {
      return {
        ok: false,
        error: "Select a gift certificate or enter its code.",
      };
    }
    const { data: card, error: cardErr } = await query.maybeSingle();
    if (cardErr) {
      return { ok: false, error: cardErr.message };
    }
    if (!card) {
      return { ok: false, error: "Gift certificate not found or inactive." };
    }
    if (Number(card.balance_cents) < input.amountCents) {
      return {
        ok: false,
        error: `Insufficient gift certificate balance (available $${(Number(card.balance_cents) / 100).toFixed(2)}).`,
      };
    }
    giftCardRow = {
      id: String(card.id),
      code: String(card.code),
      balance_cents: Number(card.balance_cents),
      status: String(card.status),
    };
  }

  const provider = input.forceManual
    ? resolvePaymentProvider("cash")
    : resolvePaymentProvider(input.method);

  const charge = await provider.charge({
    businessId: input.businessId,
    customerId: input.customerId,
    amountCents: input.amountCents,
    currency,
    method: input.method,
    description: input.description ?? undefined,
    providerCustomerId: customerRow.payment_provider_customer_id as string | null,
    metadata: {
      appointment_id: input.appointmentId ?? "",
      invoice_id: invoiceId ?? "",
    },
  });

  if (!charge.ok) {
    return { ok: false, error: charge.message ?? "Payment failed." };
  }

  if (charge.status === "requires_action") {
    // Persist pending transaction so staff can complete / track
    const { data: pending, error: pendingErr } = await supabase
      .from("commerce_transactions")
      .insert({
        business_id: input.businessId,
        customer_id: input.customerId,
        appointment_id: input.appointmentId ?? null,
        invoice_id: invoiceId,
        kind: input.kind ?? "payment",
        status: "requires_action",
        method: input.method,
        amount_cents: input.amountCents,
        currency,
        provider: charge.provider,
        provider_reference: charge.providerReference,
        provider_payment_intent_id: charge.providerPaymentIntentId,
        description: input.description ?? "Card payment (awaiting confirmation)",
        created_by: input.actorId ?? null,
      })
      .select("*")
      .single();

    if (pendingErr) {
      if (isSoftSchemaFallbackAllowed(pendingErr.message)) {
        return {
          ok: false,
          error:
            "Payments aren't fully set up yet. Contact support to finish commerce setup.",
        };
      }
      return { ok: false, error: pendingErr.message };
    }

    return {
      ok: false,
      requiresAction: true,
      clientSecret: charge.clientSecret,
      transaction: mapTransaction(pending as Record<string, unknown>),
      error:
        "Card payment needs customer confirmation that this screen can't finish yet. Check “Record card as manual POS” for in-person payments, or complete the PaymentIntent in Stripe.",
    };
  }

  const kind: TransactionKind =
    input.kind ??
    (input.description?.toLowerCase().includes("deposit")
      ? "deposit"
      : "payment");

  const { data: row, error } = await supabase
    .from("commerce_transactions")
    .insert({
      business_id: input.businessId,
      customer_id: input.customerId,
      appointment_id: input.appointmentId ?? null,
      invoice_id: invoiceId,
      kind,
      status: "succeeded",
      method: input.method,
      amount_cents: input.amountCents,
      currency,
      provider: charge.provider,
      provider_reference: charge.providerReference,
      provider_payment_intent_id: charge.providerPaymentIntentId,
      description:
        input.description ??
        (giftCardRow
          ? `Gift certificate ${giftCardRow.code}`
          : null),
      created_by: input.actorId ?? null,
      metadata: giftCardRow
        ? { gift_card_id: giftCardRow.id, gift_card_code: giftCardRow.code }
        : {},
    })
    .select("*")
    .single();

  if (error || !row) {
    if (error && isSoftSchemaFallbackAllowed(error.message)) {
      return {
        ok: false,
        error:
          "Payments aren't fully set up yet. Contact support to finish commerce setup.",
      };
    }
    return { ok: false, error: error?.message ?? "Could not record payment." };
  }

  if (input.method === "store_credit") {
    const credit = Number(customerRow.store_credit_cents ?? 0);
    await supabase
      .from("customers")
      .update({ store_credit_cents: credit - input.amountCents })
      .eq("id", input.customerId);
  }

  if (input.method === "gift_card" && giftCardRow) {
    const nextBalance = giftCardRow.balance_cents - input.amountCents;
    const { error: giftErr } = await supabase
      .from("gift_cards")
      .update({
        balance_cents: nextBalance,
        status: nextBalance <= 0 ? "redeemed" : "active",
        redeemed_by_customer_id: input.customerId,
      })
      .eq("id", giftCardRow.id)
      .eq("business_id", input.businessId);
    if (giftErr) {
      return {
        ok: false,
        error: `Payment recorded but gift certificate could not update: ${giftErr.message}`,
        transaction: mapTransaction(row as Record<string, unknown>),
      };
    }
  }

  if (input.appointmentId) {
    const sync = await syncAppointmentPayment(
      input.businessId,
      input.appointmentId,
      input.amountCents,
    );
    if (!sync.ok) {
      return {
        ok: false,
        error:
          sync.error ??
          "Payment recorded but appointment balance could not sync.",
        transaction: mapTransaction(row as Record<string, unknown>),
      };
    }
  }

  if (invoiceId) {
    await applyInvoicePayment(input.businessId, invoiceId, input.amountCents);
  }

  // Legacy CRM timeline mirror
  await supabase.from("customer_payment_events").insert({
    business_id: input.businessId,
    customer_id: input.customerId,
    appointment_id: input.appointmentId ?? null,
    amount_cents: input.amountCents,
    currency,
    status: "paid",
    method: input.method,
    description: input.description ?? null,
    provider: charge.provider,
    provider_reference: charge.providerReference,
  });

  const receipt = await createReceiptForTransaction({
    businessId: input.businessId,
    transactionId: String(row.id),
    actorId: input.actorId,
  });

  if (receipt && input.sendReceiptEmail) {
    try {
      const { queueReceiptEmail } = await import("@/lib/commerce/receipts");
      const emailed = await queueReceiptEmail(input.businessId, receipt.id);
      if (!emailed.ok) {
        logQueryError(
          "commerce.receipt.auto_email",
          emailed.error ?? "Receipt email was not queued.",
        );
      }
    } catch (err) {
      logQueryError(
        "commerce.receipt.auto_email",
        err instanceof Error ? err.message : "Receipt email queue failed.",
      );
    }
  }

  await writeCommerceAudit({
    businessId: input.businessId,
    actorId: input.actorId,
    action: "payment.recorded",
    entityType: "commerce_transaction",
    entityId: String(row.id),
    summary: `Payment ${input.amountCents}¢ via ${input.method} (${charge.provider})`,
    afterState: {
      amount_cents: input.amountCents,
      method: input.method,
      provider: charge.provider,
    },
  });

  const { createCommerceEvent, emitCommerceEvent } = await import(
    "@/lib/commerce/events"
  );
  await emitCommerceEvent(
    createCommerceEvent({
      type: kind === "deposit" ? "deposit.received" : "payment.received",
      businessId: input.businessId,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      entityId: String(row.id),
      payload: {
        amount_cents: input.amountCents,
        method: input.method,
        currency,
      },
    }),
  );

  return {
    ok: true,
    transaction: mapTransaction(row as Record<string, unknown>),
  };
}

/**
 * Finalize a Stripe PaymentIntent that was previously stored as requires_action.
 * Used by the Stripe webhook (service role) so booking / invoice / receipt stay in sync.
 */
export async function finalizeStripePaymentIntent(input: {
  providerPaymentIntentId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = createServiceClient();
  const pi = input.providerPaymentIntentId.trim();
  if (!pi) return { ok: false, error: "Missing payment intent id." };

  const { data: row, error } = await supabase
    .from("commerce_transactions")
    .select("*")
    .eq("provider_payment_intent_id", pi)
    .maybeSingle();

  if (error) {
    logQueryError("commerce.stripe.finalize.lookup", error.message);
    return { ok: false, error: error.message };
  }
  if (!row) {
    return { ok: false, error: "No commerce transaction for this PaymentIntent." };
  }

  if (String(row.status) === "succeeded") {
    return { ok: true };
  }

  if (String(row.status) !== "requires_action" && String(row.status) !== "pending") {
    return {
      ok: false,
      error: `Transaction status is ${String(row.status)}; expected requires_action.`,
    };
  }

  const businessId = String(row.business_id);
  const amountCents = Number(row.amount_cents ?? 0);
  const appointmentId = (row.appointment_id as string | null) ?? null;
  const invoiceId = (row.invoice_id as string | null) ?? null;
  const customerId = String(row.customer_id);
  const method = row.method as PaymentMethod;
  const currency = String(row.currency ?? "usd");

  const { error: updErr } = await supabase
    .from("commerce_transactions")
    .update({
      status: "succeeded",
      description:
        String(row.description ?? "").replace(
          /\s*\(awaiting confirmation\)\s*$/i,
          "",
        ) || "Card payment",
    })
    .eq("id", row.id);

  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  if (appointmentId) {
    const sync = await syncAppointmentPayment(
      businessId,
      appointmentId,
      amountCents,
      // Service role client is API-compatible for these table writes.
      supabase as unknown as Awaited<ReturnType<typeof createClient>>,
    );
    if (!sync.ok) {
      logQueryError(
        "commerce.stripe.finalize.appt",
        sync.error ?? "appointment sync failed",
      );
    }
  }

  if (invoiceId) {
    await applyInvoicePayment(
      businessId,
      invoiceId,
      amountCents,
      supabase as unknown as Awaited<ReturnType<typeof createClient>>,
    );
  }

  await supabase.from("customer_payment_events").insert({
    business_id: businessId,
    customer_id: customerId,
    appointment_id: appointmentId,
    amount_cents: amountCents,
    currency,
    status: "paid",
    method,
    description: "Card payment (Stripe confirmed)",
    provider: "stripe",
    provider_reference: pi,
  });

  // Receipt + email use the session client path; log and continue if unavailable.
  try {
    const receipt = await createReceiptForTransaction({
      businessId,
      transactionId: String(row.id),
      actorId: null,
    });
    if (receipt) {
      const { queueReceiptEmail } = await import("@/lib/commerce/receipts");
      await queueReceiptEmail(businessId, receipt.id);
    }
  } catch (err) {
    logQueryError(
      "commerce.stripe.finalize.receipt",
      err instanceof Error ? err.message : "receipt create failed",
    );
  }

  await writeCommerceAudit({
    businessId,
    actorId: null,
    action: "payment.recorded",
    entityType: "commerce_transaction",
    entityId: String(row.id),
    summary: `Stripe PaymentIntent ${pi} finalized`,
  });

  return { ok: true };
}

export async function listTransactions(input: {
  businessId: string;
  customerId?: string;
  appointmentId?: string;
  limit?: number;
}): Promise<CommerceTransaction[]> {
  const supabase = await createClient();
  let q = supabase
    .from("commerce_transactions")
    .select("*")
    .eq("business_id", input.businessId)
    .order("occurred_at", { ascending: false })
    .limit(input.limit ?? 50);

  if (input.customerId) q = q.eq("customer_id", input.customerId);
  if (input.appointmentId) q = q.eq("appointment_id", input.appointmentId);

  const { data, error } = await q;
  if (error) {
    if (!isSoftSchemaFallbackAllowed(error.message)) {
      logQueryError("commerce.tx.list", error.message);
    }
    return [];
  }
  return (data ?? []).map((r) => mapTransaction(r as Record<string, unknown>));
}

export async function getBookingPaymentSummary(
  businessId: string,
  appointmentId: string,
) {
  const supabase = await createClient();
  const { data: appt, error } = await supabase
    .from("appointments")
    .select(
      "id, price_cents, tax_cents, deposit_cents, amount_paid_cents, amount_refunded_cents, payment_status, invoice_number, services(price, deposit_cents, deposit_required)",
    )
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !appt) {
    return null;
  }

  const money = appointmentMoneyFromStamps({
    ...appt,
    services: appt.services,
  });

  const history = await listTransactions({
    businessId,
    appointmentId,
    limit: 40,
  });

  return {
    appointmentId,
    paymentStatus: money.paymentStatus,
    priceCents: money.totalCents,
    subtotalCents: money.subtotalCents,
    taxCents: money.taxCents,
    depositRequiredCents: money.depositRequiredCents,
    amountPaidCents: money.grossPaidCents,
    amountRefundedCents: money.refundedCents,
    outstandingBalanceCents: money.remainingBalanceCents,
    invoiceNumber: (appt.invoice_number as string) ?? null,
    history,
  };
}

export { getActiveProviderSummary };
