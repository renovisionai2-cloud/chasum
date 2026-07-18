import type {
  AppointmentPaymentStatus,
  CommerceInvoice,
  CommerceInvoiceLine,
  CommerceReceipt,
  CommerceRefund,
  CommerceTransaction,
  InvoiceStatus,
  PaymentMethod,
  PaymentProviderName,
  TransactionKind,
  TransactionStatus,
} from "@/lib/commerce/types";

export function mapTransaction(row: Record<string, unknown>): CommerceTransaction {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    customerId: String(row.customer_id),
    appointmentId: (row.appointment_id as string) ?? null,
    invoiceId: (row.invoice_id as string) ?? null,
    kind: row.kind as TransactionKind,
    status: row.status as TransactionStatus,
    method: row.method as PaymentMethod,
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? "usd"),
    provider: (row.provider as PaymentProviderName) ?? "manual",
    providerReference: (row.provider_reference as string) ?? null,
    providerPaymentIntentId:
      (row.provider_payment_intent_id as string) ?? null,
    description: (row.description as string) ?? null,
    occurredAt: String(row.occurred_at ?? row.created_at),
    createdAt: String(row.created_at),
  };
}

export function mapInvoiceLine(row: Record<string, unknown>): CommerceInvoiceLine {
  return {
    id: String(row.id),
    description: String(row.description ?? ""),
    quantity: Number(row.quantity ?? 1),
    unitAmountCents: Number(row.unit_amount_cents ?? 0),
    taxCents: Number(row.tax_cents ?? 0),
    discountCents: Number(row.discount_cents ?? 0),
    totalCents: Number(row.total_cents ?? 0),
    serviceId: (row.service_id as string) ?? null,
  };
}

export function mapInvoice(
  row: Record<string, unknown>,
  lines: CommerceInvoiceLine[] = [],
): CommerceInvoice {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    customerId: String(row.customer_id),
    appointmentId: (row.appointment_id as string) ?? null,
    invoiceNumber: String(row.invoice_number),
    status: row.status as InvoiceStatus,
    issueDate: String(row.issue_date),
    dueDate: (row.due_date as string) ?? null,
    currency: String(row.currency ?? "usd"),
    subtotalCents: Number(row.subtotal_cents ?? 0),
    taxCents: Number(row.tax_cents ?? 0),
    discountCents: Number(row.discount_cents ?? 0),
    totalCents: Number(row.total_cents ?? 0),
    amountPaidCents: Number(row.amount_paid_cents ?? 0),
    amountRefundedCents: Number(row.amount_refunded_cents ?? 0),
    balanceCents: Number(row.balance_cents ?? 0),
    notes: (row.notes as string) ?? null,
    businessSnapshot: (row.business_snapshot as Record<string, unknown>) ?? {},
    customerSnapshot: (row.customer_snapshot as Record<string, unknown>) ?? {},
    lines,
    createdAt: String(row.created_at),
  };
}

export function mapReceipt(row: Record<string, unknown>): CommerceReceipt {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    customerId: String(row.customer_id),
    transactionId: String(row.transaction_id),
    invoiceId: (row.invoice_id as string) ?? null,
    receiptNumber: String(row.receipt_number),
    issuedAt: String(row.issued_at),
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? "usd"),
    method: row.method as PaymentMethod,
    bodyText: String(row.body_text ?? ""),
    emailStatus: (row.email_status as CommerceReceipt["emailStatus"]) ?? "not_sent",
  };
}

export function mapRefund(row: Record<string, unknown>): CommerceRefund {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    customerId: String(row.customer_id),
    transactionId: String(row.transaction_id),
    invoiceId: (row.invoice_id as string) ?? null,
    appointmentId: (row.appointment_id as string) ?? null,
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? "usd"),
    reason: String(row.reason ?? ""),
    refundType: row.refund_type === "partial" ? "partial" : "full",
    approvalStatus:
      (row.approval_status as CommerceRefund["approvalStatus"]) ?? "approved",
    status: (row.status as CommerceRefund["status"]) ?? "succeeded",
    providerReference: (row.provider_reference as string) ?? null,
    createdAt: String(row.created_at),
  };
}

export function deriveAppointmentPaymentStatus(input: {
  priceCents: number;
  depositRequiredCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  voided?: boolean;
}): AppointmentPaymentStatus {
  if (input.voided) return "voided";
  const netPaid = Math.max(0, input.amountPaidCents - input.amountRefundedCents);
  if (input.amountRefundedCents > 0 && netPaid <= 0) return "refunded";
  if (input.amountRefundedCents > 0 && netPaid < input.priceCents) {
    return "partially_paid";
  }
  if (input.priceCents <= 0) {
    return netPaid > 0 ? "fully_paid" : "unpaid";
  }
  if (netPaid >= input.priceCents) return "fully_paid";
  if (input.depositRequiredCents > 0) {
    if (netPaid <= 0) return "deposit_required";
    if (netPaid >= input.depositRequiredCents && netPaid < input.priceCents) {
      return "deposit_paid";
    }
  }
  if (netPaid > 0) return "partially_paid";
  return "unpaid";
}
