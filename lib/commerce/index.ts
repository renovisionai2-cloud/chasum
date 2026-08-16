export type {
  AppointmentPaymentStatus,
  BookingPaymentSummary,
  ChaseCommerceMetrics,
  CommerceDashboardSnapshot,
  CommerceInvoice,
  CommerceReceipt,
  CommerceRefund,
  CommerceTransaction,
  CustomerCommerceAccount,
  PaymentMethod,
  PaymentProviderName,
} from "@/lib/commerce/types";

export {
  APPOINTMENT_PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  centsToDollars,
  parsePaymentMethod,
} from "@/lib/commerce/types";

export {
  getActiveProviderSummary,
  getManualProvider,
  getStripeProvider,
  isStripeConfigured,
  resolvePaymentProvider,
} from "@/lib/commerce/providers";

export {
  createInvoiceForAppointment,
  formatInvoiceText,
  getInvoiceById,
  listInvoices,
} from "@/lib/commerce/invoices";
export { sendInvoiceEmail } from "@/lib/commerce/invoice-email";

export {
  createReceiptForTransaction,
  getReceiptById,
  listReceipts,
  queueReceiptEmail,
  retryPaymentReceiptForAppointment,
  sendPaymentReceiptNow,
} from "@/lib/commerce/receipts";
export type { PaymentReceiptRetryResult } from "@/lib/commerce/receipts";

export {
  getBookingPaymentSummary,
  listTransactions,
  recordCommercePayment,
} from "@/lib/commerce/payments";

export { listRefunds, processCommerceRefund } from "@/lib/commerce/refunds";
export {
  buildRefundEmailContext,
  sendRefundConfirmationEmail,
} from "@/lib/commerce/refund-email";
export type { RefundEmailStatus } from "@/lib/commerce/refund-email";

export {
  getCustomerCommerceAccount,
  getSummerCommerceSnapshot,
} from "@/lib/commerce/customer-account";

export {
  getChaseCommerceMetrics,
  getCommerceDashboardSnapshot,
} from "@/lib/commerce/dashboard";

export {
  listActiveGiftCardsForCustomer,
} from "@/lib/commerce/gift-cards";

export {
  appointmentMoneyFromStamps,
  appointmentCollectibleMoneyFromStamps,
  appointmentSubtotalCents,
  appointmentTaxCents,
  appointmentTotalCents,
  collectibleDepositDueNowCents,
  collectibleRemainingBalanceCents,
  appointmentOffersCollection,
  appointmentCollectionAction,
  depositCollectedCents,
  depositDueNowCents,
  depositRequiredCents,
  GROSS_PAYMENTS_COLLECTED_LABEL,
  invoiceAmountsFromAppointmentStamps,
  isAppointmentCollectible,
  isCommerceInvoiceRecord,
  isGrossCollectionTransaction,
  isOutstandingInvoiceStatus,
  netPaidCents,
  remainingBalanceCents,
  sumGrossPaymentsCollectedCents,
} from "@/lib/commerce/money-contract";

export {
  appointmentPriceCents,
  appointmentRecognizedCents,
  isActiveBooking,
  recognizesAppointmentRevenue,
  sumRecognizedRevenueCents,
  sumRecognizedRevenueDollars,
} from "@/lib/commerce/recognize";

export {
  alreadyRefundedCents,
  humanizeRefundError,
  isRefundableTransaction,
  remainingRefundableCents,
} from "@/lib/commerce/refundability";

export {
  createCommerceEvent,
  emitCommerceEvent,
  onCommerceEvent,
} from "@/lib/commerce/events";
export type {
  CommerceDomainEvent,
  CommerceDomainEventType,
} from "@/lib/commerce/events";
