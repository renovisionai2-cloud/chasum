import "server-only";

import type {
  BookingIntent,
  DurableBookingExpectedSnapshot,
} from "@/lib/booking-engine/types";
import type {
  NormalizedPaymentIntentV1,
  PaymentAttemptMethod,
  PaymentAttemptSource,
} from "@/lib/commerce/payment-attempts/types";

export type BookingOperationSource = Extract<
  PaymentAttemptSource,
  "booking_sheet" | "quick_appointment"
>;
export type BookingPaymentMode = "none" | "deposit" | "full" | "custom";
export type BookingManualMethod = Extract<
  PaymentAttemptMethod,
  "cash" | "e_transfer" | "debit_card" | "credit_card" | "other"
>;
export type BookingOperationCloseReason =
  | "PRICING_CHANGED"
  | "SLOT_CONFLICT"
  | "CUSTOMER_REASSIGNED"
  | "APPOINTMENT_CANCELLED"
  | "OPERATOR_ABANDONED";

export type BookingOperationIdentities = {
  operationId: string;
  attemptKey: string;
  inlineCustomerId: string;
};

export type BookingOperationCustomerInput =
  | { mode: "existing"; customerId: string }
  | {
      mode: "inline";
      inlineCustomerId: string;
      name: string;
      email: string;
      phone?: string | null;
    };

export type BookingOperationPaymentInput =
  | {
      mode: "none";
      method?: null;
      customAmountCents?: null;
      note?: string | null;
      receiptRequested?: boolean;
    }
  | {
      mode: "deposit" | "full";
      method: BookingManualMethod;
      customAmountCents?: null;
      note?: string | null;
      receiptRequested?: boolean;
    }
  | {
      mode: "custom";
      method: BookingManualMethod;
      customAmountCents: number;
      note?: string | null;
      receiptRequested?: boolean;
    };

export type BookingOperationRequest = {
  identities: BookingOperationIdentities;
  source: BookingOperationSource;
  customer: BookingOperationCustomerInput;
  booking: Omit<
    BookingIntent,
    | "businessId"
    | "customerId"
    | "durableOperation"
    | "priceCents"
    | "taxCents"
    | "depositCents"
  >;
  payment: BookingOperationPaymentInput;
};

export type BookingOperationAuthority = {
  actorId: string;
  businessId: string;
  currency: string;
};

export type AuthoritativeBookingSnapshot = {
  requestedEnd: string;
  requestedStatus: DurableBookingExpectedSnapshot["requestedStatus"];
  durationMinutes: number;
  subtotalCents: number;
  taxCents: number;
  depositRequiredCents: number;
  appointmentNotes: string | null;
};

export type NormalizedBookingOperation = {
  authority: BookingOperationAuthority;
  identities: BookingOperationIdentities;
  source: BookingOperationSource;
  customerOrigin: "existing" | "inline";
  customerId: string;
  inlineName: string | null;
  inlineEmail: string | null;
  inlinePhoneDigits: string | null;
  customerInputTuple: readonly [
    "chasum.booking-customer-input",
    1,
    "existing" | "inline",
    string,
    string | null,
    string | null,
    string | null,
  ];
  customerInputCanonicalUtf8: string;
  customerInputFingerprint: `v1:${string}`;
  bookingTuple: readonly [
    "chasum.booking-operation",
    1,
    string,
    string,
    string,
    string,
    string | null,
    string,
    string,
    string,
    number,
    string | null,
    readonly string[],
    string | null,
    string | null,
    number,
    number,
    number,
    BookingPaymentMode,
    string | null,
    string | null,
    boolean,
  ];
  bookingCanonicalUtf8: string;
  bookingFingerprint: `v1:${string}`;
  paymentIntent: NormalizedPaymentIntentV1;
  bookingIntent: BookingIntent;
  durableExpected: DurableBookingExpectedSnapshot;
  paymentMode: BookingPaymentMode;
  receiptRequested: boolean;
};

export type BookingOperationBootstrapOutcome =
  | {
      kind: "ADMITTED" | "EXISTING";
      operationId: string;
      customerId: string;
      attemptId: string;
      executionState: "REQUESTED" | "ACCEPTED" | "FAILED" | "SKIPPED";
    }
  | { kind: "CUSTOMER_MATCH_REQUIRES_SELECTION" }
  | {
      kind: "KEY_CONFLICT";
      operationId: string;
      attemptId: string;
      conflictEventId: string;
    }
  | { kind: "NOT_AUTHORIZED" }
  | { kind: "UNKNOWN"; reason: string };

export type BookingOperationAppointmentOutcome =
  | { kind: "CREATED"; appointmentId: string }
  | { kind: "EXISTING"; appointmentId: string }
  | { kind: "CONFLICT"; reason: string }
  | { kind: "UNKNOWN"; reason: string };

export type BookingOperationBindOutcome =
  | {
      kind: "BOUND";
      operationId: string;
      appointmentId: string;
      attemptId: string;
    }
  | {
      kind: "EXISTING";
      operationId: string;
      appointmentId: string;
      attemptId: string;
    }
  | { kind: "CLOSED" }
  | { kind: "NOT_AUTHORIZED" }
  | { kind: "UNKNOWN"; reason: string };

export type BookingOperationCommitOutcome =
  | {
      kind: "RECORDED" | "REPLAY";
      attemptId: string;
      transactionId: string;
      recorded: true;
      synchronization: "PENDING";
    }
  | {
      kind: "NOT_COMMITTABLE";
      attemptId: string;
      recorded: false;
      synchronization: "UNKNOWN";
    }
  | {
      kind: "UNKNOWN";
      attemptId: string | null;
      transactionId: string | null;
      recorded: boolean;
      synchronization: "UNKNOWN";
      reason: string;
    };

export type BookingOperationCloseOutcome =
  | {
      kind: "CLOSED" | "EXISTING";
      operationId: string;
      appointmentId: string | null;
      attemptId: string;
      recorded: boolean;
    }
  | { kind: "RECOVERY_REQUIRED"; recorded: boolean }
  | { kind: "NOT_AUTHORIZED" }
  | { kind: "UNKNOWN"; reason: string };

export type BookingOperationEventSnapshot = {
  id: string;
  sequence: number;
  type: string;
  moneyState: string;
  failureClass: string | null;
  failureCode: string | null;
  occurredAt: string;
};

export type BookingOperationObligationSnapshot = {
  kind: string;
  state: string;
  failureCode: string | null;
  updatedAt: string;
  completedAt: string | null;
};

export type BookingOperatorState =
  | "NOT_RECORDED"
  | "PAYMENT_RECOVERY_REQUIRED"
  | "RECORDED"
  | "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED"
  | "UNKNOWN";

export type BookingOperationFoundSnapshot = {
  operationId: string;
  actorId: string;
  source: BookingOperationSource;
  lifecycleState: "OPEN" | "APPOINTMENT_CREATED" | "CLOSED";
  closeReason: BookingOperationCloseReason | null;
  createdAt: string;
  updatedAt: string;
  appointmentId: string | null;
  appointmentSaved: boolean;
  attemptId: string;
  executionState: "REQUESTED" | "ACCEPTED" | "FAILED" | "SKIPPED";
  recoveryDisposition: "RECOVER" | "DO_NOT_RETRY" | "NEW_ATTEMPT_ALLOWED";
  paymentMode: BookingPaymentMode;
  paymentKind: "payment" | "deposit" | "none";
  amountCents: number;
  currency: string;
  method: BookingManualMethod | null;
  failureClass: string | null;
  failureCode: string | null;
  attemptCreatedAt: string;
  attemptResolvedAt: string | null;
  events: BookingOperationEventSnapshot[];
  transactionId: string | null;
  ledgerCount: number;
  rawRecorded: boolean;
  obligations: BookingOperationObligationSnapshot[];
  operatorState: BookingOperatorState;
  synchronization: "NOT_REQUIRED" | "PENDING" | "COMPLETE" | "UNKNOWN";
  recoveryAction:
    | "NONE"
    | "CREATE_APPOINTMENT"
    | "BIND_APPOINTMENT"
    | "COMMIT_PAYMENT"
    | "REVIEW";
  communicationEligibility: "NOT_IMPLEMENTED";
  consistency: "SINGLE_STATEMENT_READ_COMMITTED";
};

export type BookingOperationReadResult =
  | { kind: "FOUND"; snapshot: BookingOperationFoundSnapshot }
  | { kind: "ABSENT" }
  | { kind: "NOT_AUTHORIZED" }
  | { kind: "UNKNOWN"; reason: string };

export type BookingOperationHistoryCursor = string & {
  readonly __bookingOperationHistoryCursor: unique symbol;
};

export type BookingOperationHistorySummary = Omit<
  BookingOperationFoundSnapshot,
  | "actorId"
  | "paymentKind"
  | "recoveryDisposition"
  | "failureClass"
  | "failureCode"
  | "attemptCreatedAt"
  | "attemptResolvedAt"
  | "events"
  | "obligations"
  | "communicationEligibility"
  | "consistency"
>;

export type BookingOperationHistoryPage =
  | {
      kind: "PAGE";
      items: BookingOperationHistorySummary[];
      nextCursor: BookingOperationHistoryCursor | null;
    }
  | { kind: "NOT_AUTHORIZED" }
  | { kind: "UNKNOWN"; reason: string };

export type BookingOperationKernelResult =
  | {
      kind:
        | "NOT_RECORDED"
        | "PAYMENT_RECOVERY_REQUIRED"
        | "RECORDED"
        | "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED";
      operationId: string;
      appointmentId: string | null;
      attemptId: string;
      transactionId: string | null;
      appointmentSaved: boolean;
      reason: string | null;
    }
  | { kind: "CUSTOMER_MATCH_REQUIRES_SELECTION" }
  | { kind: "KEY_CONFLICT"; operationId: string }
  | { kind: "NOT_ADMITTED_DISABLED" }
  | { kind: "NOT_AUTHORIZED" }
  | { kind: "INVALID"; reason: string }
  | { kind: "UNKNOWN"; operationId: string; reason: string };

export type BookingOperationKernelDependencies = {
  admissionEnabled: boolean;
  resolveAuthority(): Promise<BookingOperationAuthority>;
  validateAndPrice(
    authority: BookingOperationAuthority,
    request: BookingOperationRequest,
  ): Promise<AuthoritativeBookingSnapshot>;
  bootstrap(
    normalized: NormalizedBookingOperation,
  ): Promise<BookingOperationBootstrapOutcome>;
  recoverAppointment(
    businessId: string,
    operationId: string,
  ): Promise<string | null>;
  createAppointment(
    normalized: NormalizedBookingOperation,
  ): Promise<BookingOperationAppointmentOutcome>;
  bind(
    normalized: NormalizedBookingOperation,
    appointmentId: string,
  ): Promise<BookingOperationBindOutcome>;
  close(
    normalized: NormalizedBookingOperation,
    reason: BookingOperationCloseReason,
  ): Promise<BookingOperationCloseOutcome>;
  commit(
    normalized: NormalizedBookingOperation,
    attemptId: string,
  ): Promise<BookingOperationCommitOutcome>;
  read(operationId: string): Promise<BookingOperationReadResult>;
};
