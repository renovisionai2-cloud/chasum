import "server-only";

export const PAYMENT_ATTEMPT_SOURCES = [
  "booking_sheet",
  "quick_appointment",
  "collect_payment",
  "customer_billing",
  "payments_dashboard",
] as const;

export const PAYMENT_ATTEMPT_METHODS = [
  "cash",
  "debit_card",
  "credit_card",
  "e_transfer",
  "gift_card",
  "store_credit",
  "other",
] as const;

export type PaymentAttemptSource = (typeof PAYMENT_ATTEMPT_SOURCES)[number];
export type PaymentAttemptMethod = (typeof PAYMENT_ATTEMPT_METHODS)[number];
export type PaymentAttemptKind = "payment" | "deposit" | "none";
export type PaymentAttemptProvider = "manual" | "stripe" | null;
export type PaymentAttemptTarget = "customer" | "appointment" | "booking_operation";

export type PaymentIntentV1Input = {
  businessId: string;
  customerId: string;
  target: PaymentAttemptTarget;
  targetId: string | null;
  amountCents: number;
  currency: string;
  method: PaymentAttemptMethod | null;
  paymentKind: PaymentAttemptKind;
  providerRoute: PaymentAttemptProvider;
  instrumentId: string | null;
};

export type NormalizedPaymentIntentV1 = PaymentIntentV1Input & {
  tuple: readonly [
    "chasum.payment-attempt",
    1,
    string,
    string,
    PaymentAttemptTarget,
    string | null,
    number,
    string,
    PaymentAttemptMethod | null,
    PaymentAttemptKind,
    PaymentAttemptProvider,
    string | null,
  ];
  canonicalUtf8: string;
  fingerprint: `v1:${string}`;
};

export type ManualPaymentAttemptRequest = {
  attemptKey: string;
  source: PaymentAttemptSource;
  customerId: string;
  target: "customer" | "appointment";
  appointmentId?: string | null;
  amountCents: number;
  method: PaymentAttemptMethod;
  paymentKind: PaymentAttemptKind;
  providerRoute?: "manual" | "stripe";
  invoiceId?: string | null;
  explicitInvoiceIntent?: boolean;
};

export type PaymentAttemptAuthority = {
  actorId: string;
  businessId: string;
  currency: string;
};

export type PaymentAttemptStoredIdentity = {
  id: string;
  business_id: string;
  attempt_key: string;
  execution_state: "REQUESTED" | "ACCEPTED" | "FAILED" | "SKIPPED";
};

export type AdmissionOutcome =
  | {
      kind: "ADMITTED" | "EXISTING";
      attemptId: string;
      executionState: PaymentAttemptStoredIdentity["execution_state"];
    }
  | {
      kind: "KEY_CONFLICT";
      attemptId: string;
      executionState: PaymentAttemptStoredIdentity["execution_state"];
      conflictEventId: string;
    }
  | { kind: "UNKNOWN"; reason: string };

export type CommitOutcome =
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

export type ManualPaymentAttemptResult =
  | CommitOutcome
  | AdmissionOutcome
  | { kind: "NOT_ADMITTED_DISABLED" }
  | { kind: "INVALID"; reason: string };
