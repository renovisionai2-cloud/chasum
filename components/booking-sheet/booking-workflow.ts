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

export type BookingDecisionAccess = {
  accessible: boolean;
  /** Concise reason when inaccessible — suitable for title/tooltip. */
  reason?: string;
};

export const BOOKING_PROGRESS_STEPS: Exclude<BookingDecision, "success">[] = [
  "customer",
  "service",
  "employee",
  "datetime",
  "payment",
  "review",
];

/**
 * Whether a progress stage may open for review/edit.
 * Based on known state + real prerequisites — not linear step numbers.
 * Prefills remain revisitable without forcing upstream completion first.
 */
export function bookingDecisionAccess(
  decision: Exclude<BookingDecision, "success">,
  facts: BookingFacts,
): BookingDecisionAccess {
  switch (decision) {
    case "customer":
      return { accessible: true };
    case "service":
      if (facts.serviceId || facts.customerId) {
        return { accessible: true };
      }
      return { accessible: false, reason: "Select a customer first" };
    case "employee":
      if (!facts.serviceId) {
        return { accessible: false, reason: "Choose a service first" };
      }
      return { accessible: true };
    case "datetime":
      if (!facts.serviceId) {
        return { accessible: false, reason: "Choose a service first" };
      }
      if (facts.needsNamedEmployee) {
        return { accessible: false, reason: "Choose an employee first" };
      }
      return { accessible: true };
    case "payment":
      if (!facts.serviceId) {
        return { accessible: false, reason: "Choose a service first" };
      }
      if (facts.needsNamedEmployee) {
        return { accessible: false, reason: "Choose an employee first" };
      }
      if (!facts.slot || !facts.slotValid) {
        return { accessible: false, reason: "Choose a time first" };
      }
      return { accessible: true };
    case "review":
      if (!facts.paymentAcknowledged) {
        return { accessible: false, reason: "Choose payment before review" };
      }
      if (!facts.customerId) {
        return { accessible: false, reason: "Select a customer first" };
      }
      if (!facts.serviceId) {
        return { accessible: false, reason: "Choose a service first" };
      }
      if (facts.needsNamedEmployee) {
        return { accessible: false, reason: "Choose an employee first" };
      }
      if (!facts.slot || !facts.slotValid) {
        return { accessible: false, reason: "Choose a time first" };
      }
      return { accessible: true };
    default:
      return { accessible: false };
  }
}

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
