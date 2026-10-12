import "server-only";
import { z } from "zod";
import { requireBusiness, requireUser } from "@/lib/actions/business";
import { createServiceClient } from "@/lib/supabase/service";
import { financialPeriod, type FinancialPeriodName } from "../financial-period";
import { heldMoney, isFinancialCurrency, unknownMoney, type FinancialAggregate, type FinancialBucket, type FinancialPeriod } from "./types";
export const FINANCIAL_ROW_BOUND = 1000;
const select = `id,business_id,customer_id,appointment_id,payment_attempt_id,status,provider,kind,method,amount_cents,currency,occurred_at,
 customer:customers!commerce_transactions_customer_id_fkey(id,business_id),
 transaction_witness:commerce_refunds!commerce_refunds_transaction_id_fkey(transaction_id),
 appointment:appointments!commerce_transactions_appt_business_customer_financial_fk(id,business_id,customer_id,location_id,amount_refunded_cents,
   current_location:locations!appointments_location_id_fkey(id,business_id),
   appointment_witness:commerce_refunds!commerce_refunds_appointment_id_fkey(appointment_id)),
 attempt:commerce_payment_attempts!commerce_transactions_attempt_business_fk(id,business_id,customer_id,appointment_id,execution_state,payment_kind,amount_cents,currency,method,provider_route)`;
const requestSchema = z.object({
    period: z.enum(["today", "yesterday", "week", "previousWeek", "month", "previousMonth", "year"]),
    locationId: z.uuid().optional(), customerId: z.uuid().optional(),
}).strict();
export type FinancialRequest = {
    period: FinancialPeriodName;
    locationId?: string;
    customerId?: string;
};
type Authority = {
    businessId: string;
    actorId: string;
    timezone: string;
    currency: string;
};
type Envelope = {
    data: unknown;
    error: unknown;
    count: number | null;
};
export type FinancialReaderDependencies = {
    resolveAuthority(): Promise<Authority>;
    now(): Date;
    read(authority: Authority, period: FinancialPeriod, request: FinancialRequest): Promise<Envelope>;
};
const defaults: FinancialReaderDependencies = {
    async resolveAuthority() {
        const user = await requireUser();
        const business = await requireBusiness();
        return { businessId: business.id, actorId: user.id, timezone: business.timezone, currency: business.currency ?? "" };
    },
    now: () => new Date(),
    async read(authority, period, request) {
        const db = createServiceClient({ requestTimeoutMs: 10000 });
        // Scope authorization is not a second financial read. No foreign payload is selected.
        for (const [table, id] of [["locations", request.locationId], ["customers", request.customerId]] as const) {
            if (!id)
                continue;
            const scope = await db.from(table).select("id").eq("business_id", authority.businessId).eq("id", id).maybeSingle();
            if (scope.error || !scope.data)
                return { data: null, error: true, count: null };
        }
        let query = db.from("commerce_transactions").select(select, { count: "exact" })
            .eq("business_id", authority.businessId).gte("occurred_at", period.from).lt("occurred_at", period.to)
            .eq("customer.business_id", authority.businessId)
            .eq("appointment.business_id", authority.businessId)
            .eq("appointment.current_location.business_id", authority.businessId)
            .eq("attempt.business_id", authority.businessId)
            .limit(1, { referencedTable: "transaction_witness" })
            .limit(1, { referencedTable: "appointment.appointment_witness" })
            .order("id").limit(FINANCIAL_ROW_BOUND);
        if (request.customerId)
            query = query.eq("customer_id", request.customerId);
        return await query;
    },
};
const record = z.record(z.string(), z.unknown());
const id = z.uuid();
const nullableId = id.nullable();
const identity = z.object({ id, business_id: id });
const appointment = identity.extend({ customer_id: id, location_id: nullableId, amount_refunded_cents: z.unknown(), current_location: identity.nullable(), appointment_witness: z.unknown() });
const attempt = identity.extend({ customer_id: id, appointment_id: nullableId, execution_state: z.unknown(), payment_kind: z.unknown(), amount_cents: z.unknown(), currency: z.unknown(), method: z.unknown(), provider_route: z.unknown() });
const rowSchema = identity.extend({ customer_id: id, appointment_id: nullableId, payment_attempt_id: nullableId,
    occurred_at: z.iso.datetime({ offset: true }), status: z.unknown(), provider: z.unknown(), kind: z.unknown(), method: z.unknown(), amount_cents: z.unknown(), currency: z.unknown(),
    customer: identity.nullable(), appointment: appointment.nullable(), attempt: attempt.nullable(), transaction_witness: z.unknown(),
});
/** C2/C3/C6: field presence, cardinality, strict allowlist, and authorized-key equality. */
function witness(value: unknown, key: string, rootId: string): boolean | null {
    if (!Array.isArray(value) || value.length > 1)
        return null;
    if (value.length === 0)
        return false;
    const parsed = record.safeParse(value[0]);
    if (!parsed.success || Object.keys(parsed.data).length !== 1 || parsed.data[key] !== rootId)
        return null;
    return true;
}
/** One response only. Never logs or returns raw evidence, even on protocol failures. */
export async function readFinancialAggregate(request: FinancialRequest, deps: FinancialReaderDependencies = defaults): Promise<FinancialAggregate> {
    const input = requestSchema.safeParse(request);
    if (!input.success)
        return unknownMoney("INVALID_FINANCIAL_SCOPE");
    try {
        const resolved = await deps.resolveAuthority();
        const authority = { ...resolved, currency: typeof resolved.currency === "string" ? resolved.currency.trim().toLowerCase() : "" };
        if (!id.safeParse(authority.businessId).success || !id.safeParse(authority.actorId).success)
            return unknownMoney("AUTHORITY_UNAVAILABLE");
        if (!isFinancialCurrency(authority.currency))
            return heldMoney("UNSUPPORTED_CURRENCY");
        const period = financialPeriod(input.data.period, authority.timezone, deps.now());
        const response = await deps.read(authority, period, input.data);
        if (response.error || !Array.isArray(response.data) || !Number.isSafeInteger(response.count) || response.count !== response.data.length || response.data.length > FINANCIAL_ROW_BOUND)
            return unknownMoney("INCOMPLETE_FINANCIAL_EVIDENCE");
        const required = ["id", "business_id", "customer_id", "appointment_id", "payment_attempt_id", "status", "provider", "kind", "method", "amount_cents", "currency", "occurred_at", "customer", "appointment", "attempt", "transaction_witness"];
        if (response.data.some(row => !row || required.some(key => !Object.prototype.hasOwnProperty.call(row, key))))
            return unknownMoney("INVALID_FINANCIAL_RESPONSE");
        for (const row of response.data) {
            const expected = [[row.appointment, ["id", "business_id", "customer_id", "location_id", "amount_refunded_cents", "current_location", "appointment_witness"]],
                [row.attempt, ["id", "business_id", "customer_id", "appointment_id", "execution_state", "payment_kind", "amount_cents", "currency", "method", "provider_route"]]] as const;
            if (expected.some(([embedded, keys]) => embedded !== null && keys.some(key => !Object.prototype.hasOwnProperty.call(embedded, key))))
                return unknownMoney("INCOMPLETE_NESTED_EVIDENCE");
        }
        const parsed = z.array(rowSchema).safeParse(response.data);
        if (!parsed.success)
            return unknownMoney("INVALID_FINANCIAL_RESPONSE");
        if (new Set(parsed.data.map(row => row.id)).size !== parsed.data.length)
            return unknownMoney("INVALID_FINANCIAL_RESPONSE");
        // Validate ALL witness shapes before returning HELD; no partial parse may claim completeness.
        const rows = [];
        for (const row of parsed.data) {
            const transactionRefund = witness(row.transaction_witness, "transaction_id", row.id);
            const appointmentRefund = row.appointment ? witness(row.appointment.appointment_witness, "appointment_id", row.appointment.id) : false;
            if (transactionRefund === null || appointmentRefund === null)
                return unknownMoney("INVALID_REFUND_WITNESS");
            const { transaction_witness: discarded, appointment: ap, ...rest } = row;
            void discarded;
            const cleanAppointment = ap ? (({ appointment_witness: discardedAppointment, ...clean }) => { void discardedAppointment; return clean; })(ap) : null;
            rows.push({ ...rest, appointment: cleanAppointment, hasRefundContradiction: transactionRefund || appointmentRefund });
        }
        const buckets = new Map<string, FinancialBucket>();
        for (const row of rows) {
            if (Date.parse(row.occurred_at) < Date.parse(period.from) || Date.parse(row.occurred_at) >= Date.parse(period.to))
                return unknownMoney("INVALID_FINANCIAL_RESPONSE");
            if (row.business_id !== authority.businessId || !row.customer || row.customer.id !== row.customer_id || row.customer.business_id !== authority.businessId || (input.data.customerId && row.customer_id !== input.data.customerId))
                return heldMoney("IDENTITY_INCONSISTENT");
            const ap = row.appointment;
            const at = row.attempt;
            if ((row.appointment_id === null) !== (ap === null) || (ap && (ap.id !== row.appointment_id || ap.business_id !== authority.businessId || ap.customer_id !== row.customer_id)))
                return heldMoney("IDENTITY_INCONSISTENT");
            if ((row.payment_attempt_id === null) !== (at === null) || (at && (at.id !== row.payment_attempt_id || at.business_id !== authority.businessId || at.customer_id !== row.customer_id || at.appointment_id !== row.appointment_id || at.payment_kind !== row.kind || at.amount_cents !== row.amount_cents || at.currency !== row.currency || at.method !== row.method || at.provider_route !== row.provider)))
                return heldMoney("IDENTITY_INCONSISTENT");
            if (ap && (!Number.isSafeInteger(ap.amount_refunded_cents) || Number(ap.amount_refunded_cents) < 0))
                return heldMoney("REFUND_EVIDENCE_INCONSISTENT");
            if (row.hasRefundContradiction || (ap && Number(ap.amount_refunded_cents) > 0))
                return heldMoney("REFUND_EVIDENCE_INCONSISTENT");
            if (row.provider !== "manual" || (typeof row.kind !== "string" || !["payment", "deposit"].includes(row.kind)) || (typeof row.method !== "string" || !["cash", "e_transfer", "debit_card", "credit_card", "other"].includes(row.method)) || typeof row.amount_cents !== "number" || !Number.isSafeInteger(row.amount_cents) || row.amount_cents <= 0 || !isFinancialCurrency(row.currency))
                return heldMoney("UNSUPPORTED_FINANCIAL_EVIDENCE");
            if (row.status === "failed" || row.status === "canceled") {
                if (at && at.execution_state !== "FAILED")
                    return heldMoney("IDENTITY_INCONSISTENT");
                continue;
            }
            if (row.status !== "succeeded" || (at && at.execution_state !== "ACCEPTED"))
                return heldMoney("UNSUPPORTED_FINANCIAL_EVIDENCE");
            if (input.data.locationId) {
                if (!ap || !ap.location_id || !ap.current_location || ap.current_location.id !== ap.location_id || ap.current_location.business_id !== authority.businessId)
                    return heldMoney("CURRENT_LOCATION_UNPROVEN");
                if (ap.location_id !== input.data.locationId)
                    continue;
            }
            const bucket = buckets.get(row.currency) ?? { currency: row.currency, collectedCents: 0, paymentCents: 0, depositCents: 0, paymentCount: 0 };
            if (!Number.isSafeInteger(bucket.collectedCents + row.amount_cents))
                return heldMoney("AMOUNT_OVERFLOW");
            bucket.collectedCents += row.amount_cents;
            bucket.paymentCount += 1;
            if (row.kind === "deposit")
                bucket.depositCents += row.amount_cents;
            else
                bucket.paymentCents += row.amount_cents;
            buckets.set(row.currency, bucket);
        }
        if (!buckets.size)
            buckets.set(authority.currency, { currency: authority.currency, collectedCents: 0, paymentCents: 0, depositCents: 0, paymentCount: 0 });
        return { state: "EXACT", period, scope: input.data.locationId ? "CURRENT_APPOINTMENT_LOCATION" : "BUSINESS", buckets: [...buckets.values()].sort((a, b) => a.currency.localeCompare(b.currency)) };
    }
    catch {
        return unknownMoney();
    }
}
