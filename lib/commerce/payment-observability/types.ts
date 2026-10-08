import { z } from "zod";
import { projectionKinds } from "../payment-projections/types";

const date = z.iso.datetime({ offset: true });
const failureCode = z.enum(["INVALID_REQUEST", "NOT_AUTHORIZED", "KEY_CONFLICT", "PROVIDER_FAILED", "PROVIDER_UNCERTAIN", "LEDGER_FAILED", "LEDGER_UNCERTAIN", "PROJECTION_FAILED", "PROJECTION_UNCERTAIN", "INTERNAL_ERROR"]).nullable();
const failureClass = z.enum(["VALIDATION", "AUTHORIZATION", "CONFLICT", "PROVIDER", "LEDGER", "PROJECTION", "INTERNAL"]).nullable();
const obligationState = z.enum(["PENDING", "FAILED", "COMPLETE", "NOT_REQUIRED"]);
export const paymentSnapshotSchema = z.object({
  snapshot_at: date, business_id: z.uuid(), next_cursor: z.string().regex(/^[0-9a-f]+$/).max(1024).nullable(),
  rows: z.array(z.object({
    attempt_id: z.uuid(), attempt_key: z.uuid().nullable(),
    source: z.enum(["booking_sheet", "quick_appointment", "collect_payment", "customer_billing", "payments_dashboard"]),
    booking_operation_id: z.uuid().nullable(), appointment_id: z.uuid().nullable(),
    payment_kind: z.enum(["payment", "deposit", "none"]), amount_cents: z.number().int().nonnegative(), currency: z.string().regex(/^[a-z]{3}$/),
    method: z.enum(["cash", "e_transfer", "credit_card", "debit_card", "gift_card", "store_credit", "other"]).nullable(),
    provider_route: z.enum(["manual", "stripe"]).nullable(), payment_mode: z.enum(["none", "deposit", "full", "custom"]).nullable(),
    execution_state: z.enum(["REQUESTED", "ACCEPTED", "FAILED", "SKIPPED"]),
    recovery_disposition: z.enum(["RECOVER", "DO_NOT_RETRY", "NEW_ATTEMPT_ALLOWED"]),
    failure_class: failureClass, failure_code: failureCode,
    events: z.array(z.object({ id: z.uuid(), sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      type: z.enum(["REQUESTED", "ACCEPTED", "FAILED", "SKIPPED", "REPLAYED", "KEY_CONFLICT", "RECOVERY_REQUIRED", "PROJECTION_CHANGED"]),
      money_state: z.enum(["NOT_RECORDED", "RECORDED", "PENDING", "REQUIRES_ACTION", "UNKNOWN"]),
      projection_kind: z.enum(projectionKinds).nullable(), state: obligationState.nullable(),
      failure_class: failureClass, failure_code: failureCode, occurred_at: date }).strict()),
    ledger_count: z.number().int().nonnegative(),
    ledger: z.object({ id: z.uuid(), appointment_id: z.uuid().nullable(), amount_cents: z.number().int(), currency: z.string().regex(/^[a-z]{3}$/),
      method: z.string(), kind: z.string(), status: z.string(), provider: z.string() }).strict().nullable(),
    obligations: z.array(z.object({ kind: z.enum(projectionKinds), state: obligationState,
      failure_code: z.enum(["PROJECTION_FAILED", "PROJECTION_UNCERTAIN"]).nullable(), updated_at: date, completed_at: date.nullable() }).strict()),
    operator_state: z.enum(["NOT_RECORDED", "PAYMENT_RECOVERY_REQUIRED", "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED", "RECORDED", "UNKNOWN"]),
    synchronization: z.enum(["NOT_REQUIRED", "PENDING", "COMPLETE", "UNKNOWN"]),
    created_at: date, resolved_at: date.nullable(), communication_eligibility: z.literal("NOT_IMPLEMENTED"),
  }).strict()).max(50),
}).strict();
export type PaymentSnapshot = z.infer<typeof paymentSnapshotSchema>;
export type PaymentReadRequest = { mode: "one"; attemptId: string } | { mode: "history"; cursor?: string; limit?: number };
export type PaymentReadResult = { kind: "SNAPSHOT"; snapshot: PaymentSnapshot } | { kind: "UNKNOWN" } | { kind: "NOT_AUTHORIZED" };
export type PaymentReaderDependencies = {
  resolveAuthority(): Promise<{ businessId: string; actorId: string }>;
  rpc(args: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
};
