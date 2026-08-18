/**
 * Adaptive Booking Workspace — ask only for what Chasum does not already know.
 * Engines unchanged; this is presentation / workflow orchestration only.
 *
 * LOCKED PRINCIPLES
 * 1. Adaptive booking may skip only decisions that are intentionally and validly resolved.
 * 2. A value being present does not by itself mean that a booking decision is resolved.
 * 3. Accessible, resolved, required, and provenance are distinct workflow concepts.
 * 4. Required unresolved decisions determine normal forward progression.
 * 5. Chasum must not silently choose required business decisions and present them as user-completed.
 */

export const BOOKING_DECISIONS = [
  "customer",
  "service",
  "location",
  "employee",
  "datetime",
  "payment",
  "review",
  "success",
] as const;

export type BookingDecision = (typeof BOOKING_DECISIONS)[number];

/**
 * Why a booking decision value exists.
 * Only resolving provenance may skip a required decision.
 */
export type BookingDecisionProvenance =
  | "user_selected"
  | "entry_context"
  | "valid_draft"
  | "appointment"
  | "preference"
  | "default"
  | "none";

const RESOLVING_PROVENANCE = new Set<BookingDecisionProvenance>([
  "user_selected",
  "entry_context",
  "valid_draft",
  "appointment",
]);

/** True when provenance counts as an intentional, skip-worthy resolution. */
export function isIntentionallyResolved(
  provenance: BookingDecisionProvenance,
  valuePresent: boolean,
): boolean {
  return valuePresent && RESOLVING_PROVENANCE.has(provenance);
}

export type BookingFacts = {
  customerId: string | null;
  /** Intentionally resolved — not merely a truthy id in state. */
  customerResolved: boolean;
  serviceId: string;
  serviceResolved: boolean;
  /**
   * Named employee still required by product rules (optional/unassigned gated off).
   * Distinct from employeeResolved (intentional selection).
   */
  needsNamedEmployee: boolean;
  employeeResolved: boolean;
  /**
   * More than one usable booking location — Location is an explicit decision.
   * One-location businesses auto-resolve and must not show a Location step.
   */
  locationRequired: boolean;
  locationResolved: boolean;
  date: string;
  slot: string | null;
  slotValid: boolean;
  datetimeResolved: boolean;
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

/** Progress stages for this booking — Location appears only when required. */
export function bookingProgressSteps(
  facts: Pick<BookingFacts, "locationRequired">,
): Exclude<BookingDecision, "success">[] {
  if (!facts.locationRequired) return BOOKING_PROGRESS_STEPS;
  return [
    "customer",
    "service",
    "location",
    "employee",
    "datetime",
    "payment",
    "review",
  ];
}

/**
 * Whether a progress stage may open for review/edit (ACCESSIBLE).
 * Based on intentionally resolved prerequisites — not linear step numbers.
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
      if (facts.serviceResolved || facts.customerResolved) {
        return { accessible: true };
      }
      return { accessible: false, reason: "Select a customer first" };
    case "location":
      if (!facts.locationRequired) {
        return { accessible: false, reason: "Location is already resolved" };
      }
      if (!facts.serviceResolved) {
        return { accessible: false, reason: "Choose a service first" };
      }
      return { accessible: true };
    case "employee":
      if (!facts.serviceResolved) {
        return { accessible: false, reason: "Choose a service first" };
      }
      if (facts.locationRequired && !facts.locationResolved) {
        return { accessible: false, reason: "Choose a location first" };
      }
      return { accessible: true };
    case "datetime":
      if (!facts.serviceResolved) {
        return { accessible: false, reason: "Choose a service first" };
      }
      if (facts.locationRequired && !facts.locationResolved) {
        return { accessible: false, reason: "Choose a location first" };
      }
      if (!facts.employeeResolved) {
        return { accessible: false, reason: "Choose an employee first" };
      }
      return { accessible: true };
    case "payment":
      if (!facts.serviceResolved) {
        return { accessible: false, reason: "Choose a service first" };
      }
      if (facts.locationRequired && !facts.locationResolved) {
        return { accessible: false, reason: "Choose a location first" };
      }
      if (!facts.employeeResolved) {
        return { accessible: false, reason: "Choose an employee first" };
      }
      if (!facts.datetimeResolved) {
        return { accessible: false, reason: "Choose a time first" };
      }
      return { accessible: true };
    case "review":
      if (!facts.paymentAcknowledged) {
        return { accessible: false, reason: "Choose payment before review" };
      }
      if (!facts.customerResolved) {
        return { accessible: false, reason: "Select a customer first" };
      }
      if (!facts.serviceResolved) {
        return { accessible: false, reason: "Choose a service first" };
      }
      if (facts.locationRequired && !facts.locationResolved) {
        return { accessible: false, reason: "Choose a location first" };
      }
      if (!facts.employeeResolved) {
        return { accessible: false, reason: "Choose an employee first" };
      }
      if (!facts.datetimeResolved) {
        return { accessible: false, reason: "Choose a time first" };
      }
      return { accessible: true };
    default:
      return { accessible: false };
  }
}

/**
 * Canonical next required unresolved decision (forward progression).
 * Finds the FIRST decision that is REQUIRED and NOT intentionally resolved.
 * Do not use furthest accessible / hydrated UI / truthy-value heuristics.
 */
export function firstMissingDecision(facts: BookingFacts): BookingDecision {
  if (facts.success) return "success";
  if (!facts.customerResolved) return "customer";
  if (!facts.serviceResolved) return "service";
  if (facts.locationRequired && !facts.locationResolved) return "location";
  if (!facts.employeeResolved) return "employee";
  if (!facts.datetimeResolved) return "datetime";
  if (!facts.paymentAcknowledged) return "payment";
  return "review";
}

/** Alias — one canonical mechanism for next required unresolved decision. */
export const nextRequiredDecision = firstMissingDecision;

export function bookingDecisionLabel(decision: BookingDecision): string {
  switch (decision) {
    case "customer":
      return "Customer";
    case "service":
      return "Service";
    case "location":
      return "Location";
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
    case "location":
      return "Choose a location";
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

/** Prior decision for Back — prefers intentionally resolved facts. */
export function previousDecision(
  current: BookingDecision,
  facts: BookingFacts,
): BookingDecision | null {
  const order = bookingProgressSteps(facts);
  const idx = order.indexOf(
    current === "success" ? "review" : (current as Exclude<BookingDecision, "success">),
  );
  if (idx <= 0) return null;
  for (let i = idx - 1; i >= 0; i--) {
    const d = order[i];
    if (d === "customer" && facts.customerResolved) return "customer";
    if (d === "service" && facts.serviceResolved) return "service";
    if (d === "location" && facts.locationResolved) return "location";
    if (d === "location") continue;
    if (d === "employee" && facts.employeeResolved) return "employee";
    if (d === "employee") continue;
    if (d === "datetime" && facts.datetimeResolved) return "datetime";
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

/**
 * Test / call-site helper: treat present values as intentionally resolved.
 * Production create flow must set resolved flags from provenance explicitly.
 */
export function bookingFactsFromValues(
  values: Omit<
    BookingFacts,
    | "customerResolved"
    | "serviceResolved"
    | "employeeResolved"
    | "datetimeResolved"
    | "locationRequired"
    | "locationResolved"
  > &
    Partial<
      Pick<
        BookingFacts,
        | "customerResolved"
        | "serviceResolved"
        | "employeeResolved"
        | "datetimeResolved"
        | "locationRequired"
        | "locationResolved"
      >
    >,
): BookingFacts {
  const customerResolved =
    values.customerResolved ?? Boolean(values.customerId);
  const serviceResolved = values.serviceResolved ?? Boolean(values.serviceId);
  const employeeResolved =
    values.employeeResolved ?? !values.needsNamedEmployee;
  const datetimeResolved =
    values.datetimeResolved ??
    Boolean(values.slot && values.slotValid);
  const locationRequired = values.locationRequired ?? false;
  const locationResolved =
    values.locationResolved ?? !locationRequired;
  return {
    ...values,
    customerResolved,
    serviceResolved,
    employeeResolved,
    datetimeResolved,
    locationRequired,
    locationResolved,
  };
}
