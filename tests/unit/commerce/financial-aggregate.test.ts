// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
vi.mock("server-only", () => ({}));
const mocked = vi.hoisted(() => ({ user: vi.fn(), business: vi.fn(), service: vi.fn() }));
vi.mock("@/lib/actions/business", () => ({ requireUser: mocked.user, requireBusiness: mocked.business }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: mocked.service }));
import { readFinancialAggregate, FINANCIAL_ROW_BOUND, type FinancialReaderDependencies } from "@/lib/commerce/financial-aggregate/reader";
import { singleFinancialAmount, financialAmountText } from "@/lib/commerce/financial-aggregate/types";
import { financialPeriod } from "@/lib/commerce/financial-period";
const uid = (n: number) => `a1332000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const businessId = uid(1), customerId = uid(2), actorId = uid(3), locationId = uid(4);
const authority = { businessId, actorId, currency: "cad", timezone: "America/Toronto" };
const now = new Date("2032-03-14T15:00:00Z");
function row(overrides: Record<string, unknown> = {}) {
    return { id: uid(10), business_id: businessId, customer_id: customerId, appointment_id: null, payment_attempt_id: null,
        occurred_at: "2032-03-14T12:00:00Z", amount_cents: 2500, currency: "cad", status: "succeeded", provider: "manual", kind: "payment", method: "cash",
        customer: { id: customerId, business_id: businessId }, appointment: null, attempt: null, transaction_witness: [], ...overrides };
}
function bound(overrides: Record<string, unknown> = {}) {
    return row({ appointment_id: uid(20), payment_attempt_id: uid(30),
        appointment: { id: uid(20), business_id: businessId, customer_id: customerId, location_id: locationId, amount_refunded_cents: 0,
            current_location: { id: locationId, business_id: businessId }, appointment_witness: [] },
        attempt: { id: uid(30), business_id: businessId, customer_id: customerId, appointment_id: uid(20), execution_state: "ACCEPTED", amount_cents: 2500, currency: "cad", payment_kind: "payment", method: "cash", provider_route: "manual" }, ...overrides });
}
function dependencies(data: unknown = [row()], count: number | null = Array.isArray(data) ? data.length : null, error: unknown = null): FinancialReaderDependencies {
    return { resolveAuthority: vi.fn(async () => authority), now: () => now, read: vi.fn(async () => ({ data, count, error })) };
}
const read = (data: unknown, request = { period: "today" as const }, count?: number | null) => readFinancialAggregate(request, dependencies(data, count === undefined && Array.isArray(data) ? data.length : count ?? null));
describe("canonical closed-world collected money", () => {
    it.each(["cash", "e_transfer", "debit_card", "credit_card", "other"])("exact manual %s payments and deposits", async (method) => {
        for (const kind of ["payment", "deposit"]) {
            expect(await read([row({ method, kind })])).toMatchObject({ state: "EXACT", buckets: [{ collectedCents: 2500, paymentCount: 1, depositCents: kind === "deposit" ? 2500 : 0 }] });
        }
    });
    it.each(["cad", "usd", "gbp", "eur", "aud"])("keeps raw %s currency", async (currency) => expect(await read([row({ currency })])).toMatchObject({ state: "EXACT", buckets: [{ currency }] }));
    it("complete empty is real zero", async () => expect(singleFinancialAmount(await read([]))).toEqual({ state: "EXACT", cents: 0, currency: "cad" }));
    it("separates currencies, single-value consumer holds", async () => {
        const result = await read([row(), row({ id: uid(11), currency: "usd" })]);
        expect(result).toMatchObject({ state: "EXACT", buckets: [{ currency: "cad" }, { currency: "usd" }] });
        expect(singleFinancialAmount(result)).toEqual({ state: "HELD", reason: "MULTIPLE_CURRENCIES" });
    });
    it.each([
        ["status", "pending"], ["status", "requires_action"], ["status", "refunded"], ["status", "partially_refunded"], ["status", "new_status"], ["status", null],
        ["provider", "stripe"], ["provider", null], ["kind", "refund"], ["kind", "void"], ["kind", "adjustment"], ["kind", "gift_card"], ["kind", "store_credit"],
        ["method", "gift_card"], ["method", "store_credit"], ["amount_cents", 0], ["amount_cents", -1], ["amount_cents", 1.5], ["amount_cents", "2500"], ["amount_cents", Number.MAX_SAFE_INTEGER + 1],
        ["currency", "CAD"], ["currency", " cad"], ["currency", "zzz"], ["currency", null], ["business_id", uid(999)], ["customer_id", uid(999)],
    ])("holds unsupported %s=%s", async (key, value) => expect(await read([row({ [key]: value })])).toMatchObject({ state: "HELD" }));
    it("safe integer overflow holds", async () => expect(await read([row({ amount_cents: Number.MAX_SAFE_INTEGER }), row({ id: uid(11) })])).toMatchObject({ state: "HELD", reason: "AMOUNT_OVERFLOW" }));
    it.each(["failed", "canceled"])("excludes coherent %s only", async (status) => {
        expect(singleFinancialAmount(await read([row({ status })]))).toMatchObject({ state: "EXACT", cents: 0 });
        expect(await read([bound({ status })])).toMatchObject({ state: "HELD" });
        expect(await read([row({ status, currency: "bad" })])).toMatchObject({ state: "HELD" });
    });
    it("validates all applicable attempt identities and money", async () => {
        expect(await read([bound()])).toMatchObject({ state: "EXACT" });
        for (const [key, value] of Object.entries({ business_id: uid(900), id: uid(901), customer_id: uid(902), appointment_id: uid(903), amount_cents: 1, currency: "usd", payment_kind: "deposit", method: "other", provider_route: "stripe", execution_state: "REQUESTED" })) {
            const b = bound();
            expect(await read([{ ...b, attempt: { ...b.attempt, [key]: value } }])).toMatchObject({ state: "HELD" });
        }
    });
});
describe("I1 refund witness C1–C6", () => {
    it("same-business and malformed cross-business refunds have identical generic one-bit results", async () => {
        // Both DB fixtures necessarily serialize to this exact join-key-only representation.
        const result = await read([row({ transaction_witness: [{ transaction_id: uid(10) }] })]);
        expect(result).toEqual({ state: "HELD", reason: "REFUND_EVIDENCE_INCONSISTENT" });
        expect(JSON.stringify(result)).not.toContain(uid(10));
    });
    it("appointment-only witness independently vetoes", async () => {
        const b = bound();
        expect(await read([{ ...b, appointment: { ...b.appointment, appointment_witness: [{ appointment_id: uid(20) }] } }])).toEqual({ state: "HELD", reason: "REFUND_EVIDENCE_INCONSISTENT" });
    });
    it.each([undefined, null, {}, "bad", [{ transaction_id: uid(999) }], [{ transaction_id: uid(10), business_id: "FOREIGN_SECRET" }], [{ transaction_id: uid(10) }, { transaction_id: uid(10) }], [{}]])("unknown for malformed transaction witness %#", async (transaction_witness) => {
        const result = await read([row({ transaction_witness })]);
        expect(result.state).toBe("UNKNOWN");
        expect(JSON.stringify(result)).not.toContain("FOREIGN_SECRET");
    });
    it.each([undefined, null, {}, [{ appointment_id: uid(999) }], [{ appointment_id: uid(20), amount_cents: 123 }]])("unknown for malformed appointment witness %#", async (appointment_witness) => {
        const b = bound();
        expect((await read([{ ...b, appointment: { ...b.appointment, appointment_witness } }])).state).toBe("UNKNOWN");
    });
    it("omission is not absence", async () => { const b: Record<string, unknown> = row(); delete b.transaction_witness; expect((await read([b])).state).toBe("UNKNOWN"); });
    it("all witness shapes are parsed before any HELD", async () => expect((await read([row({ status: "pending" }), row({ id: uid(11), transaction_witness: null })])).state).toBe("UNKNOWN"));
    it.each([null, 0, 2, -1, 1.5])("unknown count %s", async (count) => expect((await read([row()], undefined, count)).state).toBe("UNKNOWN"));
    it("errors, partial body, duplicates and cap overflow cannot be exact", async () => {
        expect((await readFinancialAggregate({ period: "today" }, dependencies([row()], 1, { message: "PRIVATE" }))).state).toBe("UNKNOWN");
        expect((await read({})).state).toBe("UNKNOWN");
        expect((await read([row(), row()])).state).toBe("UNKNOWN");
        expect((await read(Array.from({ length: FINANCIAL_ROW_BOUND + 1 }, (_, i) => row({ id: uid(1000 + i) })))).state).toBe("UNKNOWN");
    });
    it("appointment refunded cache is veto evidence only", async () => {
        const b = bound();
        expect(await read([{ ...b, appointment: { ...b.appointment, amount_refunded_cents: 1 } }])).toEqual({ state: "HELD", reason: "REFUND_EVIDENCE_INCONSISTENT" });
    });
});
describe("B2 authority and current Location", () => {
    it("hostile root/row IDs fail before privileged I/O", async () => {
        for (const key of ["businessId", "business_id", "transactionId", "refundId", "appointmentId"]) {
            const deps = dependencies();
            expect((await readFinancialAggregate({ period: "today", [key]: uid(999) }, deps)).state).toBe("UNKNOWN");
            expect(deps.read).not.toHaveBeenCalled();
        }
    });
    it("missing actor/Business and invalid time authority fail closed", async () => {
        for (const patch of [{ businessId: "" }, { actorId: "" }, { timezone: "Invalid/Timezone" }, { timezone: "" }]) {
            const deps = dependencies();
            deps.resolveAuthority = async () => ({ ...authority, ...patch });
            expect((await readFinancialAggregate({ period: "today" }, deps)).state).toBe("UNKNOWN");
            expect(deps.read).not.toHaveBeenCalled();
        }
    });
    it("Business unbound exact, Location unbound HELD; no fallback", async () => {
        expect((await read([row()])).state).toBe("EXACT");
        expect((await readFinancialAggregate({ period: "today", locationId }, dependencies([row()]))).state).toBe("HELD");
    });
    it("current Location valid, foreign/missing identity HELD, coherent other Location excluded", async () => {
        expect(await readFinancialAggregate({ period: "today", locationId }, dependencies([bound()]))).toMatchObject({ state: "EXACT", scope: "CURRENT_APPOINTMENT_LOCATION" });
        for (const appointment of [null, { ...bound().appointment, business_id: uid(999) }, { ...bound().appointment, current_location: null }, { ...bound().appointment, current_location: { id: locationId, business_id: uid(999) } }]) {
            expect((await readFinancialAggregate({ period: "today", locationId }, dependencies([bound({ appointment })]))).state).toBe("HELD");
        }
        const result = await readFinancialAggregate({ period: "today", locationId: uid(5) }, dependencies([bound()]));
        expect(singleFinancialAmount(result)).toMatchObject({ state: "EXACT", cents: 0 });
    });
});
describe("financial civil period", () => {
    it.each([["2032-03-14T15:00:00Z", 23], ["2032-11-07T15:00:00Z", 25]])("DST day %s has %s hours", (at, hours) => {
        const p = financialPeriod("today", "America/Toronto", new Date(at));
        expect((Date.parse(p.to) - Date.parse(p.from)) / 3600000).toBe(hours);
    });
    it("from included, to excluded; appointment start is irrelevant", async () => {
        const p = financialPeriod("today", authority.timezone, now);
        expect((await read([row({ occurred_at: p.from })])).state).toBe("EXACT");
        expect((await read([row({ occurred_at: p.to })])).state).toBe("UNKNOWN"); // returned out-of-filter data is a protocol violation
        expect((await read([bound({ appointment: { ...bound().appointment, start_time: "2099-01-01T00:00:00Z" } })])).state).toBe("EXACT");
    });
});
it("actual Supabase builder produces one bounded FK-hinted GET with tenant filters, both limits and exact count", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify([row()]), { status: 200, headers: { "content-type": "application/json", "content-range": "0-0/1" } }));
    mocked.user.mockResolvedValue({ id: actorId });
    mocked.business.mockResolvedValue({ id: businessId, timezone: authority.timezone, currency: "cad" });
    mocked.service.mockReturnValue(createClient("http://127.0.0.1:12345", "local-fictional-key", { global: { fetch: fetcher }, auth: { persistSession: false, autoRefreshToken: false } }));
    // Fixed wall clock, actual HTTP serializer, no network invocation.
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
        expect((await readFinancialAggregate({ period: "today" })).state).toBe("EXACT");
        expect(fetcher).toHaveBeenCalledTimes(1);
        const [url, options] = fetcher.mock.calls[0] as unknown as [
            Request,
            RequestInit
        ];
        const params = new URL(String(url)).searchParams;
        expect(params.get("business_id")).toBe(`eq.${businessId}`);
        expect(params.get("transaction_witness.limit")).toBe("1");
        expect(params.get("appointment.appointment_witness.limit")).toBe("1");
        expect(params.getAll("occurred_at")).toEqual(["gte.2032-03-14T05:00:00.000Z", "lt.2032-03-15T04:00:00.000Z"]);
        expect(new Headers(options.headers).get("prefer")).toContain("count=exact");
        for (const hint of ["commerce_refunds_transaction_id_fkey", "commerce_refunds_appointment_id_fkey", "commerce_transactions_appt_business_customer_financial_fk", "appointments_location_id_fkey", "commerce_transactions_attempt_business_fk"])
            expect(params.get("select")).toContain(hint);
        expect(params.get("select")).not.toMatch(/!inner|count\(/);
        expect(params.get("select")).toContain("commerce_refunds_transaction_id_fkey(transaction_id)");
        expect(params.get("select")).toContain("commerce_refunds_appointment_id_fkey(appointment_id)");
        expect(financialAmountText(singleFinancialAmount(await read([row({ transaction_witness: [{ transaction_id: uid(10) }] })])))).toContain("Held");
    }
    finally {
        vi.useRealTimers();
    }
});
it("incomplete nested financial evidence is UNKNOWN rather than a default value", async () => {
    for (const key of ["amount_refunded_cents", "appointment_witness", "current_location"]) {
        const b = bound();
        const ap: Record<string, unknown> = { ...b.appointment };
        delete ap[key];
        expect((await read([{ ...b, appointment: ap }])).state).toBe("UNKNOWN");
    }
    for (const key of ["amount_cents", "execution_state", "currency"]) {
        const b = bound();
        const at: Record<string, unknown> = { ...b.attempt };
        delete at[key];
        expect((await read([{ ...b, attempt: at }])).state).toBe("UNKNOWN");
    }
});
it("customer payload is tenant bound even when the root transaction is valid", async () => {
    expect(await read([row({ customer: { id: customerId, business_id: uid(999) } })])).toMatchObject({ state: "HELD", reason: "IDENTITY_INCONSISTENT" });
});

it.each([["kind", ["payment"]], ["method", ["cash"]]])("does not coerce malformed %s into supported text", async (key, value) => {
  expect(await read([row({ [String(key)]: value })])).toMatchObject({ state: "HELD" });
});
