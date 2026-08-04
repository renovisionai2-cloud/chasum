/**
 * Edit Booking / review payment summary — existing succeeded payments
 * must appear as already paid, separate from any new payment today.
 */

export type EditBookingPaymentSummaryInput = {
  appointmentTotalCents: number;
  /** Net succeeded payments already on the appointment (amount_paid − refunds). */
  alreadyPaidCents: number;
  /** Optional additional payment being collected in this session. */
  paymentTodayCents?: number | null;
  depositRequiredCents?: number | null;
  paymentStatus?: string | null;
};

export type EditBookingPaymentSummary = {
  appointmentTotalCents: number;
  alreadyPaidCents: number;
  paymentTodayCents: number;
  remainingBalanceCents: number;
  depositRequiredCents: number;
  depositStatusLabel: string | null;
};

export function resolveEditBookingPaymentSummary(
  input: EditBookingPaymentSummaryInput,
): EditBookingPaymentSummary {
  const appointmentTotalCents = Math.max(
    0,
    Math.round(Number(input.appointmentTotalCents ?? 0)),
  );
  const alreadyPaidCents = Math.max(
    0,
    Math.round(Number(input.alreadyPaidCents ?? 0)),
  );
  const paymentTodayCents = Math.max(
    0,
    Math.round(Number(input.paymentTodayCents ?? 0)),
  );
  const depositRequiredCents = Math.max(
    0,
    Math.round(Number(input.depositRequiredCents ?? 0)),
  );
  const remainingBalanceCents = Math.max(
    0,
    appointmentTotalCents - alreadyPaidCents - paymentTodayCents,
  );

  const status = String(input.paymentStatus ?? "").trim();
  let depositStatusLabel: string | null = null;
  if (status === "fully_paid" || remainingBalanceCents <= 0) {
    depositStatusLabel = "Paid in full";
  } else if (
    status === "deposit_paid" ||
    (depositRequiredCents > 0 && alreadyPaidCents >= depositRequiredCents)
  ) {
    depositStatusLabel = "Deposit paid";
  } else if (alreadyPaidCents > 0) {
    depositStatusLabel = "Partially paid";
  } else if (depositRequiredCents > 0) {
    depositStatusLabel = "Deposit required";
  }

  return {
    appointmentTotalCents,
    alreadyPaidCents,
    paymentTodayCents,
    remainingBalanceCents,
    depositRequiredCents,
    depositStatusLabel,
  };
}
