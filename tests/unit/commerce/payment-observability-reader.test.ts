// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/actions/business", () => ({ requireBusiness: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
import { readPaymentObservability } from "@/lib/commerce/payment-observability/reader";
const business="11111111-1111-4111-8111-111111111111", actor="22222222-2222-4222-8222-222222222222", attempt="33333333-3333-4333-8333-333333333333";
const snapshot={snapshot_at:"2026-10-08T12:00:00+00:00",business_id:business,rows:[],next_cursor:null};
const authority=async()=>({businessId:business,actorId:actor});
describe("canonical reader transport",()=>{
  it("uses exactly one authorized snapshot RPC and cannot supply a Business",async()=>{
    const rpc=vi.fn().mockResolvedValue({data:snapshot,error:null});
    expect(await readPaymentObservability({mode:"one",attemptId:attempt},{resolveAuthority:authority,rpc})).toEqual({kind:"SNAPSHOT",snapshot});
    expect(rpc).toHaveBeenCalledExactlyOnceWith({p_business_id:business,p_actor_id:actor,p_mode:"one",p_attempt_id:attempt,p_cursor:null,p_limit:1});
  });
  it("passes an opaque bounded cursor without parsing its timestamp",async()=>{
    const rpc=vi.fn().mockResolvedValue({data:snapshot,error:null});
    await readPaymentObservability({mode:"history",cursor:"abcdef",limit:5},{resolveAuthority:authority,rpc});
    expect(rpc).toHaveBeenCalledWith(expect.objectContaining({p_cursor:"abcdef",p_limit:5}));
  });
  it.each([0,51,1.1])("rejects limit %s before RPC",async limit=>{
    const rpc=vi.fn();await expect(readPaymentObservability({mode:"history",limit},{resolveAuthority:authority,rpc})).rejects.toThrow();expect(rpc).not.toHaveBeenCalled();
  });
  it("does not query after authority denial",async()=>{
    const rpc=vi.fn();expect(await readPaymentObservability({mode:"history"},{resolveAuthority:async()=>{throw Error("denied");},rpc})).toEqual({kind:"NOT_AUTHORIZED"});expect(rpc).not.toHaveBeenCalled();
  });
  it.each(["42501","XX000"])("redacts database errors %s",async code=>{
    const rpc=vi.fn().mockResolvedValue({data:null,error:{code,message:"private tenant data"}});
    expect(await readPaymentObservability({mode:"history"},{resolveAuthority:authority,rpc})).toEqual({kind:code==="42501"?"NOT_AUTHORIZED":"UNKNOWN"});
  });
  it.each(["foreign","pii","malformed"])("rejects %s response",async mode=>{
    const data=mode==="foreign"?{...snapshot,business_id:actor}:mode==="pii"?{...snapshot,customer_email:"private@example.test"}:{...snapshot,rows:[{}]};
    expect(await readPaymentObservability({mode:"history"},{resolveAuthority:authority,rpc:async()=>({data,error:null})})).toEqual({kind:"UNKNOWN"});
  });
});

describe("operator-state transport validation (SQL derivation is a separate proof)",()=>{
  const base={attempt_id:attempt,attempt_key:actor,source:"collect_payment",booking_operation_id:null,appointment_id:null,
    payment_kind:"payment",amount_cents:500,currency:"cad",method:"cash",provider_route:"manual",payment_mode:null,
    execution_state:"REQUESTED",recovery_disposition:"RECOVER",failure_class:null,failure_code:null,events:[],ledger_count:0,ledger:null,obligations:[],
    operator_state:"PAYMENT_RECOVERY_REQUIRED",synchronization:"PENDING",created_at:"2026-10-08T11:00:00+00:00",resolved_at:null,communication_eligibility:"NOT_IMPLEMENTED"};
  it.each(["NOT_RECORDED","PAYMENT_RECOVERY_REQUIRED","RECORDED_BUT_NOT_FULLY_SYNCHRONIZED","RECORDED","UNKNOWN"])("preserves canonical %s",async state=>{
    const row: Record<string,unknown>={...base,operator_state:state};
    if(state==="NOT_RECORDED") Object.assign(row,{execution_state:"FAILED",synchronization:"NOT_REQUIRED",failure_class:"VALIDATION",failure_code:"INVALID_REQUEST",resolved_at:base.created_at});
    if(state==="UNKNOWN") row.synchronization="UNKNOWN";
    if(state.startsWith("RECORDED")) Object.assign(row,{execution_state:"ACCEPTED",ledger_count:1,resolved_at:base.created_at,
      ledger:{id:actor,appointment_id:null,amount_cents:500,currency:"cad",method:"cash",kind:"payment",status:"succeeded",provider:"manual"},
      obligations:["appointment_cache","invoice_settlement","customer_payment_events","receipt"].map(kind=>({kind,state:state==="RECORDED"?"COMPLETE":"PENDING",failure_code:null,updated_at:base.created_at,completed_at:state==="RECORDED"?base.created_at:null})),synchronization:state==="RECORDED"?"COMPLETE":"PENDING"});
    const data={...snapshot,rows:[row]};
    expect(await readPaymentObservability({mode:"one",attemptId:attempt},{resolveAuthority:authority,rpc:async()=>({data,error:null})})).toEqual({kind:"SNAPSHOT",snapshot:data});
  });
  it("rejects a recovered-money state that hides a ledger",async()=>{
    const data={...snapshot,rows:[{...base,ledger_count:1}]};
    expect(await readPaymentObservability({mode:"one",attemptId:attempt},{resolveAuthority:authority,rpc:async()=>({data,error:null})})).toEqual({kind:"UNKNOWN"});
  });
});
