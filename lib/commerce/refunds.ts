import { commerceDiagnosticMessage } from "@/lib/commerce/diagnostics";
import { writeCommerceAudit } from "@/lib/commerce/audit";
import { mapRefund, mapTransaction } from "@/lib/commerce/mappers";
import { resolvePaymentProvider } from "@/lib/commerce/providers";
import type { CommerceRefund, PaymentMethod } from "@/lib/commerce/types";
import { logQueryError, isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export type ProcessRefundInput = {
  businessId: string;
  transactionId: string;
  amountCents: number;
  reason: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  actorId?: string | null;
};

export async function processCommerceRefund(
  input: ProcessRefundInput,
): Promise<{ ok: boolean; error?: string; refund?: CommerceRefund; recorded?: boolean; canRetry?: boolean; syncStatus?: "complete" | "failed" }> {
  if (input.amountCents <= 0) {
    return { ok: false, error: "Refund amount must be greater than zero." };
  }
  if (!input.reason.trim()) {
    return { ok: false, error: "Refund reason is required." };
  }

  const supabase = await createClient();
  const { data: txRow, error: txErr } = await supabase
    .from("commerce_transactions")
    .select("*")
    .eq("id", input.transactionId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (txErr || !txRow) {
    return { ok: false, error: txErr?.message ?? "Transaction not found." };
  }

  const tx = mapTransaction(txRow as Record<string, unknown>);
  if (tx.status !== "succeeded" && tx.status !== "partially_refunded") {
    return { ok: false, error: "Only succeeded payments can be refunded." };
  }

  const { data: priorRefunds, error: historyError } = await supabase
    .from("commerce_refunds")
    .select("amount_cents, status")
    .eq("business_id", input.businessId)
    .eq("transaction_id", input.transactionId)
    .eq("status", "succeeded");

  if (historyError || !priorRefunds) {
    logQueryError("commerce.refund.history", commerceDiagnosticMessage(historyError ?? "Refund history returned no data."));
    return { ok: false, error: "Could not verify prior refunds. No refund was issued." };
  }

  const alreadyRefunded = (priorRefunds ?? []).reduce(
    (s, r) => s + Number(r.amount_cents ?? 0),
    0,
  );
  const remaining = tx.amountCents - alreadyRefunded;
  if (input.amountCents > remaining) {
    return {
      ok: false,
      error: `Refund exceeds remaining amount ($${(remaining / 100).toFixed(2)}).`,
    };
  }

  const approval = input.approvalStatus ?? "approved";
  if (approval === "rejected") {
    return { ok: false, error: "Refund was rejected." };
  }

  const refundType = input.amountCents >= remaining ? "full" : "partial";
  let providerRef: string | null = null;
  let status: "pending" | "succeeded" | "failed" = "succeeded";

  if (approval === "pending") {
    status = "pending";
  } else {
    const provider = resolvePaymentProvider(tx.method as PaymentMethod);
    // For card refunds through Stripe when reference exists
    if (tx.provider === "stripe") {
      const stripe = resolvePaymentProvider("credit_card");
      const result = await stripe.refund({
        amountCents: input.amountCents,
        currency: tx.currency,
        providerReference: tx.providerReference,
        providerPaymentIntentId: tx.providerPaymentIntentId,
        reason: input.reason,
      });
      if (!result.ok) {
        // Fall back to manual ledger refund when Stripe not configured
        if (result.message?.includes("not configured")) {
          const manual = await provider.refund({
            amountCents: input.amountCents,
            currency: tx.currency,
            providerReference: tx.providerReference,
            providerPaymentIntentId: tx.providerPaymentIntentId,
            reason: input.reason,
          });
          providerRef = manual.providerReference;
        } else {
          return { ok: false, error: result.message ?? "Refund failed." };
        }
      } else {
        providerRef = result.providerReference;
      }
    } else {
      const result = await provider.refund({
        amountCents: input.amountCents,
        currency: tx.currency,
        providerReference: tx.providerReference,
        providerPaymentIntentId: tx.providerPaymentIntentId,
        reason: input.reason,
      });
      if (!result.ok) {
        return { ok: false, error: result.message ?? "Refund failed." };
      }
      providerRef = result.providerReference;
    }
  }

  const { data: refundRow, error } = await supabase
    .from("commerce_refunds")
    .insert({
      business_id: input.businessId,
      customer_id: tx.customerId,
      transaction_id: input.transactionId,
      invoice_id: tx.invoiceId,
      appointment_id: tx.appointmentId,
      amount_cents: input.amountCents,
      currency: tx.currency,
      reason: input.reason.trim(),
      refund_type: refundType,
      approval_status: approval,
      approved_by: approval === "approved" ? input.actorId ?? null : null,
      approved_at: approval === "approved" ? new Date().toISOString() : null,
      provider: tx.provider,
      provider_reference: providerRef,
      status,
      created_by: input.actorId ?? null,
    })
    .select("*")
    .single();

  if (error || !refundRow) {
    if (error && isSoftSchemaFallbackAllowed(error.message)) {
      return {
        ok: false,
        error:
          "Payments aren't fully set up yet. Contact support to finish commerce setup.",
      };
    }
    return { ok: false, error: error?.message ?? "Could not create refund." };
  }

  const refund = mapRefund(refundRow as Record<string, unknown>);
  try {
    if (status === "succeeded") {
      const newRefunded = alreadyRefunded + input.amountCents;
      const { data: updated, error: updateError } = await supabase
        .from("commerce_transactions")
        .update({
          status:
            newRefunded >= tx.amountCents ? "refunded" : "partially_refunded",
        })
        .eq("id", input.transactionId)
        .eq("business_id", input.businessId)
        .select("id")
        .maybeSingle();
      if (updateError || !updated) throw new Error(updateError?.message ?? "Refund transaction sync failed.");

      // Ledger refund transaction
      const { error: ledgerError } = await supabase.from("commerce_transactions").insert({
        business_id: input.businessId,
        customer_id: tx.customerId,
        appointment_id: tx.appointmentId,
        invoice_id: tx.invoiceId,
        kind: "refund",
        status: "succeeded",
        method: tx.method,
        amount_cents: input.amountCents,
        currency: tx.currency,
        provider: tx.provider,
        provider_reference: providerRef,
        description: `Refund: ${input.reason.trim()}`,
        created_by: input.actorId ?? null,
      });

      if (ledgerError) throw new Error(ledgerError?.message ?? "Refund ledger sync failed.");

      if (tx.appointmentId) {
        const { data: appt, error: readError } = await supabase
          .from("appointments")
          .select("amount_paid_cents, amount_refunded_cents, price_cents, deposit_cents, payment_status")
          .eq("id", tx.appointmentId)
          .eq("business_id", input.businessId)
          .maybeSingle();
        if (readError || !appt) throw new Error(readError?.message ?? "Refund appointments read failed.");
        if (appt) {
          const amountRefunded =
            Number(appt.amount_refunded_cents ?? 0) + input.amountCents;
          const amountPaid = Number(appt.amount_paid_cents ?? 0);
          const priceCents = Number(appt.price_cents ?? 0);
          const net = Math.max(0, amountPaid - amountRefunded);
          const paymentStatus =
            net <= 0
              ? "refunded"
              : net < priceCents
                ? "partially_paid"
                : "fully_paid";
          const { data: updated, error: updateError } = await supabase
            .from("appointments")
            .update({
              amount_refunded_cents: amountRefunded,
              payment_status: paymentStatus,
            })
            .eq("id", tx.appointmentId)
            .eq("business_id", input.businessId)
            .eq("amount_refunded_cents", appt.amount_refunded_cents)
            .eq("amount_paid_cents", appt.amount_paid_cents)
            .select("id")
            .maybeSingle();
          if (updateError || !updated) throw new Error(updateError?.message ?? "Refund appointments sync failed.");
        }
      }

      if (tx.invoiceId) {
        const { data: inv, error: readError } = await supabase
          .from("commerce_invoices")
          .select("amount_paid_cents, amount_refunded_cents, total_cents, balance_cents")
          .eq("id", tx.invoiceId)
          .eq("business_id", input.businessId)
          .maybeSingle();
        if (readError || !inv) throw new Error(readError?.message ?? "Refund commerce_invoices read failed.");
        if (inv) {
          const amountRefunded =
            Number(inv.amount_refunded_cents ?? 0) + input.amountCents;
          const amountPaid = Number(inv.amount_paid_cents ?? 0);
          const balance = Math.max(
            0,
            Number(inv.total_cents ?? 0) - (amountPaid - amountRefunded),
          );
          const { data: updated, error: updateError } = await supabase
            .from("commerce_invoices")
            .update({
              amount_refunded_cents: amountRefunded,
              balance_cents: balance,
              status:
                amountRefunded >= amountPaid
                  ? "refunded"
                  : balance > 0
                    ? "partial"
                    : "paid",
            })
            .eq("id", tx.invoiceId)
            .eq("business_id", input.businessId)
            .eq("amount_refunded_cents", inv.amount_refunded_cents)
            .eq("amount_paid_cents", inv.amount_paid_cents)
            .select("id")
            .maybeSingle();
          if (updateError || !updated) throw new Error(updateError?.message ?? "Refund commerce_invoices sync failed.");
        }
      }

      const { error: mirrorError } = await supabase.from("customer_payment_events").insert({
        business_id: input.businessId,
        customer_id: tx.customerId,
        appointment_id: tx.appointmentId,
        amount_cents: input.amountCents,
        currency: tx.currency,
        status: "refunded",
        method: tx.method,
        description: `Refund: ${input.reason.trim()}`,
        provider: tx.provider,
        provider_reference: providerRef,
      });
      if (mirrorError) throw new Error(mirrorError?.message ?? "Refund CRM mirror failed.");
    }

    await writeCommerceAudit({
      businessId: input.businessId,
      actorId: input.actorId,
      action: "refund.processed",
      entityType: "commerce_refund",
      entityId: String(refundRow.id),
      summary: `${refundType} refund ${input.amountCents}¢ — ${input.reason}`,
      afterState: { status, approval },
    });

    return { ok: true, refund, recorded: status === "succeeded", canRetry: false, syncStatus: "complete" };
  } catch (error) {
    logQueryError("commerce.refund.sync", commerceDiagnosticMessage(error));
    return {
      ok: false, refund, recorded: status === "succeeded", canRetry: false, syncStatus: "failed",
      error: "Refund recorded, but downstream sync failed. Do not issue it again; review the recorded refund.",
    };
  }
}

export async function listRefunds(input: {
  businessId: string;
  customerId?: string;
  limit?: number;
}): Promise<CommerceRefund[]> {
  const supabase = await createClient();
  let q = supabase
    .from("commerce_refunds")
    .select("*")
    .eq("business_id", input.businessId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 50);
  if (input.customerId) q = q.eq("customer_id", input.customerId);
  const { data, error } = await q;
  if (error) {
    if (!isSoftSchemaFallbackAllowed(error.message)) {
      logQueryError("commerce.refund.list", error.message);
    }
    return [];
  }
  return (data ?? []).map((r) => mapRefund(r as Record<string, unknown>));
}
