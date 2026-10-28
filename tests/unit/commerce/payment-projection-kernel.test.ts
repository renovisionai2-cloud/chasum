// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/actions/business", () => ({ requireBusiness: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
import { projectPaymentObligation } from "@/lib/commerce/payment-projections/kernel";
import { projectionKinds } from "@/lib/commerce/payment-projections/types";
const business = "11111111-1111-4111-8111-111111111111";
const attempt = "22222222-2222-4222-8222-222222222222";
const target = "33333333-3333-4333-8333-333333333333";
describe("private projection transport (not database proof)", () => {
  it.each(projectionKinds)("dispatches only the fixed %s RPC and tenant resolved on server", async kind => {
    const data = { outcome: "APPLIED", business_id: business, attempt_id: attempt, projection_kind: kind, state: "COMPLETE", target_id: target, failure_code: null };
    const rpc = vi.fn().mockResolvedValue({ data, error: null });
    expect(await projectPaymentObligation({ attemptId: attempt, kind }, { resolveBusinessId: async () => business, rpc })).toEqual(data);
    expect(rpc).toHaveBeenCalledExactlyOnceWith(`project_payment_${kind}_v1`, { p_business_id: business, p_attempt_id: attempt });
  });
  it.each(["transport", "error", "foreign", "wrong-kind", "malformed", "false-complete"])("fails closed on %s without retry", async mode => {
    const data = { outcome: "APPLIED", business_id: mode === "foreign" ? target : business, attempt_id: attempt,
      projection_kind: mode === "wrong-kind" ? "receipt" : "appointment_cache", state: mode === "false-complete" ? "PENDING" : "COMPLETE", failure_code: null };
    const rpc = mode === "transport" ? vi.fn().mockRejectedValue(new Error("secret")) : vi.fn().mockResolvedValue({ data: mode === "malformed" ? { ...data, provider_secret: "secret" } : data, error: mode === "error" ? { message: "secret" } : null });
    const result = await projectPaymentObligation({ attemptId: attempt, kind: "appointment_cache" }, { resolveBusinessId: async () => business, rpc });
    expect(result.outcome).toBe("UNKNOWN"); expect(JSON.stringify(result)).not.toContain("secret"); expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("rejects caller-provided business or amount before any RPC", async () => {
    const rpc=vi.fn();
    await expect(projectPaymentObligation({ attemptId: attempt, kind: "receipt", businessId: target } as never, { resolveBusinessId: async () => business, rpc })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("preserves verification mismatch without converting it into a retry", async () => {
    const data={ outcome: "VERIFICATION_MISMATCH", business_id: business, attempt_id: attempt, projection_kind: "receipt", state: "COMPLETE", target_id: null, failure_code: "PROJECTION_UNCERTAIN" };
    const rpc=vi.fn().mockResolvedValue({data,error:null});
    expect(await projectPaymentObligation({attemptId:attempt,kind:"receipt"},{resolveBusinessId:async()=>business,rpc})).toEqual(data);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
