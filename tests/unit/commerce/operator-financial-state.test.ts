// @vitest-environment node
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const readers = vi.hoisted(() => ({ payment: vi.fn(), booking: vi.fn(), history: vi.fn() }));
vi.mock("@/lib/commerce/payment-observability/reader", () => ({ readPaymentObservability: readers.payment }));
vi.mock("@/lib/commerce/booking-operations/kernel", () => ({ readBookingOperationCanonical: readers.booking, listBookingOperationHistory: readers.history }));
import { presentPaymentRead, presentBookingRead, presentBookingHistory, readOperatorBooking, readOperatorPayment } from "@/lib/commerce/operator-financial-state";
import type { BookingOperationFoundSnapshot } from "@/lib/commerce/booking-operations/types";
import type { PaymentSnapshot } from "@/lib/commerce/payment-observability/types";
import type { OperatorFinancialView } from "@/lib/commerce/financial-aggregate/types";
const states: OperatorFinancialView["operatorState"][] = ["NOT_RECORDED", "PAYMENT_RECOVERY_REQUIRED", "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED", "RECORDED", "UNKNOWN"];
function booking(state: OperatorFinancialView["operatorState"]): BookingOperationFoundSnapshot {
    return { operationId: "op", attemptId: "attempt", appointmentId: "appointment", operatorState: state, synchronization: state === "RECORDED" ? "COMPLETE" : "PENDING", amountCents: 5000, currency: "cad", method: "cash", paymentMode: "deposit", paymentKind: "deposit", recoveryDisposition: "RECOVER", events: [{ sequence: 987654321, privateEmail: "PRIVATE", service_role: "SECRET" }], actorId: "INTERNAL", rawRecorded: true } as unknown as BookingOperationFoundSnapshot;
}
it.each(states)("operator state %s is preserved without permitting recollection", state => {
    const result = presentBookingRead({ kind: "FOUND", snapshot: booking(state) });
    expect(result.operatorState).toBe(state);
    expect(result.canCollectAgain).toBe(false);
    expect(result.moneyRecorded).toBe(state.startsWith("RECORDED") ? true : state === "NOT_RECORDED" ? false : null);
    if (state.startsWith("RECORDED")) {
        expect(result.recordedAmount).toMatchObject({ cents: 5000 });
        expect(result.nextAction).not.toBe("CHECK_SAME_OPERATION");
    }
    else
        expect(result.recordedAmount).toBeNull();
    expect(JSON.stringify(result)).not.toMatch(/sequence|987654321|PRIVATE|SECRET|INTERNAL|service_role|events/);
});
it("canonical COMPLETE wins over stale PENDING/RECOVER mutation advice", async () => {
    const staleMutation = { synchronization: "PENDING", recoveryDisposition: "RECOVER" };
    readers.booking.mockResolvedValue({ kind: "FOUND", snapshot: booking("RECORDED") });
    const result = await readOperatorBooking("op");
    expect(staleMutation.synchronization).toBe("PENDING");
    expect(result).toMatchObject({ operatorState: "RECORDED", synchronization: "COMPLETE", nextAction: "NONE", canCollectAgain: false });
    expect(readers.booking).toHaveBeenCalledWith("op");
});
it.each(states)("payment-observability %s allowlist strips event sequence and internals", state => {
    const result = presentPaymentRead({ kind: "SNAPSHOT", snapshot: { rows: [{ attempt_id: "attempt", booking_operation_id: "op", appointment_id: "appointment", operator_state: state, synchronization: state === "RECORDED" ? "COMPLETE" : "PENDING", amount_cents: 5000, currency: "cad", method: "cash", payment_kind: "deposit", ledger: state.startsWith("RECORDED") ? { amount_cents: 5000, currency: "cad", kind: "deposit", method: "cash" } : null, recovery_disposition: "RECOVER", events: [{ sequence: 987654321, foreign_refund: "PRIVATE" }] }] } as unknown as PaymentSnapshot });
    expect(result.items[0].operatorState).toBe(state);
    expect(JSON.stringify(result)).not.toMatch(/sequence|987654321|foreign_refund|PRIVATE|events/);
});
it("booking history uses the same minimal disclosure without internal event payload", () => {
    const result = presentBookingHistory({ kind: "PAGE", items: [booking("RECORDED")], nextCursor: null });
    expect(result.items).toHaveLength(1);
    expect(JSON.stringify(result)).not.toMatch(/sequence|987654321|PRIVATE|SECRET|INTERNAL|events/);
});
it.each(["NOT_AUTHORIZED", "UNKNOWN", "ABSENT"] as const)("unavailable booking %s is UNKNOWN, never no-payment authority", kind => expect(presentBookingRead({ kind, reason: "PRIVATE" })).toMatchObject({ operatorState: "UNKNOWN", moneyRecorded: null, canCollectAgain: false }));
it("read errors never expose internal errors or authorize collection", async () => {
    readers.payment.mockRejectedValue(new Error("service_role PRIVATE"));
    expect(await readOperatorPayment({ mode: "one", attemptId: "attempt" })).toMatchObject({ state: "UNKNOWN", items: [{ canCollectAgain: false }] });
});
it("projection summary exposes only kind/state and never implies communication delivery", () => {
    const snapshot = booking("RECORDED_BUT_NOT_FULLY_SYNCHRONIZED");
    snapshot.obligations = [{ kind: "receipt", state: "PENDING", failureCode: "PRIVATE", updatedAt: "PRIVATE", completedAt: null }];
    expect(presentBookingRead({ kind: "FOUND", snapshot })).toMatchObject({ projections: { state: "AVAILABLE", items: [{ kind: "receipt", state: "PENDING" }] }, communications: "NOT_IMPLEMENTED", moneyRecorded: true });
    expect(JSON.stringify(presentBookingRead({ kind: "FOUND", snapshot }))).not.toContain("PRIVATE");
    snapshot.obligations[0].kind = "PRIVATE_UNKNOWN";
    expect(presentBookingRead({ kind: "FOUND", snapshot }).projections).toEqual({ state: "UNKNOWN" });
});
