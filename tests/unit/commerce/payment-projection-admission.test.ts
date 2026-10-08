// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/actions/business", () => ({ requireBusiness: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
import { readFileSync } from "node:fs";
import { projectPaymentObligation } from "@/lib/commerce/payment-projections/kernel";
const sql=readFileSync("supabase/migrations/20261008210359_issue_133_payment_projection_observability.sql","utf8");
const business="11111111-1111-4111-8111-111111111111", attempt="22222222-2222-4222-8222-222222222222";
describe("admission static boundary",()=>{
  it("has no enabled seed and uses only server time for activation",()=>{
    expect(sql).toContain("enabled boolean not null default false");
    expect(sql).toContain("a.created_at<=admission.admit_attempts_created_after");
    expect(sql).toContain("greatest(clock_timestamp(), a.admit_attempts_created_after)");
    expect(sql).not.toMatch(/values\s*\([^;]*true/i);
    expect(sql).not.toContain("create policy");
  });
  it("rechecks and locks admission before target work",()=>{
    const body=sql.slice(sql.indexOf("create function public.project_payment_obligation_v1"));
    expect(body.indexOf("for share")).toBeLessThan(body.indexOf("for update"));
    expect(body).toContain("not admission.enabled or admission.admit_attempts_created_after is null");
  });
  it("propagates database non-admission without fallback or activation",async()=>{
    const data={outcome:"NOT_ADMITTED",business_id:business,attempt_id:attempt,projection_kind:"receipt"};
    const rpc=vi.fn().mockResolvedValue({data,error:null});
    expect(await projectPaymentObligation({attemptId:attempt,kind:"receipt"},{resolveBusinessId:async()=>business,rpc})).toEqual(data);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
