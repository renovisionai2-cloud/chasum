/**
 * Adaptive Booking Workspace — ask only for what Chasum does not already know.
 * Engines unchanged; this is presentation / workflow orchestration only.
 */

export const BOOKING_DECISIONS = [
  "customer",
  "service",
  "employee",
  "datetime",
  "payment",
  "review",
  "success",
] as const;

export type BookingDecision = (typeof BOOKING_DECISIONS)[number];

export type BookingFacts = {
  customerId: string | null;
  serviceId: string;
  /** True when a named employee is still required. */
  needsNamedEmployee: boolean;
  date: string;
  slot: string | null;
  slotValid: boolean;
  /** User continued past payment checkout (including “no payment”). */
  paymentAcknowledged: boolean;
  success: boolean;
};

/** First missing decision given known facts (context-aware entry). */
export function firstMissingDecision(facts: BookingFacts): BookingDecision {
  if (facts.success) return "success";
  if (!facts.customerId) return "customer";
  if (!facts.serviceId) return "service";
  if (facts.needsNamedEmployee) return "employee";
  if (!facts.date || !facts.slot || !facts.slotValid) return "datetime";
  if (!facts.paymentAcknowledged) return "payment";
  return "review";
}

export function bookingDecisionLabel(decision: BookingDecision): string {
  switch (decision) {
    case "customer":
      return "Customer";
    case "service":
      return "Service";
    case "employee":
      return "Employee";
    case "datetime":
      return "Date & time";
    case "payment":
      return "Payment";
    case "review":
      return "Review";
    case "success":
      return "Booked";
    default:
      return "Booking";
  }
}

export function bookingFooterStatus(decision: BookingDecision): string {
  switch (decision) {
    case "customer":
      return "Select a customer";
    case "service":
      return "Choose a service";
    case "employee":
      return "Choose an employee";
    case "datetime":
      return "Choose a date and time";
    case "payment":
      return "Choose payment";
    case "review":
      return "Ready to book";
    case "success":
      return "Appointment booked";
    default:
      return "Continue";
  }
}

/** Prior decision for Back — skips already-known facts. */
export function previousDecision(
  current: BookingDecision,
  facts: BookingFacts,
): BookingDecision | null {
  const order: BookingDecision[] = [
    "customer",
    "service",
    "employee",
    "datetime",
    "payment",
    "review",
  ];
  const idx = order.indexOf(current);
  if (idx <= 0) return null;
  for (let i = idx - 1; i >= 0; i--) {
    const d = order[i];
    if (d === "customer" && facts.customerId) return "customer";
    if (d === "service" && facts.serviceId) return "service";
    if (d === "employee" && !facts.needsNamedEmployee) continue;
    if (d === "employee") return "employee";
    if (d === "datetime" && facts.date && facts.slot) return "datetime";
    if (d === "datetime") return "datetime";
    if (d === "payment") return "payment";
  }
  return null;
}

export function invalidateAfterServiceChange(facts: {
  clearSlot: () => void;
  setPaymentAcknowledged: (v: boolean) => void;
}): void {
  facts.clearSlot();
  facts.setPaymentAcknowledged(false);
}
