/**
 * Progressive booking workspace stages (create flow).
 * Engines are unchanged — this is presentation/workflow only.
 */

export const BOOKING_WORKFLOW_STEPS = [
  "customer",
  "appointment",
  "time",
  "payment",
  "confirm",
] as const;

export type BookingWorkflowStep = (typeof BOOKING_WORKFLOW_STEPS)[number];

export type BookingStageVisualState = "active" | "complete" | "upcoming" | "locked";

export function bookingStageVisualState(
  step: BookingWorkflowStep,
  active: BookingWorkflowStep,
  completed: Partial<Record<BookingWorkflowStep, boolean>>,
): BookingStageVisualState {
  if (step === active) return "active";
  if (completed[step]) return "complete";
  const order = BOOKING_WORKFLOW_STEPS.indexOf(step);
  const activeOrder = BOOKING_WORKFLOW_STEPS.indexOf(active);
  if (order < activeOrder) return "complete";
  if (order === activeOrder + 1) return "upcoming";
  return "locked";
}

export function bookingWorkflowStatus(args: {
  step: BookingWorkflowStep;
  canSubmit: boolean;
  hasCustomer: boolean;
  appointmentReady: boolean;
  hasTime: boolean;
}): string {
  if (args.canSubmit && args.step === "confirm") return "Ready to book";
  switch (args.step) {
    case "customer":
      return args.hasCustomer ? "Continue to appointment" : "Select a customer";
    case "appointment":
      return args.appointmentReady
        ? "Continue to time"
        : "Choose service, employee, and date";
    case "time":
      return args.hasTime ? "Continue to payment" : "Choose a time";
    case "payment":
      return "Choose payment";
    case "confirm":
      return args.canSubmit ? "Ready to book" : "Review before confirming";
    default:
      return "Continue";
  }
}

export function isAppointmentStageReady(args: {
  serviceId: string;
  locationId: string;
  date: string;
  needsNamedEmployee: boolean;
}): boolean {
  return Boolean(
    args.serviceId &&
      args.locationId &&
      args.date &&
      !args.needsNamedEmployee,
  );
}
