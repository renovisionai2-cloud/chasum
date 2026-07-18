import { writeCommerceAudit } from "@/lib/commerce/audit";
import { mapReceipt, mapTransaction } from "@/lib/commerce/mappers";
import type { CommerceReceipt } from "@/lib/commerce/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/commerce/types";
import { logQueryError, isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

async function nextReceiptNumber(businessId: string): Promise<string> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("commerce_receipts")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  const n = (count ?? 0) + 1;
  return `RCT-${String(n).padStart(4, "0")}`;
}

export async function createReceiptForTransaction(input: {
  businessId: string;
  transactionId: string;
  actorId?: string | null;
}): Promise<CommerceReceipt | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("commerce_receipts")
    .select("*")
    .eq("transaction_id", input.transactionId)
    .maybeSingle();
  if (existing) return mapReceipt(existing as Record<string, unknown>);

  const { data: tx, error } = await supabase
    .from("commerce_transactions")
    .select("*")
    .eq("id", input.transactionId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (error || !tx) {
    if (error && !isSoftSchemaFallbackAllowed(error.message)) {
      logQueryError("commerce.receipt.tx", error.message);
    }
    return null;
  }

  const transaction = mapTransaction(tx as Record<string, unknown>);
  const receiptNumber = await nextReceiptNumber(input.businessId);
  const issuedAt = new Date();

  const { data: biz } = await supabase
    .from("businesses")
    .select("name, email, phone")
    .eq("id", input.businessId)
    .maybeSingle();
  const { data: cust } = await supabase
    .from("customers")
    .select("name, email")
    .eq("id", transaction.customerId)
    .maybeSingle();

  const bodyText = [
    `RECEIPT ${receiptNumber}`,
    `Issued: ${format(issuedAt, "MMM d, yyyy h:mm a")}`,
    "",
    `${biz?.name ?? "Business"}`,
    biz?.email ? String(biz.email) : null,
    biz?.phone ? String(biz.phone) : null,
    "",
    `Customer: ${cust?.name ?? "Guest"}`,
    cust?.email ? String(cust.email) : null,
    "",
    `Amount: $${(transaction.amountCents / 100).toFixed(2)} ${transaction.currency.toUpperCase()}`,
    `Method: ${PAYMENT_METHOD_LABELS[transaction.method]}`,
    `Provider: ${transaction.provider}`,
    transaction.providerReference
      ? `Reference: ${transaction.providerReference}`
      : null,
    transaction.description ? `Note: ${transaction.description}` : null,
    "",
    "Thank you for your business.",
    "",
    "(Email delivery: not_sent — future support ready)",
  ]
    .filter(Boolean)
    .join("\n");

  const { data: receipt, error: recErr } = await supabase
    .from("commerce_receipts")
    .insert({
      business_id: input.businessId,
      customer_id: transaction.customerId,
      transaction_id: input.transactionId,
      invoice_id: transaction.invoiceId,
      receipt_number: receiptNumber,
      issued_at: issuedAt.toISOString(),
      amount_cents: transaction.amountCents,
      currency: transaction.currency,
      method: transaction.method,
      body_text: bodyText,
      email_status: "not_sent",
    })
    .select("*")
    .single();

  if (recErr || !receipt) {
    if (recErr && isSoftSchemaFallbackAllowed(recErr.message)) return null;
    if (recErr) logQueryError("commerce.receipt.create", recErr.message);
    return null;
  }

  await writeCommerceAudit({
    businessId: input.businessId,
    actorId: input.actorId,
    action: "receipt.created",
    entityType: "commerce_receipt",
    entityId: String(receipt.id),
    summary: `Receipt ${receiptNumber} issued`,
  });

  return mapReceipt(receipt as Record<string, unknown>);
}

export async function getReceiptById(
  businessId: string,
  receiptId: string,
): Promise<CommerceReceipt | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commerce_receipts")
    .select("*")
    .eq("id", receiptId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapReceipt(data as Record<string, unknown>);
}

export async function listReceipts(input: {
  businessId: string;
  customerId?: string;
  limit?: number;
}): Promise<CommerceReceipt[]> {
  const supabase = await createClient();
  let q = supabase
    .from("commerce_receipts")
    .select("*")
    .eq("business_id", input.businessId)
    .order("issued_at", { ascending: false })
    .limit(input.limit ?? 50);
  if (input.customerId) q = q.eq("customer_id", input.customerId);
  const { data, error } = await q;
  if (error) {
    if (!isSoftSchemaFallbackAllowed(error.message)) {
      logQueryError("commerce.receipt.list", error.message);
    }
    return [];
  }
  return (data ?? []).map((r) => mapReceipt(r as Record<string, unknown>));
}

/** Queue receipt email via Communications Platform (never send directly). */
export async function queueReceiptEmail(
  businessId: string,
  receiptId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: receipt, error } = await supabase
    .from("commerce_receipts")
    .select("*")
    .eq("id", receiptId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !receipt) {
    return { ok: false, error: error?.message ?? "Receipt not found." };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("id", receipt.customer_id)
    .maybeSingle();

  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .maybeSingle();

  if (!customer?.email) {
    await supabase
      .from("commerce_receipts")
      .update({ email_status: "failed" })
      .eq("id", receiptId);
    return { ok: false, error: "Customer has no email on file." };
  }

  const { queueNotification } = await import("@/lib/communications");
  const queued = await queueNotification({
    businessId,
    channel: "email",
    templateKey: "commerce.receipt",
    recipient: customer.email,
    customerId: customer.id,
    payload: {
      directContext: {
        businessId,
        businessName: business?.name ?? "Business",
        customerName: customer.name ?? "Customer",
        customerEmail: customer.email,
        customerId: customer.id,
        staffName: "",
        serviceName: "Payment",
        startTime: new Date().toISOString(),
        amountCents: receipt.amount_cents,
        receiptNumber: receipt.receipt_number,
      },
      skipPreferenceCheck: false,
    },
  });

  await supabase
    .from("commerce_receipts")
    .update({
      email_status: queued.ok ? "queued" : "failed",
    })
    .eq("id", receiptId)
    .eq("business_id", businessId);

  if (!queued.ok) {
    return { ok: false, error: queued.error };
  }
  return { ok: true };
}
