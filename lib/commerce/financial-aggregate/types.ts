/** Browser-safe leaf contracts. No credentials, ledger rows or refund payloads. */
export const FINANCIAL_CURRENCIES = ["cad", "usd", "gbp", "eur", "aud"] as const;
export type FinancialCurrency = typeof FINANCIAL_CURRENCIES[number];
export type FinancialUnavailable = {
    state: "HELD";
    reason: string;
} | {
    state: "UNKNOWN";
    reason: string;
};
export type FinancialAmount = FinancialUnavailable | {
    state: "EXACT";
    cents: number;
    currency: FinancialCurrency;
};
export type FinancialPeriod = {
    from: string;
    to: string;
    timezone: string;
};
export type FinancialBucket = {
    currency: FinancialCurrency;
    collectedCents: number;
    paymentCents: number;
    depositCents: number;
    paymentCount: number;
};
export type FinancialAggregate = FinancialUnavailable | {
    state: "EXACT";
    period: FinancialPeriod;
    scope: "BUSINESS" | "CURRENT_APPOINTMENT_LOCATION";
    buckets: FinancialBucket[];
};
export const unknownMoney = (reason = "COMPLETE_FINANCIAL_EVIDENCE_UNAVAILABLE"): FinancialUnavailable => ({ state: "UNKNOWN", reason });
export const heldMoney = (reason: string): FinancialUnavailable => ({ state: "HELD", reason });
export function isFinancialCurrency(value: unknown): value is FinancialCurrency {
    return typeof value === "string" && (FINANCIAL_CURRENCIES as readonly string[]).includes(value);
}
export function singleFinancialAmount(result: FinancialAggregate): FinancialAmount {
    if (result.state !== "EXACT")
        return result;
    if (result.buckets.length !== 1)
        return heldMoney("MULTIPLE_CURRENCIES");
    const bucket = result.buckets[0];
    return { state: "EXACT", cents: bucket.collectedCents, currency: bucket.currency };
}
export function financialAmountText(value: FinancialAmount): string {
    if (!value)
        return "Unknown — unverified";
    if (value.state !== "EXACT")
        return value.state === "HELD" ? "Held — requires review" : "Unknown — unverified";
    if (!Number.isSafeInteger(value.cents) || value.cents < 0 || !isFinancialCurrency(value.currency))
        return "Unknown — unverified";
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: value.currency.toUpperCase(), currencyDisplay: "code" }).format(value.cents / 100);
}
/** Browser-safe, minimal operator disclosure; no raw events or sequence values. */
export type OperatorFinancialView = {
    operatorState: "NOT_RECORDED" | "PAYMENT_RECOVERY_REQUIRED" | "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED" | "RECORDED" | "UNKNOWN";
    moneyRecorded: boolean | null;
    synchronization: "NOT_REQUIRED" | "PENDING" | "COMPLETE" | "UNKNOWN";
    operationId: string | null;
    attemptId: string | null;
    appointmentId: string | null;
    projections: {
        state: "AVAILABLE";
        items: Array<{
            kind: "appointment_cache" | "invoice_settlement" | "customer_payment_events" | "receipt";
            state: "PENDING" | "FAILED" | "COMPLETE" | "NOT_REQUIRED";
        }>;
    } | {
        state: "UNKNOWN";
    };
    communications: "NOT_IMPLEMENTED";
    recordedAmount: {
        cents: number;
        currency: string;
        method: string | null;
        kind: string;
    } | null;
    nextAction: "NONE" | "CHECK_SAME_OPERATION" | "REVIEW";
    canCollectAgain: false;
    explanation: string;
};
