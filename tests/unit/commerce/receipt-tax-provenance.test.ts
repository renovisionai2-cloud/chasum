import { beforeEach, expect, it, vi } from "vitest";
import { buildReceiptEmailContext } from "@/lib/commerce/receipts";
import { renderEmailTemplate } from "@/lib/communications/templates";

const db = vi.hoisted(() => ({ rows: {} as Record<string, Record<string, unknown>[]>, reads: [] as string[] }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  from(table: string) {
    db.reads.push(table);
    const predicates: Array<[string, unknown]> = [];
    const matching = () => (db.rows[table] ?? []).filter((row) => predicates.every(([key, value]) => row[key] === value));
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { predicates.push([key, value]); return query; },
      maybeSingle: async () => ({ data: matching()[0] ?? null, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: matching(), error: null }).then(resolve),
    };
    return query;
  },
}) }));

beforeEach(() => {
  db.reads.length = 0;
  db.rows = {
    commerce_receipts: [{ id: "receipt-a", business_id: "tenant-a", transaction_id: "tx-a", customer_id: "customer-a", amount_cents: 5000, method: "cash", receipt_number: "SYNTHETIC-1" }],
    commerce_transactions: [{ id: "tx-a", business_id: "tenant-a", customer_id: "customer-a", appointment_id: "appt-a", kind: "deposit", amount_cents: 5000, currency: "CAD", status: "succeeded", method: "cash" }],
    appointments: [{ id: "appt-a", business_id: "tenant-a", start_time: "2026-11-09T15:00:00Z", price_cents: 11600, tax_cents: 15, deposit_cents: 5000, amount_paid_cents: 5000, amount_refunded_cents: 0, payment_status: "deposit_paid", services: { name: "Synthetic service" } }],
    customers: [{ id: "customer-a", name: "Synthetic customer", email: "customer@example.invalid" }],
    businesses: [{ id: "tenant-a", name: "Synthetic studio", timezone: "America/Toronto" }],
    tax_rates: [{ business_id: "tenant-a", name: "CURRENT HST", rate_bps: 1300, is_default: true, is_active: true }],
  };
});

it.each([
  { tax: 15, activeDefault: true },
  { tax: 1508, activeDefault: true },
  { tax: 15, activeDefault: false },
])("preserves historical cents without deriving rate/name provenance: %j", async ({ tax, activeDefault }) => {
  db.rows.appointments[0].tax_cents = tax;
  if (!activeDefault) db.rows.tax_rates = [];
  const before = JSON.stringify(db.rows);
  const result = await buildReceiptEmailContext({ businessId: "tenant-a", receiptId: "receipt-a", expectedAppointmentId: "appt-a" });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  expect(result.context).toMatchObject({ amountCents: 5000, subtotalCents: 11600, taxCents: tax, appointmentTotalCents: 11600 + tax, depositRequiredCents: 5000, depositPaidCents: 5000, remainingBalanceCents: 6600 + tax, taxRateBps: null, taxLabel: null });
  const rendered = renderEmailTemplate("commerce.receipt", result.context);
  expect(rendered.html).toContain(tax === 15 ? "$0.15" : "$15.08");
  expect(rendered.html).toContain(tax === 15 ? "$116.15" : "$131.08");
  expect(rendered.html).toContain("$50.00");
  expect(rendered.html + rendered.text).not.toMatch(/CURRENT HST|\(13%\)|\(0\.13%\)|Financial review|not verified/);
  expect(db.reads).not.toContain("tax_rates");
  expect(JSON.stringify(db.rows)).toBe(before);
});

it("keeps missing stored subtotal/total unknown instead of borrowing catalog amounts", async () => {
  db.rows.appointments[0].price_cents = null;
  const result = await buildReceiptEmailContext({ businessId: "tenant-a", receiptId: "receipt-a" });
  expect(result.ok && result.context).toMatchObject({ amountCents: 5000, subtotalCents: null, appointmentTotalCents: null, taxRateBps: null, taxLabel: null });
});

it("refuses a different tenant's receipt before reading its transaction", async () => {
  const result = await buildReceiptEmailContext({ businessId: "tenant-b", receiptId: "receipt-a" });
  expect(result.ok).toBe(false);
  expect(db.reads).toEqual(["commerce_receipts"]);
});
