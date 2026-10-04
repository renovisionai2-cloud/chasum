import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), invoices: vi.fn(), transactions: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@/lib/commerce/invoices", () => ({ listInvoices: mocks.invoices }));
vi.mock("@/lib/commerce/payments", () => ({ listTransactions: mocks.transactions }));
vi.mock("@/lib/commerce/receipts", () => ({ listReceipts: async () => [] }));
vi.mock("@/lib/commerce/refunds", () => ({ listRefunds: async () => [] }));
vi.mock("@/lib/commerce/gift-cards", () => ({ listActiveGiftCardsForCustomer: async () => [] }));
vi.mock("@/lib/actions/commerce", () => ({ recordPaymentAction: vi.fn(), downloadInvoiceTextAction: vi.fn(), downloadReceiptTextAction: vi.fn(), queueReceiptEmailAction: vi.fn() }));
import { getCustomerCommerceAccount, getSummerCommerceSnapshot } from "@/lib/commerce/customer-account";
import { CustomerCommercePanel } from "@/components/commerce/customer-commerce-panel";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.invoices.mockResolvedValue([]);
  mocks.transactions.mockResolvedValue([]);
});
afterEach(cleanup);
function setup(degraded = false) {
  mocks.client.mockResolvedValue({ from: (table: string) => {
    const result = table === "customers" ? { data: { id: "customer", store_credit_cents: 0 }, error: null } : degraded
      ? { data: null, error: { message: "amount_paid_cents column missing" } }
      : { data: [{ price_cents: 1000, deposit_cents: 500, amount_paid_cents: 500, amount_refunded_cents: 0 }], error: null };
    const q = { select: () => q, eq: () => q, neq: () => q, maybeSingle: async () => result, then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve) };
    return q;
  } });
}
describe("incomplete customer-account history", () => {
  it.each([false, true])("preserves unknown totals through account and Summer (degraded=%s)", async degraded => {
    setup(degraded);
    const account = await getCustomerCommerceAccount("biz", "customer");
    expect(account).toMatchObject({ totalPaidCents: null, depositsCents: null, outstandingBalanceCents: null, lifetimeSpendCents: null });
    const snapshot = await getSummerCommerceSnapshot("biz", "customer");
    expect(snapshot).toMatchObject({ totalPaidCents: null, depositsCents: null, outstandingBalanceCents: null });
    expect(snapshot.note).toContain("unverified");
  });
  it("does not claim complete totals from a capped transaction list", async () => {
    setup();
    mocks.transactions.mockResolvedValue(Array.from({ length: 60 }, () => ({ status: "succeeded", kind: "payment", method: "cash", amountCents: 500 })));
    const account = await getCustomerCommerceAccount("biz", "customer");
    expect(account.totalPaidCents).toBeNull();
    expect(mocks.transactions).toHaveBeenCalledWith({ businessId: "biz", customerId: "customer", limit: 60 });
  });
  it("renders unknown without converting null account totals to zero money", async () => {
    setup(true);
    const account = await getCustomerCommerceAccount("biz", "customer");
    render(<CustomerCommercePanel customerId="customer" account={account} />);
    expect(screen.getAllByText("Unknown")).toHaveLength(4);
    expect(screen.getByRole("status")).toHaveTextContent("Account totals need review");
  });
});
