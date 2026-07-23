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

export {
  createReceiptForTransaction,
  getReceiptById,
  listReceipts,
  queueReceiptEmail,
} from "@/lib/commerce/receipts";

export {
  getBookingPaymentSummary,
  listTransactions,
  recordCommercePayment,
} from "@/lib/commerce/payments";

export { listRefunds, processCommerceRefund } from "@/lib/commerce/refunds";

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
  appointmentPriceCents,
  appointmentRecognizedCents,
  isActiveBooking,
  recognizesAppointmentRevenue,
  sumRecognizedRevenueCents,
  sumRecognizedRevenueDollars,
} from "@/lib/commerce/recognize";

export {
  createCommerceEvent,
  emitCommerceEvent,
  onCommerceEvent,
} from "@/lib/commerce/events";
export type {
  CommerceDomainEvent,
  CommerceDomainEventType,
} from "@/lib/commerce/events";
