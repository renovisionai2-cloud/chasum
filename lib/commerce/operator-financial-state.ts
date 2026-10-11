import "server-only";
import { readPaymentObservability } from "./payment-observability/reader";
import type { PaymentReadResult, PaymentReadRequest } from "./payment-observability/types";
import { readBookingOperationCanonical, listBookingOperationHistory } from "./booking-operations/kernel";
import type { BookingOperationReadResult, BookingOperationHistoryPage, BookingOperationHistorySummary, BookingOperationFoundSnapshot } from "./booking-operations/types";
import type { OperatorFinancialView } from "./financial-aggregate/types";
function safeProjections(rows: unknown): OperatorFinancialView["projections"] {
    if (!Array.isArray(rows))
        return { state: "UNKNOWN" };
    const kinds = ["appointment_cache", "invoice_settlement", "customer_payment_events", "receipt"] as const;
    const states = ["PENDING", "FAILED", "COMPLETE", "NOT_REQUIRED"] as const;
    const items: Extract<OperatorFinancialView["projections"], {
        state: "AVAILABLE";
    }>["items"] = [];
    for (const row of rows) {
        const kind = kinds.find(value => value === row?.kind);
        const state = states.find(value => value === row?.state);
        if (!kind || !state || items.some(item => item.kind === kind))
            return { state: "UNKNOWN" };
        items.push({ kind, state });
    }
    return { state: "AVAILABLE", items };
}
function view(input?: {
    operationId?: string | null;
    attemptId: string;
    appointmentId: string | null;
    state: OperatorFinancialView["operatorState"];
    synchronization: OperatorFinancialView["synchronization"];
    obligations?: unknown;
    amount: number;
    currency: string;
    method: string | null;
    kind: string;
}): OperatorFinancialView {
    const state = input?.state ?? "UNKNOWN";
    const recorded = state === "RECORDED" || state === "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED";
    return {
        operatorState: state, moneyRecorded: recorded ? true : state === "NOT_RECORDED" ? false : null,
        synchronization: input?.synchronization ?? "UNKNOWN",
        projections: safeProjections(input?.obligations),
        communications: "NOT_IMPLEMENTED",
        operationId: input?.operationId ?? null, attemptId: input?.attemptId ?? null, appointmentId: input?.appointmentId ?? null,
        // Amount describes canonical recorded money only; requested amount is not collected.
        recordedAmount: recorded && input ? { cents: input.amount, currency: input.currency, method: input.method, kind: input.kind } : null,
        nextAction: state === "PAYMENT_RECOVERY_REQUIRED" ? "CHECK_SAME_OPERATION" : state === "UNKNOWN" || state === "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED" ? "REVIEW" : "NONE",
        canCollectAgain: false,
        explanation: recorded ? "Money is recorded. Do not collect again. Synchronization and communication are separate." : state === "NOT_RECORDED" ? "This canonical attempt has no recorded money. New collection still requires the governed workflow." : "Verify the same operation before taking action. Do not collect again.",
    };
}
/** Explicit allowlist, never spread an internal snapshot or event into a browser DTO. */
export function presentPaymentRead(result: PaymentReadResult): {
    state: "READY" | "UNKNOWN";
    items: OperatorFinancialView[];
} {
    if (result.kind !== "SNAPSHOT")
        return { state: "UNKNOWN", items: [view()] };
    return { state: "READY", items: result.snapshot.rows.map(row => view({
            operationId: row.booking_operation_id, attemptId: row.attempt_id, appointmentId: row.appointment_id,
            state: row.operator_state, synchronization: row.synchronization, obligations: row.obligations,
            amount: row.ledger?.amount_cents ?? row.amount_cents, currency: row.ledger?.currency ?? row.currency,
            method: row.ledger?.method ?? row.method, kind: row.ledger?.kind ?? row.payment_kind,
        })) };
}
function operationView(row: BookingOperationFoundSnapshot | BookingOperationHistorySummary): OperatorFinancialView {
    return view({ operationId: row.operationId, attemptId: row.attemptId, appointmentId: row.appointmentId,
        obligations: "obligations" in row ? row.obligations : undefined,
        state: row.operatorState, synchronization: row.synchronization, amount: row.amountCents, currency: row.currency, method: row.method, kind: row.paymentMode === "none" ? "none" : row.paymentMode === "deposit" ? "deposit" : "payment" });
}
/** Mutation/recovery hints are deliberately not inputs. Final canonical read wins. */
export function presentBookingRead(result: BookingOperationReadResult): OperatorFinancialView {
    return result.kind === "FOUND" ? operationView(result.snapshot) : view();
}
export function presentBookingHistory(result: BookingOperationHistoryPage) {
    return result.kind === "PAGE" ? { state: "READY" as const, items: result.items.map(operationView), nextCursor: result.nextCursor } : { state: "UNKNOWN" as const, items: [view()], nextCursor: null };
}
export async function readOperatorPayment(request: PaymentReadRequest) {
    try {
        return presentPaymentRead(await readPaymentObservability(request));
    }
    catch {
        return presentPaymentRead({ kind: "UNKNOWN" });
    }
}
export async function readOperatorBooking(operationId: string) {
    try {
        return presentBookingRead(await readBookingOperationCanonical(operationId));
    }
    catch {
        return view();
    }
}
export async function readOperatorBookingHistory() {
    try {
        return presentBookingHistory(await listBookingOperationHistory());
    }
    catch {
        return presentBookingHistory({ kind: "UNKNOWN", reason: "Unavailable" });
    }
}
