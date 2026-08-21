import { writeCommerceAudit } from "@/lib/commerce/audit";
import { mapReceipt, mapTransaction } from "@/lib/commerce/mappers";
import type { CommerceReceipt } from "@/lib/commerce/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/commerce/types";
import type { AppointmentTemplateContext } from "@/lib/communications/types";
import { logQueryError, isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

type ReceiptEmailContextResult =
  | {
      ok: true;
      transactionId: string;
      appointmentId: string | null;
      context: AppointmentTemplateContext;
    }
  | { ok: false; error: string };

/**
 * Build receipt email context from the exact commerce transaction linked to
 * the receipt. Never uses "latest customer payment" or caller-supplied totals
 * when an appointment_id is present on the transaction.
 */
export async function buildReceiptEmailContext(input: {
  businessId: string;
  receiptId: string;
  /** When set, must match commerce_transactions.appointment_id. */
  expectedAppointmentId?: string | null;
}): Promise<ReceiptEmailContextResult> {
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

  const transactionId = String(receipt.transaction_id ?? "");
  if (!transactionId) {
    return { ok: false, error: "Receipt has no linked transaction." };
  }

  const { data: txRow, error: txErr } = await supabase
    .from("commerce_transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (txErr || !txRow) {
    return { ok: false, error: txErr?.message ?? "Transaction not found." };
  }

  const tx = mapTransaction(txRow as Record<string, unknown>);
  const expected = input.expectedAppointmentId?.trim() || null;
  if (expected && tx.appointmentId && expected !== tx.appointmentId) {
    return {
      ok: false,
      error:
        "Receipt transaction belongs to a different appointment — refusing mismatched financials.",
    };
  }
  if (expected && !tx.appointmentId) {
    return {
      ok: false,
      error: "Transaction is not linked to the expected appointment.",
    };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("id", receipt.customer_id)
    .maybeSingle();

  const { data: business } = await supabase
    .from("businesses")
    .select("name, timezone")
    .eq("id", input.businessId)
    .maybeSingle();

  if (!customer?.email) {
    return { ok: false, error: "Customer has no email on file." };
  }

  const method = String(receipt.method);
  const methodLabel =
    method in PAYMENT_METHOD_LABELS
      ? PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]
      : method;
  const amountReceived = Number(receipt.amount_cents ?? tx.amountCents ?? 0);

  let serviceName = "Appointment";
  let startTime = new Date().toISOString();
  let endTime: string | null = null;
  let subtotalCents: number | null = null;
  let taxCents: number | null = null;
  let taxRateBps: number | null = null;
  let taxLabel: string | null = null;
  let appointmentTotalCents: number | null = null;
  let depositRequiredCents: number | null = null;
  let depositPaidCents: number | null = amountReceived;
  let remainingBalanceCents: number | null = null;
  let paymentStatusLabel: string | null =
    tx.kind === "deposit" ? "Deposit paid" : "Paid";
  let appointmentId = tx.appointmentId;
  let locationTimezone: string | null = null;
  let businessTimezone: string | null = null;
  let timezone: string | null = null;

  if (tx.appointmentId) {
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select(
        "id, start_time, end_time, price_cents, tax_cents, deposit_cents, amount_paid_cents, amount_refunded_cents, payment_status, services(name), location:locations(timezone)",
      )
      .eq("id", tx.appointmentId)
      .eq("business_id", input.businessId)
      .maybeSingle();

    if (apptErr || !appt) {
      return {
        ok: false,
        error: apptErr?.message ?? "Linked appointment not found.",
      };
    }

    const serviceRel = appt.services as
      | { name?: string }
      | { name?: string }[]
      | null;
    const service = Array.isArray(serviceRel) ? serviceRel[0] : serviceRel;
    serviceName = service?.name?.trim() || "Appointment";
    startTime = String(appt.start_time ?? startTime);
    endTime = appt.end_time ? String(appt.end_time) : null;
    subtotalCents =
      appt.price_cents != null ? Math.max(0, Number(appt.price_cents)) : null;
    taxCents = Math.max(0, Number(appt.tax_cents ?? 0));
    appointmentTotalCents =
      subtotalCents != null ? subtotalCents + taxCents : null;
    depositRequiredCents = Math.max(0, Number(appt.deposit_cents ?? 0));
    const paid = Math.max(0, Number(appt.amount_paid_cents ?? 0));
    const refunded = Math.max(0, Number(appt.amount_refunded_cents ?? 0));
    const netPaid = Math.max(0, paid - refunded);
    depositPaidCents = netPaid > 0 ? netPaid : amountReceived;
    remainingBalanceCents =
      appointmentTotalCents != null
        ? Math.max(0, appointmentTotalCents - depositPaidCents)
        : null;
    if (String(appt.payment_status ?? "") === "fully_paid") {
      paymentStatusLabel = "Paid in full";
    } else if (tx.kind === "deposit" || depositPaidCents < (appointmentTotalCents ?? Infinity)) {
      paymentStatusLabel = "Deposit paid";
    }

    const locRel = (appt as { location?: unknown }).location as
      | { timezone?: string | null }
      | { timezone?: string | null }[]
      | null;
    const loc = Array.isArray(locRel) ? locRel[0] : locRel;
    locationTimezone = loc?.timezone?.trim() || null;

    const { data: taxRows } = await supabase
      .from("tax_rates")
      .select("name, rate_bps, is_default, is_active")
      .eq("business_id", input.businessId)
      .eq("is_active", true);
    const rates = [...(taxRows ?? [])].sort((a, b) =>
      String(a.name ?? "").localeCompare(String(b.name ?? "")),
    );
    const preferred =
      rates.find((r) => r.is_default) ?? rates[0] ?? null;
    if (preferred) {
      taxRateBps = Math.max(0, Number(preferred.rate_bps ?? 0));
      taxLabel = String(preferred.name ?? "Tax");
    } else if (subtotalCents != null && subtotalCents > 0 && taxCents > 0) {
      taxRateBps = Math.round((taxCents * 10_000) / subtotalCents);
      taxLabel = "Tax";
    }

    appointmentId = String(appt.id);
  }

  businessTimezone = business?.timezone?.trim() || null;
  const { resolveAppointmentEmailTimezone } = await import(
    "@/lib/communications/appointment-datetime"
  );
  timezone = resolveAppointmentEmailTimezone({
    locationTimezone,
    businessTimezone,
  });

  return {
    ok: true,
    transactionId,
    appointmentId,
    context: {
      businessId: input.businessId,
      businessName: business?.name ?? "Business",
      customerName: customer.name ?? "Customer",
      customerEmail: customer.email,
      customerId: customer.id,
      staffName: "Team",
      serviceName,
      startTime,
      endTime,
      timezone,
      locationTimezone,
      businessTimezone,
      amountCents: amountReceived,
      subtotalCents,
      taxCents,
      taxRateBps,
      taxLabel,
      appointmentTotalCents,
      depositRequiredCents,
      depositPaidCents,
      remainingBalanceCents,
      paymentMethodLabel: methodLabel,
      paymentStatusLabel,
      receiptNumber: String(receipt.receipt_number ?? ""),
      appointmentId: appointmentId ?? undefined,
    },
  };
}

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
  const built = await buildReceiptEmailContext({ businessId, receiptId });
  if (!built.ok) {
    const supabase = await createClient();
    if (/no email/i.test(built.error)) {
      await supabase
        .from("commerce_receipts")
        .update({ email_status: "failed" })
        .eq("id", receiptId)
        .eq("business_id", businessId);
    }
    return { ok: false, error: built.error };
  }

  const { queueNotification } = await import("@/lib/communications");
  const queued = await queueNotification({
    businessId,
    channel: "email",
    templateKey: "commerce.receipt",
    recipient: built.context.customerEmail!,
    customerId: built.context.customerId,
    // Intentionally omit appointmentId so the job uses this receipt-bound
    // directContext (never a stale appointment-only context).
    payload: {
      receiptId,
      businessId,
      directContext: {
        ...built.context,
        receiptId,
      },
      skipPreferenceCheck: true,
    },
  });

  const supabase = await createClient();
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
 * Financials always come from receipt → transaction → appointment.
 */
export async function sendPaymentReceiptNow(input: {
  businessId: string;
  receiptId: string;
  /** When set, must match the transaction's appointment_id. */
  appointmentId?: string | null;
  /** @deprecated Ignored — context is loaded from the linked transaction. */
  serviceName?: string | null;
  /** @deprecated Ignored — context is loaded from the linked transaction. */
  startTime?: string | null;
  /** @deprecated Ignored — context is loaded from the linked transaction. */
  appointmentTotalCents?: number | null;
  /** @deprecated Ignored — context is loaded from the linked transaction. */
  paidToDateCents?: number | null;
  /** @deprecated Ignored — context is loaded from the linked transaction. */
  remainingBalanceCents?: number | null;
  /** @deprecated Ignored — context is loaded from the linked transaction. */
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

  const built = await buildReceiptEmailContext({
    businessId: input.businessId,
    receiptId: input.receiptId,
    expectedAppointmentId: input.appointmentId,
  });
  if (!built.ok) {
    if (/no email/i.test(built.error)) {
      await supabase
        .from("commerce_receipts")
        .update({ email_status: "failed" })
        .eq("id", input.receiptId);
    }
    return { ok: false, error: built.error };
  }

  // Claim send attempt so parallel retries cannot double-send.
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

  const { sendEmail } = await import("@/lib/communications/delivery");
  const result = await sendEmail({
    businessId: input.businessId,
    to: built.context.customerEmail!,
    templateKey: "commerce.receipt",
    customerId: built.context.customerId,
    appointmentId: built.appointmentId,
    skipPreferenceCheck: true,
    context: {
      ...built.context,
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
 * Selects the latest succeeded deposit/payment for THIS appointment only.
 */
export async function retryPaymentReceiptForAppointment(input: {
  businessId: string;
  appointmentId: string;
  /** Optional: force a specific transaction (must belong to the appointment). */
  transactionId?: string | null;
}): Promise<PaymentReceiptRetryResult> {
  const supabase = await createClient();
  const appointmentId = input.appointmentId.trim();
  if (!appointmentId) {
    return { status: "not_applicable", detail: "Appointment is required." };
  }

  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select("id, customers(id, email, name)")
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

  const tx =
    (input.transactionId
      ? history.find((t) => t.id === input.transactionId)
      : null) ??
    history.find(
      (t) =>
        t.status === "succeeded" &&
        (t.kind === "deposit" || t.kind === "payment") &&
        t.appointmentId === appointmentId,
    );

  if (!tx || tx.appointmentId !== appointmentId) {
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

  // Explicit human retry may resend corrected content for the same receipt/
  // transaction (e.g. after a stale financial snapshot). Never creates a new
  // receipt row when one already exists for this transaction_id.
  if (
    String(receipt.emailStatus) === "sent" ||
    String(receipt.emailStatus) === "queued"
  ) {
    await supabase
      .from("commerce_receipts")
      .update({ email_status: "failed" })
      .eq("id", receipt.id)
      .eq("business_id", input.businessId)
      .in("email_status", ["sent", "queued"]);
  }

  const result = await sendPaymentReceiptNow({
    businessId: input.businessId,
    receiptId: receipt.id,
    appointmentId,
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
