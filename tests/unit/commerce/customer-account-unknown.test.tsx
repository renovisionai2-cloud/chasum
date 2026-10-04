import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@/lib/supabase/errors", () => ({ logQueryError: mocks.log, isSoftSchemaFallbackAllowed: () => false }));
vi.mock("@/lib/commerce/receipts", () => ({ listReceipts: async () => [] }));
vi.mock("@/lib/commerce/refunds", () => ({ listRefunds: async () => [] }));
vi.mock("@/lib/commerce/gift-cards", () => ({ listActiveGiftCardsForCustomer: async () => [] }));
vi.mock("@/lib/actions/commerce", () => ({ recordPaymentAction: vi.fn(), downloadInvoiceTextAction: vi.fn(), downloadReceiptTextAction: vi.fn(), queueReceiptEmailAction: vi.fn() }));
import { getCustomerCommerceAccount, getSummerCommerceSnapshot } from "@/lib/commerce/customer-account";
import { CustomerCommercePanel } from "@/components/commerce/customer-commerce-panel";

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
const sourceTables = ["appointments", "commerce_invoices", "commerce_transactions"] as const;
type SourceTable = typeof sourceTables[number];
function setup(options: { mismatch?: boolean; ledgerMismatch?: boolean; unavailable?: SourceTable; truncated?: SourceTable; missingCount?: SourceTable; missingData?: SourceTable; throws?: SourceTable; empty?: boolean; invoiceCount?: number; transactionCount?: number } = {}) {
  const reads: { table: string; filters: [string, unknown][]; selectOptions?: unknown }[] = [];
  mocks.client.mockResolvedValue({ from: (table: string) => {
    const read: typeof reads[number] = { table, filters: [] }; reads.push(read);
    const data = table === "customers" ? { id: "customer", store_credit_cents: 0 }
      : options.empty ? [] : table === "commerce_invoices"
        ? Array.from({ length: options.invoiceCount ?? 1 }, (_, i) => ({ id: `inv-${i}`, invoice_number: `INV-${i}`, status: "partial", balance_cents: i === 0 ? options.mismatch ? 1000 : 500 : 0 }))
        : table === "commerce_transactions"
          ? Array.from({ length: options.transactionCount ?? 1 }, (_, i) => ({ id: `tx-${i}`, status: "succeeded", kind: "deposit", method: "cash", amount_cents: i === 0 ? options.ledgerMismatch ? 0 : 500 : 0, occurred_at: "2026-10-04T12:00:00Z", created_at: "2026-10-04T12:00:00Z" }))
        : [{ price_cents: 1000, deposit_cents: 500, amount_paid_cents: 500, amount_refunded_cents: 0 }];
    const count = Array.isArray(data) ? data.length : null;
    const result = options.unavailable === table
      ? { data: null, error: { message: "Synthetic source read failure" }, count: null }
      : { data: options.missingData === table ? null : data, error: null, count: options.missingCount === table ? null : options.truncated === table ? (count ?? 0) + 1 : count };
    const q = { select: (_columns: string, selectOptions?: unknown) => { read.selectOptions = selectOptions; return q; }, eq: (key: string, value: unknown) => { read.filters.push([key, value]); return q; }, neq: () => q, order: () => q, limit: () => q, maybeSingle: async () => result, then: (resolve: (v: unknown) => unknown, reject: (error: unknown) => unknown) => (options.throws === table ? Promise.reject(new Error("Synthetic source throw")) : Promise.resolve(result)).then(resolve, reject) };
    return q;
  } });
  return reads;
}
const summary = (label: string) => screen.getByText(label).parentElement!;
describe("Option A customer-account disclosure", () => {
  it("matching sources preserve numeric outstanding/remaining across account, panel and Summer", async () => {
    const reads = setup();
    const account = await getCustomerCommerceAccount("biz", "customer");
    expect(account).toMatchObject({ outstandingBalanceCents: 500, remainingBalanceCents: 500, financialStatus: "unknown", totalPaidCents: null, depositsCents: null, lifetimeSpendCents: null });
    expect(await getSummerCommerceSnapshot("biz", "customer")).toMatchObject({ outstandingBalanceCents: 500, remainingBalanceCents: 500, lifetimeSpendCents: null, depositsCents: null });
    render(<CustomerCommercePanel customerId="customer" account={account} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getAllByText("Unknown")).toHaveLength(2);
    expect(summary("Outstanding balance")).toHaveTextContent("$5");
    expect(summary("Remaining balance")).toHaveTextContent("$5");
    for (const read of reads.filter(r => r.table !== "customers")) {
      expect(read.filters).toEqual(expect.arrayContaining([["business_id", "biz"], ["customer_id", "customer"]]));
      expect(read.selectOptions).toEqual({ count: "exact" });
    }
  });
  it("disagreement renders Unknown with review banner without null-to-zero coercion", async () => {
    setup({ mismatch: true });
    const account = await getCustomerCommerceAccount("biz", "customer");
    expect(account).toMatchObject({ outstandingBalanceCents: null, remainingBalanceCents: null, financialStatus: "source_disagreement" });
    render(<CustomerCommercePanel customerId="customer" account={account} />);
    expect(screen.getAllByText("Unknown")).toHaveLength(4);
    expect(screen.getByRole("status")).toHaveTextContent("Account totals need review");
    expect(summary("Outstanding balance")).not.toHaveTextContent("$0.00");
    expect(summary("Remaining balance")).not.toHaveTextContent("$0.00");
    expect(await getSummerCommerceSnapshot("biz", "customer")).toMatchObject({ outstandingBalanceCents: null, remainingBalanceCents: null });
  });
  it.each(sourceTables)("unavailable %s cannot invent agreement or disagreement", async unavailable => {
    setup({ unavailable });
    const account = await getCustomerCommerceAccount("biz", "customer");
    expect(account).toMatchObject({ outstandingBalanceCents: null, remainingBalanceCents: null, financialStatus: "unknown", totalPaidCents: null, depositsCents: null });
    render(<CustomerCommercePanel customerId="customer" account={account} />);
    expect(screen.getAllByText("Unknown")).toHaveLength(4);
    expect(screen.getByRole("status")).toHaveTextContent("Account totals need review");
    expect(mocks.log).toHaveBeenCalled();
  });
  it("matched empty current sources may state zero but not lifetime totals", async () => {
    setup({ empty: true });
    expect(await getCustomerCommerceAccount("biz", "customer")).toMatchObject({ outstandingBalanceCents: 0, remainingBalanceCents: 0, totalPaidCents: null, depositsCents: null, lifetimeSpendCents: null });
  });
  it.each(sourceTables)("truncated %s cannot prove a current balance even when returned rows agree", async truncated => {
    setup({ truncated, invoiceCount: 40, transactionCount: 60 });
    const account = await getCustomerCommerceAccount("biz", "customer");
    expect(account).toMatchObject({ totalPaidCents: null, lifetimeSpendCents: null, depositsCents: null, outstandingBalanceCents: null, remainingBalanceCents: null, financialStatus: "unknown" });
    render(<CustomerCommercePanel customerId="customer" account={account} />);
    expect(screen.getByRole("status")).toHaveTextContent("unavailable or incomplete");
  });
  it.each(sourceTables)("missing %s count cannot prove completeness", async missingCount => {
    setup({ missingCount });
    expect(await getCustomerCommerceAccount("biz", "customer")).toMatchObject({ outstandingBalanceCents: null, remainingBalanceCents: null });
  });
  it.each(sourceTables)("missing %s data cannot be treated as empty", async missingData => {
    setup({ missingData, empty: true });
    expect(await getCustomerCommerceAccount("biz", "customer")).toMatchObject({ outstandingBalanceCents: null, remainingBalanceCents: null });
  });
  it.each(sourceTables)("thrown %s read becomes Unknown with a diagnostic", async throws => {
    setup({ throws });
    expect(await getCustomerCommerceAccount("biz", "customer")).toMatchObject({ outstandingBalanceCents: null, remainingBalanceCents: null });
    expect(mocks.log).toHaveBeenCalledWith(expect.any(String), "Synthetic source throw");
  });
  it("exact counts equal to the query limits prove complete current reads", async () => {
    setup({ invoiceCount: 40, transactionCount: 60 });
    expect(await getCustomerCommerceAccount("biz", "customer")).toMatchObject({ outstandingBalanceCents: 500, remainingBalanceCents: 500, totalPaidCents: null, lifetimeSpendCents: null, depositsCents: null });
  });
  it("ledger disagreement prevents numeric balance despite matching appointment/invoice balances", async () => {
    setup({ ledgerMismatch: true });
    expect(await getCustomerCommerceAccount("biz", "customer")).toMatchObject({ outstandingBalanceCents: null, remainingBalanceCents: null, financialStatus: "source_disagreement" });
  });
});
