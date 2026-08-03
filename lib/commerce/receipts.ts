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

  const { formatMoneyCents } = await import("@/lib/commerce/money");
  const bodyText = [
    `Receipt ${receiptNumber}`,
    `Issued: ${format(issuedAt, "MMM d, yyyy h:mm a")}`,
    "",
    `${biz?.name ?? "Business"}`,
    biz?.email ? String(biz.email) : null,
    biz?.phone ? String(biz.phone) : null,
    "",
    `Customer: ${cust?.name ?? "Guest"}`,
    cust?.email ? String(cust.email) : null,
    "",
    `Amount paid: ${formatMoneyCents(transaction.amountCents, transaction.currency)}`,
    `Payment method: ${PAYMENT_METHOD_LABELS[transaction.method]}`,
    transaction.description ? `Note: ${transaction.description}` : null,
    transaction.providerReference
      ? `Reference: ${transaction.providerReference}`
      : null,
    "",
    `Thank you for visiting ${biz?.name ?? "us"}.`,
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
      receiptId: receiptId,
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
        receiptId,
      },
      // Payment receipts are transactional confirmations.
      skipPreferenceCheck: true,
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

/**
 * Send a payment receipt immediately (Preview-safe — do not leave Pending).
 * Idempotent on receiptId: already-sent receipts are not resent.
 *
 * Concurrent double-clicks: claims email_status → queued before send; if another
 * worker already marked sent, returns skipped.
 */
export async function sendPaymentReceiptNow(input: {
  businessId: string;
  receiptId: string;
  appointmentId?: string | null;
  serviceName?: string | null;
  startTime?: string | null;
  appointmentTotalCents?: number | null;
  paidToDateCents?: number | null;
  remainingBalanceCents?: number | null;
  paymentStatusLabel?: string | null;
  idempotencyKey?: string | null;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string; messageId?: string }> {
  const supabase = await createClient();
  const { data: receipt, error } = await supabase
    .from("commerce_receipts")
    .select("*")
    .eq("id", input.receiptId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (error || !receipt) {
    return { ok: false, error: error?.message ?? "Receipt not found." };
  }

  if (String(receipt.email_status) === "sent") {
    return { ok: true, skipped: true, messageId: undefined };
  }

  // Claim send attempt so parallel retries cannot double-send.
  // Only transition from terminal not-sent states — not from an in-flight "queued".
  const { data: claimed } = await supabase
    .from("commerce_receipts")
    .update({ email_status: "queued" })
    .eq("id", input.receiptId)
    .eq("business_id", input.businessId)
    .in("email_status", ["failed", "not_sent"])
    .select("*")
    .maybeSingle();

  if (!claimed) {
    const { data: again } = await supabase
      .from("commerce_receipts")
      .select("email_status")
      .eq("id", input.receiptId)
      .maybeSingle();
    if (String(again?.email_status) === "sent") {
      return { ok: true, skipped: true };
    }
    return { ok: false, error: "Receipt send is already in progress." };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("id", receipt.customer_id)
    .maybeSingle();

  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", input.businessId)
    .maybeSingle();

  if (!customer?.email) {
    await supabase
      .from("commerce_receipts")
      .update({ email_status: "failed" })
      .eq("id", input.receiptId);
    return { ok: false, error: "Customer has no email on file." };
  }

  const { sendEmail } = await import("@/lib/communications/delivery");
  const { PAYMENT_METHOD_LABELS } = await import("@/lib/commerce/types");
  const method = String(receipt.method);
  const methodLabel =
    method in PAYMENT_METHOD_LABELS
      ? PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]
      : method;
  const amount = Number(receipt.amount_cents ?? 0);
  const serviceName = input.serviceName?.trim() || "Appointment";

  const result = await sendEmail({
    businessId: input.businessId,
    to: customer.email,
    templateKey: "commerce.receipt",
    customerId: customer.id,
    appointmentId: input.appointmentId,
    skipPreferenceCheck: true,
    context: {
      businessId: input.businessId,
      businessName: business?.name ?? "Business",
      customerName: customer.name ?? "Customer",
      customerEmail: customer.email,
      customerId: customer.id,
      staffName: "Team",
      serviceName,
      startTime: input.startTime || new Date().toISOString(),
      amountCents: amount,
      appointmentTotalCents: input.appointmentTotalCents ?? null,
      depositPaidCents: input.paidToDateCents ?? amount,
      remainingBalanceCents: input.remainingBalanceCents ?? null,
      paymentMethodLabel: methodLabel,
      paymentStatusLabel: input.paymentStatusLabel ?? null,
      receiptNumber: String(receipt.receipt_number ?? ""),
      notes: input.idempotencyKey
        ? `receipt:${input.idempotencyKey}`
        : null,
    },
  });

  await supabase
    .from("commerce_receipts")
    .update({
      email_status: result.ok ? "sent" : "failed",
    })
    .eq("id", input.receiptId)
    .eq("business_id", input.businessId);

  if (!result.ok) {
    return { ok: false, error: result.error ?? "Receipt email failed." };
  }
  return { ok: true, messageId: result.messageId };
}

export type PaymentReceiptRetryResult = {
  status: "sent" | "failed" | "not_applicable" | "no_recipient";
  detail: string | null;
  receiptId?: string | null;
  transactionId?: string | null;
  /** True when a prior successful send was short-circuited (no second email). */
  skippedDuplicate?: boolean;
};

/**
 * Retry payment receipt for an appointment.
 * Never creates appointments or commerce payments — only rebuilds/sends receipt email.
 */
export async function retryPaymentReceiptForAppointment(input: {
  businessId: string;
  appointmentId: string;
}): Promise<PaymentReceiptRetryResult> {
  const supabase = await createClient();
  const appointmentId = input.appointmentId.trim();
  if (!appointmentId) {
    return { status: "not_applicable", detail: "Appointment is required." };
  }

  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select(
      "id, customer_id, start_time, price_cents, tax_cents, amount_paid_cents, amount_refunded_cents, payment_status, services(name), customers(id, email, name)",
    )
    .eq("id", appointmentId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (apptErr || !appt) {
    return {
      status: "not_applicable",
      detail: "Appointment not found.",
    };
  }

  const { listTransactions } = await import("@/lib/commerce/payments");
  const history = await listTransactions({
    businessId: input.businessId,
    appointmentId,
    limit: 40,
  });

  const tx = history.find(
    (t) =>
      t.status === "succeeded" &&
      (t.kind === "deposit" || t.kind === "payment"),
  );

  if (!tx) {
    return {
      status: "not_applicable",
      detail: "No successful payment transaction to receipt.",
    };
  }

  const customerRel = appt.customers as
    | { id?: string; email?: string | null; name?: string | null }
    | { id?: string; email?: string | null; name?: string | null }[]
    | null;
  const customer = Array.isArray(customerRel) ? customerRel[0] : customerRel;
  if (!customer?.email?.trim()) {
    return {
      status: "no_recipient",
      detail: "Customer has no email on file.",
      transactionId: tx.id,
    };
  }

  const receipt = await createReceiptForTransaction({
    businessId: input.businessId,
    transactionId: tx.id,
  });
  if (!receipt?.id) {
    return {
      status: "failed",
      detail: "Receipt could not be created.",
      transactionId: tx.id,
    };
  }

  // Explicit retry may clear a stuck "queued" claim from a prior crashed attempt.
  if (String(receipt.emailStatus) === "queued") {
    await supabase
      .from("commerce_receipts")
      .update({ email_status: "failed" })
      .eq("id", receipt.id)
      .eq("business_id", input.businessId)
      .eq("email_status", "queued");
  }

  const serviceRel = appt.services as
    | { name?: string }
    | { name?: string }[]
    | null;
  const service = Array.isArray(serviceRel) ? serviceRel[0] : serviceRel;
  const appointmentTotal =
    Math.max(0, Number(appt.price_cents ?? 0)) +
    Math.max(0, Number(appt.tax_cents ?? 0));
  const paid = Math.max(0, Number(appt.amount_paid_cents ?? 0));
  const refunded = Math.max(0, Number(appt.amount_refunded_cents ?? 0));
  const netPaid = Math.max(0, paid - refunded);

  const result = await sendPaymentReceiptNow({
    businessId: input.businessId,
    receiptId: receipt.id,
    appointmentId,
    serviceName: service?.name ?? "Appointment",
    startTime: String(appt.start_time ?? ""),
    appointmentTotalCents: appointmentTotal,
    paidToDateCents: netPaid || tx.amountCents,
    remainingBalanceCents: Math.max(0, appointmentTotal - netPaid),
    paymentStatusLabel:
      tx.kind === "deposit" ? "Deposit paid" : "Paid",
    idempotencyKey: `retry:${appointmentId}:${tx.id}`,
  });

  if (result.ok) {
    return {
      status: "sent",
      detail: result.skipped
        ? "Receipt already sent."
        : "Payment receipt sent.",
      receiptId: receipt.id,
      transactionId: tx.id,
      skippedDuplicate: Boolean(result.skipped),
    };
  }

  const err = (result.error ?? "Receipt email failed.").slice(0, 200);
  if (/no email/i.test(err)) {
    return {
      status: "no_recipient",
      detail: err,
      receiptId: receipt.id,
      transactionId: tx.id,
    };
  }
  return {
    status: "failed",
    detail: err,
    receiptId: receipt.id,
    transactionId: tx.id,
  };
}
