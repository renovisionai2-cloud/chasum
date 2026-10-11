// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ aggregate: vi.fn(), crmClient: vi.fn() }));
vi.mock("@/lib/actions/business", () => ({ requireBusiness: async () => ({ id: "authorized", name: "Synthetic", currency: "cad" }) }));
vi.mock("@/lib/commerce/financial-aggregate/reader", () => ({ readFinancialAggregate: mocks.aggregate }));
vi.mock("@/lib/commerce/payments", () => ({ getActiveProviderSummary: () => ({ active: "manual", stripeConfigured: false }), listTransactions: async () => [{ amountCents: 999999, status: "succeeded", kind: "payment" }] }));
vi.mock("@/lib/commerce/invoices", () => ({ listInvoices: async () => [] }));
vi.mock("@/lib/commerce/refunds", () => ({ listRefunds: async () => [] }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.crmClient }));
vi.mock("@/lib/crm/service", () => ({ loadCrmProfile: vi.fn() }));
import { getChaseCrmAnalytics } from "@/lib/crm/ai-knowledge";
import { getCommerceDashboardSnapshot } from "@/lib/commerce/dashboard";
import { buildExecutive, buildFinancial, buildEmployeeReports, buildCustomerReport, buildLocationReports, rowsToCsv, type ReportAppointmentRow } from "@/lib/reports/compute";
import { appointmentRecognizedCents } from "@/lib/commerce/recognize";
import { financialAmountText, unknownMoney, type FinancialAmount } from "@/lib/commerce/financial-aggregate/types";
import { chaseHintsFromInsights } from "@/lib/crm/chase-hints";
import type { CrmInsights } from "@/lib/crm/types";
const now = new Date("2032-03-14T12:00:00Z");
const exact: FinancialAmount = { state: "EXACT", cents: 5000, currency: "cad" };
const appt: ReportAppointmentRow = { id: "appt", status: "completed", price_cents: 10000, amount_paid_cents: 50, start_time: "2032-03-14T10:00:00Z", end_time: "2032-03-14T11:00:00Z", location_id: "location", staff_id: "staff", customer_id: "customer", service_id: "service", service: { price: 150 } };
it.each(["EXACT", "HELD", "UNKNOWN"] as const)("Commerce passes canonical %s through, never sums recent lists", async (state) => {
    mocks.aggregate.mockResolvedValue(state === "EXACT" ? { state, buckets: [{ collectedCents: 5000, currency: "cad" }] } : { state, reason: "TEST" });
    const result = await getCommerceDashboardSnapshot("authorized", "Synthetic");
    expect(result.revenueTodayCents).toEqual(state === "EXACT" ? exact : { state, reason: "TEST" });
    expect(result.averageCustomerValueCents.state).toBe("UNKNOWN");
    expect(result.outstandingDepositsCents.state).toBe("UNKNOWN");
});
it("dashboard caller cannot replace authorized Business", async () => await expect(getCommerceDashboardSnapshot("foreign", "Foreign")).rejects.toThrow("Not authorized"));
it("Reports keep operational metrics while financial totals are held", () => {
    const held = { state: "HELD" as const, reason: "REFUND_EVIDENCE_INCONSISTENT" };
    const result = buildExecutive({ now, appointments: [appt], customers: [], activeEmployees: 1, outstandingInvoicesCents: 9999, giftCardRevenueCents: 9999, membershipRevenueCents: 9999, collected: { today: held, week: exact, month: held, year: exact } });
    expect(result.revenueToday).toEqual(held);
    expect(result.appointmentsToday).toBe(1);
    expect(result.activeEmployees).toBe(1);
    expect(result.membershipRevenueCents.state).toBe("UNKNOWN");
    expect(result.giftCardRevenueCents.state).toBe("UNKNOWN");
});
it("CRM mirror cannot create or erase canonical payments and source classes remain explicit", () => {
    for (const events of [[], [{ amount_cents: 999999, status: "paid", occurred_at: now.toISOString(), customer_id: "customer" }]]) {
        const result = buildFinancial([appt], events, now, exact);
        expect(result.paymentsCents).toEqual(exact);
        expect(result.invoicesCents).toEqual(unknownMoney("LEGACY_APPOINTMENT_RECOGNIZED_VALUE"));
        expect(result.refundsCents.state).toBe("UNKNOWN");
        expect(result.depositsCents.state).toBe("UNKNOWN");
        expect(result.taxesCents.state).toBe("UNKNOWN");
        expect(result.discountsCents.state).toBe("UNKNOWN");
    }
});
it("CSV and print financial values preserve explicit state and currency", () => {
    const csv = rowsToCsv(["Metric", "Value"], [["Collected", financialAmountText(exact)], ["Refunds", financialAmountText({ state: "HELD", reason: "REVIEW" })], ["Balance", financialAmountText(unknownMoney())]]);
    expect(csv).toContain("50.00");
    expect(csv).toContain("Held");
    expect(csv).toContain("Unknown");
    expect(csv).not.toContain("NaN");
    const actions = readFileSync("lib/actions/reports.ts", "utf8");
    expect(actions).toContain("financialAmountText(e.revenueToday)");
    expect(actions).toContain("bundle.financialScope");
    const print = readFileSync("components/reports/reports-hub.tsx", "utf8");
    expect(print).toContain("financialAmountText");
    expect(print).toContain("bundle.financialScope");
});
describe("E1-B completed operational service value", () => {
    it.each([
        ["confirmed", 10000, 10000, 0], ["completed", 10000, 50, 10000], ["completed", 2500, 0, 2500], ["completed", null, 0, 15000], ["completed", 0, 0, 15000],
    ])("status %s price %s paid %s => operational %s", (status, price_cents, amount_paid_cents, expected) => expect(appointmentRecognizedCents({ status, price_cents, amount_paid_cents, service: { price: 150 } })).toBe(expected));
    it("commission is not configured even with historical rate; completed is actual count", () => {
        const [result] = buildEmployeeReports([appt, { ...appt, id: "paid-pending", status: "confirmed", amount_paid_cents: 10000 }], [{ id: "staff", name: "Synthetic", commission_rate_bps: 2000 }], now);
        expect(result).toMatchObject({ revenue: 100, completed: 1, commissionCents: null, productivity: 2 });
        const ui = readFileSync("components/employees/employee-performance.tsx", "utf8");
        expect(ui).toContain('title="Completed service value"');
        expect(ui).not.toContain("Lifetime revenue");
    });
});
it("CRM lifetime unknown, frequent visits retained, Location amount not guessed", () => {
    const result = buildCustomerReport([], [appt], [], now);
    expect(result.lifetimeValueAvg.state).toBe("UNKNOWN");
    expect(result.topCustomers[0].value).toBe(1);
    const [loc] = buildLocationReports([appt], [{ id: "location", name: "Synthetic" }], new Map(), now);
    expect(loc.appointments).toBe(1);
    expect(loc.revenue.state).toBe("UNKNOWN");
    const hints = chaseHintsFromInsights({ lifetimeRevenue: unknownMoney(), upcomingCount: 0, completedAppointments: 5, lastVisit: null, noShowRate: 0 } as CrmInsights);
    expect(hints).toContain("Repeat guest without a next booking — good follow-up candidate.");
    expect(hints.join()).not.toContain("High-value");
    const source = readFileSync("lib/crm/ai-knowledge.ts", "utf8");
    expect(source).toContain("if (visits >= 5)");
    expect(source).not.toContain("spend >= 200");
    expect(source).toContain('averageLifetimeSpend: unknownMoney');
});
it("retained cache summaries disclose limitations; fresh writers are not wired here", () => {
    expect(readFileSync("components/booking-sheet/payments-section.tsx", "utf8")).toContain("not canonical collected money");
    expect(readFileSync("components/day-view/appointment-drawer.tsx", "utf8")).toContain("canonical collection may be unsynchronized");
    expect(readFileSync("lib/commerce/operator-financial-state.ts", "utf8")).not.toMatch(/\.rpc\(|commitBookingOperation|runPaymentProjection|sendEmail/);
});

it("CRM analytics retains frequent-visit metrics without service-price money thresholds", async () => {
  const customers = [{ id: "frequent", name: "Synthetic frequent", crm_status: "active" }, { id: "expensive", name: "Synthetic expensive", crm_status: "active" }];
  const appointments = [...Array.from({ length: 5 }, (_, i) => ({ id: String(i), customer_id: "frequent", status: "completed", start_time: "2030-01-01T12:00:00Z", service: { price: 0 } })), { id: "6", customer_id: "expensive", status: "completed", start_time: "2030-01-01T12:00:00Z", service: { price: 999999 } }];
  mocks.crmClient.mockResolvedValue({ from: (table: string) => {
    const q = { select: () => q, eq: () => q, neq: () => q, limit: async () => ({ data: table === "customers" ? customers : appointments, error: null }) };
    return q;
  } });
  const result = await getChaseCrmAnalytics("authorized");
  expect(result.highValue.map(c => c.id)).toEqual(["frequent"]);
  expect(result.highValue[0].lifetimeSpend.state).toBe("UNKNOWN");
  expect(result.retention).toMatchObject({ activeCustomers: 2, repeatBookingRate: 50, averageLifetimeSpend: { state: "UNKNOWN" } });
});
