import { commerceDiagnosticMessage } from "@/lib/commerce/diagnostics";
/**
 * Commerce payment ledger — records payments via provider abstraction.
 * Mirrors to customer_payment_events for CRM timeline compatibility.
 */

import { writeCommerceAudit } from "@/lib/commerce/audit";
import { resolveConfiguredDepositCents } from "@/lib/commerce/booking-financials";
import { createInvoiceForAppointment } from "@/lib/commerce/invoices";
import {
  deriveAppointmentPaymentStatus,
  mapTransaction,
} from "@/lib/commerce/mappers";
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
  recorded?: boolean;
  canRetry?: boolean;
  syncStatus?: "complete" | "failed" | "unknown";
  replay?: boolean;
};

/** Receipt delivery is observable, but cannot change recorded money/sync truth. */
async function preparePaymentReceipt(input: {
  businessId: string;
  transactionId: string;
  actorId?: string | null;
  sendReceiptEmail?: boolean;
}): Promise<void> {
  let scope = "commerce.payment.receipt.create";
  try {
    const receipt = await createReceiptForTransaction(input);
    if (!receipt) throw new Error("Receipt creation failed.");
    if (input.sendReceiptEmail) {
      scope = "commerce.payment.receipt.email";
      const { queueReceiptEmail } = await import("@/lib/commerce/receipts");
      const emailed = await queueReceiptEmail(input.businessId, receipt.id);
      if (!emailed.ok) throw new Error(emailed.error ?? "Receipt email queue failed.");
    }
  } catch (error) {
    logQueryError(scope, commerceDiagnosticMessage(error));
  }
}

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
    logQueryError("commerce.payment.appointment.read", commerceDiagnosticMessage(apptErr));
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

  const service = appt.services as
    | {
        price?: number;
        deposit_cents?: number;
        deposit_required?: boolean;
      }
    | {
        price?: number;
        deposit_cents?: number;
        deposit_required?: boolean;
      }[]
    | null;
  const serviceRow = Array.isArray(service) ? service[0] : service;

  const priceCents =
    Number(appt.price_cents ?? 0) ||
    Math.round(Number(serviceRow?.price ?? 0) * 100);
  const taxCents = Math.max(0, Number(appt.tax_cents ?? 0));
  const appointmentTotalCents = priceCents + taxCents;
  const depositRequiredCents = resolveConfiguredDepositCents({
    appointmentDepositCents: appt.deposit_cents,
    serviceDepositCents: serviceRow?.deposit_cents,
    serviceDepositRequired: serviceRow?.deposit_required,
    appointmentTotalCents,
  });
  const amountPaid =
    Number(appt.amount_paid_cents ?? 0) + Math.max(0, paidDeltaCents);
  const amountRefunded = Number(appt.amount_refunded_cents ?? 0);
  const paymentStatus = deriveAppointmentPaymentStatus({
    priceCents: appointmentTotalCents,
    depositRequiredCents,
    amountPaidCents: amountPaid,
    amountRefundedCents: amountRefunded,
  });

  const { data: updated, error: updErr } = await supabase
    .from("appointments")
    .update({
      price_cents: priceCents || null,
      tax_cents: taxCents,
      amount_paid_cents: amountPaid,
      payment_status: paymentStatus,
      // Preserve an existing explicit deposit; never inflate with a % of subtotal.
      deposit_cents:
        Number(appt.deposit_cents ?? 0) > 0
          ? Number(appt.deposit_cents)
          : depositRequiredCents,
    })
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .eq("amount_paid_cents", appt.amount_paid_cents)
    .eq("amount_refunded_cents", appt.amount_refunded_cents)
    .select("id")
    .maybeSingle();

  if (updErr) {
    logQueryError("commerce.payment.appointment.update", commerceDiagnosticMessage(updErr));
    return {
      ok: false,
      error: updErr.message.includes("payment_status")
        ? "Couldn't update the appointment payment status. Payments may not be fully set up yet."
        : updErr.message,
    };
  }
  if (!updated) return { ok: false, error: "Appointment payment sync did not update a row; review the recorded payment." };
  return { ok: true };
}

async function applyInvoicePayment(
  businessId: string,
  invoiceId: string,
  paidDeltaCents: number,
  client?: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const supabase = client ?? (await createClient());
  const { data: inv, error: readError } = await supabase
    .from("commerce_invoices")
    .select("amount_paid_cents, total_cents, status")
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (readError || !inv) throw new Error(readError?.message ?? "Invoice payment sync could not read the invoice.");
  const amountPaid = Number(inv.amount_paid_cents ?? 0) + paidDeltaCents;
  const totalCents = Number(inv.total_cents ?? 0);
  const balance = Math.max(0, totalCents - amountPaid);
  const status =
    balance <= 0 ? "paid" : amountPaid > 0 ? "partial" : String(inv.status);

  const { data: updated, error: updateError } = await supabase
    .from("commerce_invoices")
    .update({
      amount_paid_cents: amountPaid,
      balance_cents: balance,
      status,
      paid_at: balance <= 0 ? new Date().toISOString() : null,
    })
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .eq("amount_paid_cents", inv.amount_paid_cents)
    .select("id")
    .maybeSingle();
  if (updateError || !updated) throw new Error(updateError?.message ?? "Invoice payment sync did not update a row.");
}

export async function recordCommercePayment(
  input: RecordPaymentInput,
): Promise<RecordPaymentResult> {
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const supabase = await createClient();
  let invoiceId = input.invoiceId ?? null;

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

  // All local payment validation must pass before issuing a payment-triggered invoice.
  // Keep invoice identity available to pending provider transactions as well.
  if (input.ensureInvoice && input.appointmentId && !invoiceId) {
    try {
      const created = await createInvoiceForAppointment({
        businessId: input.businessId,
        appointmentId: input.appointmentId,
        actorId: input.actorId,
      });
      if (!created.existingInvoiceUnverified) {
        if (created.error || !created.invoice) {
          throw new Error(created.error ?? "Could not prepare the payment invoice.");
        }
        invoiceId = created.invoice.id;
      }
      // An unverified existing invoice is logged by invoice preparation. Do not
      // bind it or create a replacement; collection can proceed independently.
    } catch (error) {
      logQueryError("commerce.payment.invoice.prepare", commerceDiagnosticMessage(error));
      return { ok: false, error: "Could not prepare the payment invoice. No payment was recorded." };
    }
  }

  const provider = input.forceManual
    ? resolvePaymentProvider("cash")
    : resolvePaymentProvider(input.method);

  const charge = await provider.charge({
    businessId: input.businessId,
    customerId: input.customerId,
    amountCents: input.amountCents,
    currency: input.currency ?? "usd",
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
        currency: input.currency ?? "usd",
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
      currency: input.currency ?? "usd",
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

  const transaction = mapTransaction(row as Record<string, unknown>);
  let syncStep = "store credit";
  try {
    if (input.method === "store_credit") {
      const credit = Number(customerRow.store_credit_cents ?? 0);
      const { data: updated, error: creditError } = await supabase
        .from("customers")
        .update({ store_credit_cents: credit - input.amountCents })
        .eq("id", input.customerId)
        .eq("business_id", input.businessId)
        .eq("store_credit_cents", credit)
        .select("id")
        .maybeSingle();
      if (creditError || !updated) throw new Error(creditError?.message ?? "Store-credit update failed.");
    }

    syncStep = "gift certificate";
    if (input.method === "gift_card" && giftCardRow) {
      const nextBalance = giftCardRow.balance_cents - input.amountCents;
      const { data: updated, error: giftErr } = await supabase
        .from("gift_cards")
        .update({
          balance_cents: nextBalance,
          status: nextBalance <= 0 ? "redeemed" : "active",
          redeemed_by_customer_id: input.customerId,
        })
        .eq("id", giftCardRow.id)
        .eq("business_id", input.businessId)
        .eq("balance_cents", giftCardRow.balance_cents)
        .select("id")
        .maybeSingle();
      if (giftErr || !updated) throw new Error(giftErr?.message ?? "Gift certificate update failed.");
    }

    syncStep = "appointment";
    if (input.appointmentId) {
      const sync = await syncAppointmentPayment(
        input.businessId,
        input.appointmentId,
        input.amountCents,
      );
      if (!sync.ok) throw new Error(sync.error ?? "Appointment payment sync failed.");
    }

    syncStep = "invoice payment";
    if (invoiceId) {
      await applyInvoicePayment(input.businessId, invoiceId, input.amountCents);
    }

    syncStep = "CRM payment mirror";
    // Legacy CRM timeline mirror
    const { error: mirrorError } = await supabase.from("customer_payment_events").insert({
      business_id: input.businessId,
      customer_id: input.customerId,
      appointment_id: input.appointmentId ?? null,
      amount_cents: input.amountCents,
      currency: input.currency ?? "usd",
      status: "paid",
      method: input.method,
      description: input.description ?? null,
      provider: charge.provider,
      provider_reference: charge.providerReference,
    });

    if (mirrorError) throw new Error(mirrorError.message);

    await preparePaymentReceipt({
      businessId: input.businessId,
      transactionId: String(row.id),
      actorId: input.actorId,
      sendReceiptEmail: input.sendReceiptEmail,
    });

    syncStep = "audit";
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

    syncStep = "event";
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
          currency: input.currency ?? "usd",
        },
      }),
    );

    return {
      ok: true,
      transaction,
      recorded: true,
      canRetry: false,
      syncStatus: "complete",
    };
  } catch (error) {
    logQueryError("commerce.payment.sync", commerceDiagnosticMessage(error));
    return {
      ok: false,
      recorded: true,
      canRetry: false,
      syncStatus: "failed",
      transaction,
      error: `Payment recorded, but ${syncStep} sync failed. Do not collect this payment again; review the recorded transaction.`,
    };
  }
}

/**
 * Finalize a Stripe PaymentIntent that was previously stored as requires_action.
 * Used by the Stripe webhook (service role) so booking / invoice / receipt stay in sync.
 */
export async function finalizeStripePaymentIntent(input: {
  providerPaymentIntentId: string;
}): Promise<RecordPaymentResult> {
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
    return { ok: true, recorded: true, canRetry: false, replay: true, syncStatus: "unknown", transaction: mapTransaction(row as Record<string, unknown>) };
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

  const { data: finalized, error: updErr } = await supabase
    .from("commerce_transactions")
    .update({
      status: "succeeded",
      description:
        String(row.description ?? "").replace(
          /\s*\(awaiting confirmation\)\s*$/i,
          "",
        ) || "Card payment",
    })
    .eq("id", row.id)
    .eq("business_id", businessId)
    .eq("status", row.status)
    .select("*")
    .maybeSingle();

  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  // Only the winner may apply deltas. A replay cannot prove prior sync completed.
  if (!finalized) return { ok: true, replay: true, canRetry: false, syncStatus: "unknown" };
  const transaction = mapTransaction(finalized as Record<string, unknown>);
  try {
    if (appointmentId) {
      const sync = await syncAppointmentPayment(
        businessId,
        appointmentId,
        amountCents,
        // Service role client is API-compatible for these table writes.
        supabase as unknown as Awaited<ReturnType<typeof createClient>>,
      );
      if (!sync.ok) {
        throw new Error(sync.error ?? "Appointment sync failed.");
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

    const { error: mirrorError } = await supabase.from("customer_payment_events").insert({
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

    if (mirrorError) throw new Error(mirrorError.message);

    await preparePaymentReceipt({
      businessId,
      transactionId: String(row.id),
      actorId: null,
      sendReceiptEmail: true,
    });

    await writeCommerceAudit({
      businessId,
      actorId: null,
      action: "payment.recorded",
      entityType: "commerce_transaction",
      entityId: String(row.id),
      summary: `Stripe PaymentIntent ${pi} finalized`,
    });

    return { ok: true, recorded: true, canRetry: false, syncStatus: "complete", transaction };
  } catch (error) {
    logQueryError("commerce.stripe.finalize.sync", commerceDiagnosticMessage(error));
    return {
      ok: false, recorded: true, canRetry: false, syncStatus: "failed", transaction,
      error: "Payment recorded, but downstream sync failed. Do not collect again; review the recorded transaction.",
    };
  }
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

  const service = appt.services as
    | {
        price?: number;
        deposit_cents?: number;
        deposit_required?: boolean;
      }
    | null
    | Array<{
        price?: number;
        deposit_cents?: number;
        deposit_required?: boolean;
      }>;
  const serviceRow = Array.isArray(service) ? service[0] : service;
  const priceCents =
    Number(appt.price_cents ?? 0) ||
    Math.round(Number(serviceRow?.price ?? 0) * 100);
  const taxCents = Math.max(0, Number(appt.tax_cents ?? 0));
  const appointmentTotalCents = priceCents + taxCents;
  const depositRequiredCents = resolveConfiguredDepositCents({
    appointmentDepositCents: appt.deposit_cents,
    serviceDepositCents: serviceRow?.deposit_cents,
    serviceDepositRequired: serviceRow?.deposit_required,
    appointmentTotalCents,
  });
  const amountPaid = Number(appt.amount_paid_cents ?? 0);
  const amountRefunded = Number(appt.amount_refunded_cents ?? 0);
  const paymentStatus =
    (appt.payment_status as ReturnType<typeof deriveAppointmentPaymentStatus>) ||
    deriveAppointmentPaymentStatus({
      priceCents: appointmentTotalCents,
      depositRequiredCents,
      amountPaidCents: amountPaid,
      amountRefundedCents: amountRefunded,
    });

  const history = await listTransactions({
    businessId,
    appointmentId,
    limit: 40,
  });

  return {
    appointmentId,
    paymentStatus,
    priceCents: appointmentTotalCents,
    subtotalCents: priceCents,
    taxCents,
    depositRequiredCents,
    amountPaidCents: amountPaid,
    amountRefundedCents: amountRefunded,
    outstandingBalanceCents: Math.max(
      0,
      appointmentTotalCents - (amountPaid - amountRefunded),
    ),
    invoiceNumber: (appt.invoice_number as string) ?? null,
    history,
  };
}

export { getActiveProviderSummary };
