import type { BookingNotificationStatusItem } from "@/lib/types/booking";

export type BookingSuccessPaymentState =
  | "no_payment"
  | "deposit_paid"
  | "partially_paid"
  | "paid_in_full";

export const BOOKING_SUCCESS_PAYMENT_LABELS: Record<
  BookingSuccessPaymentState,
  string
> = {
  no_payment: "No payment",
  deposit_paid: "Deposit paid",
  partially_paid: "Partially paid",
  paid_in_full: "Paid in full",
};

/**
 * Staff-facing payment state on the booking success screen.
 * Uses recorded collection only — failed/skipped payments are No payment.
 * Deposit paid = deposit obligation met with a remaining balance.
 * Partially paid = some money in, deposit not yet met.
 */
export function bookingSuccessPaymentState(input: {
  appointmentTotalCents: number;
  collectedCents: number;
  depositRequiredCents: number;
  paymentRecorded: boolean;
}): BookingSuccessPaymentState {
  const total = Math.max(0, Math.round(input.appointmentTotalCents));
  const collected = input.paymentRecorded
    ? Math.max(0, Math.round(input.collectedCents))
    : 0;
  const deposit = Math.max(0, Math.round(input.depositRequiredCents));
  if (total > 0 && collected >= total) return "paid_in_full";
  if (collected <= 0) return "no_payment";
  if (deposit > 0 && collected >= deposit && collected < total) {
    return "deposit_paid";
  }
  if (collected > 0 && collected < total) return "partially_paid";
  return "no_payment";
}

/**
 * Delivery copy for success / operating views.
 * Never reports Sent unless the channel was recorded as sent.
 */
export function recordedDeliveryLabel(
  item: BookingNotificationStatusItem | undefined,
): string {
  if (!item) return "Not recorded";
  if (item.status === "sent") return "Sent";
  if (item.status === "failed") return "Could not be sent";
  if (item.status === "pending") return "Pending";
  return "Not recorded";
}
