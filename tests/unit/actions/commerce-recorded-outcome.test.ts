import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ record: vi.fn(), refund: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: async () => ({ id: "biz", currency: "cad" }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "actor" } } }) } }) }));
vi.mock("@/lib/commerce", () => ({ recordCommercePayment: mocks.record, processCommerceRefund: mocks.refund, parsePaymentMethod: () => "cash" }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));
import { recordPaymentAction, refundPaymentAction } from "@/lib/actions/commerce";
function form() {
  const fd = new FormData();
  for (const [k,v] of Object.entries({ customer_id: "customer", amount: "5", transaction_id: "tx", reason: "Test" })) fd.set(k,v);
  return fd;
}
beforeEach(() => vi.resetAllMocks());
describe("Phase A action identity", () => {
  it("returns non-retryable recorded identity on downstream payment failure", async () => {
    mocks.record.mockResolvedValue({ ok: false, transaction: { id: "tx", status: "succeeded" }, recorded: true, canRetry: false, syncStatus: "failed", error: "Payment recorded, but CRM mirror failed. Do not collect again." });
    expect(await recordPaymentAction({}, form())).toMatchObject({ transactionId: "tx", recorded: true, canRetry: false, syncStatus: "failed", error: expect.stringContaining("Payment recorded") });
  });
  it("retains payment identity when revalidation throws", async () => {
    mocks.record.mockResolvedValue({ ok: true, transaction: { id: "tx", status: "succeeded" }, recorded: true });
    mocks.refresh.mockImplementation(() => { throw new Error("Synthetic refresh failure"); });
    expect(await recordPaymentAction({}, form())).toMatchObject({ transactionId: "tx", recorded: true, canRetry: false, error: expect.stringContaining("Do not collect again") });
  });
  it("pending provider record is not disclosed as received money", async () => {
    mocks.record.mockResolvedValue({ ok: false, transaction: { id: "pending", status: "requires_action" }, requiresAction: true, error: "Confirmation required" });
    expect(await recordPaymentAction({}, form())).toMatchObject({ transactionId: "pending", recorded: false, canRetry: false, requiresAction: true });
  });
  it("retains refund identity on downstream failure", async () => {
    mocks.refund.mockResolvedValue({ ok: false, refund: { id: "refund" }, recorded: true, canRetry: false, syncStatus: "failed", error: "Refund recorded, but sync failed. Do not issue again." });
    expect(await refundPaymentAction({}, form())).toMatchObject({ refundId: "refund", recorded: true, canRetry: false, syncStatus: "failed" });
  });
});
