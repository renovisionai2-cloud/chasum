/**
 * Commerce Platform contracts — client payments, invoices, receipts, refunds.
 * Never store card numbers. Only provider references.
 */

export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "cash"
  | "e_transfer"
  | "gift_card"
  | "store_credit"
  | "other";

export type PaymentProviderName = "manual" | "stripe" | "other";

export type AppointmentPaymentStatus =
  | "unpaid"
  | "deposit_required"
  | "deposit_paid"
  | "partially_paid"
  | "fully_paid"
  | "refunded"
  | "voided";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "partial"
  | "paid"
  | "void"
  | "refunded"
  | "overdue";

export type TransactionKind =
  | "payment"
  | "deposit"
  | "refund"
  | "void"
  | "adjustment"
  | "store_credit"
  | "gift_card";

export type TransactionStatus =
  | "pending"
  | "requires_action"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "partially_refunded";

export type RefundApprovalStatus = "pending" | "approved" | "rejected";
export type RefundType = "full" | "partial";

export type CommerceTransaction = {
  id: string;
  businessId: string;
  customerId: string;
  appointmentId: string | null;
  invoiceId: string | null;
  kind: TransactionKind;
  status: TransactionStatus;
  method: PaymentMethod;
  amountCents: number;
  currency: string;
  provider: PaymentProviderName;
  providerReference: string | null;
  providerPaymentIntentId: string | null;
  description: string | null;
  occurredAt: string;
  createdAt: string;
};

export type CommerceInvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unitAmountCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  serviceId: string | null;
};

export type CommerceInvoice = {
  id: string;
  businessId: string;
  customerId: string;
  appointmentId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  balanceCents: number;
  notes: string | null;
  businessSnapshot: Record<string, unknown>;
  customerSnapshot: Record<string, unknown>;
  lines: CommerceInvoiceLine[];
  createdAt: string;
};

export type CommerceReceipt = {
  id: string;
  businessId: string;
  customerId: string;
  transactionId: string;
  invoiceId: string | null;
  receiptNumber: string;
  issuedAt: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  bodyText: string;
  emailStatus: "not_sent" | "queued" | "sent" | "failed";
};

export type CommerceRefund = {
  id: string;
  businessId: string;
  customerId: string;
  transactionId: string;
  invoiceId: string | null;
  appointmentId: string | null;
  amountCents: number;
  currency: string;
  reason: string;
  refundType: RefundType;
  approvalStatus: RefundApprovalStatus;
  status: TransactionStatus | "succeeded" | "failed" | "pending" | "canceled";
  providerReference: string | null;
  createdAt: string;
};

export type BookingPaymentSummary = {
  appointmentId: string;
  paymentStatus: AppointmentPaymentStatus;
  priceCents: number;
  depositRequiredCents: number;
  amountPaidCents: number;
  amountRefundedCents: number;
  outstandingBalanceCents: number;
  invoiceNumber: string | null;
  history: CommerceTransaction[];
};

export type CustomerCommerceAccount = {
  customerId: string;
  outstandingBalanceCents: number;
  lifetimeSpendCents: number;
  depositsCents: number;
  remainingBalanceCents: number;
  totalPaidCents: number;
  storeCreditCents: number;
  giftCards: {
    id: string;
    code: string;
    balanceCents: number;
  }[];
  invoices: CommerceInvoice[];
  receipts: CommerceReceipt[];
  refunds: CommerceRefund[];
  timeline: CommerceTransaction[];
};

export type CommerceDashboardSnapshot = {
  businessId: string;
  businessName: string;
  generatedAt: string;
  schemaReady: boolean;
  schemaMessage: string | null;
  revenueTodayCents: number;
  revenueWeekCents: number;
  revenueMonthCents: number;
  outstandingInvoicesCents: number;
  outstandingInvoicesCount: number;
  outstandingDepositsCents: number;
  outstandingDepositsCount: number;
  refundsMonthCents: number;
  averageTransactionCents: number | null;
  averageCustomerValueCents: number | null;
  recentTransactions: CommerceTransaction[];
  openInvoices: CommerceInvoice[];
  recentRefunds: CommerceRefund[];
  provider: {
    active: PaymentProviderName;
    stripeConfigured: boolean;
  };
};

export type ChaseCommerceMetrics = {
  revenueTodayCents: number;
  revenueWeekCents: number;
  revenueMonthCents: number;
  outstandingInvoicesCents: number;
  outstandingDepositsCents: number;
  refundsTrendCents: number;
  averageTransactionCents: number | null;
  averageCustomerValueCents: number | null;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: "Credit card",
  debit_card: "Debit card",
  cash: "Cash",
  e_transfer: "E-Transfer",
  gift_card: "Gift card",
  store_credit: "Store credit",
  other: "Other",
};

export const APPOINTMENT_PAYMENT_STATUS_LABELS: Record<
  AppointmentPaymentStatus,
  string
> = {
  unpaid: "Unpaid",
  deposit_required: "Deposit required",
  deposit_paid: "Deposit paid",
  partially_paid: "Outstanding balance",
  fully_paid: "Fully paid",
  refunded: "Refunded",
  voided: "Voided",
};

import { formatMoneyCents } from "@/lib/commerce/money";

export function centsToDollars(cents: number, currency?: string | null): string {
  return formatMoneyCents(cents, currency);
}

export function parsePaymentMethod(value: unknown): PaymentMethod {
  const allowed: PaymentMethod[] = [
    "credit_card",
    "debit_card",
    "cash",
    "e_transfer",
    "gift_card",
    "store_credit",
    "other",
  ];
  if (typeof value === "string" && allowed.includes(value as PaymentMethod)) {
    return value as PaymentMethod;
  }
  const lower = String(value ?? "").toLowerCase();
  if (lower.includes("credit")) return "credit_card";
  if (lower.includes("debit")) return "debit_card";
  if (lower.includes("cash")) return "cash";
  if (lower.includes("transfer") || lower.includes("etransfer")) {
    return "e_transfer";
  }
  if (lower.includes("gift")) return "gift_card";
  if (lower.includes("credit") && lower.includes("store")) return "store_credit";
  return "other";
}
