// @vitest-environment node
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, it, expect } from "vitest";
const path="supabase/migrations/20261008210359_issue_133_payment_projection_observability.sql";
const sql=readFileSync(path,"utf8");
const old=readFileSync("supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql","utf8");
const protectedSources={
  "20261004190341_issue_134_payment_attempt_foundation.sql":"dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47",
  "20261005154345_issue_134_r1a_manual_payment_kernel.sql":"4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7",
  "20261007012529_issue_134_appointment_financial_attribution.sql":"fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524",
  "20261007203352_issue_134_durable_booking_operation.sql":"01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b",
};
describe("Slice 1 source contract — NOT PostgreSQL execution",()=>{
  it.each(Object.entries(protectedSources))("preserves %s",(name,hash)=>expect(createHash("sha256").update(readFileSync(`supabase/migrations/${name}`)).digest("hex")).toBe(hash));
  it("adds exactly nine private functions plus one existing replacement",()=>{
    expect([...sql.matchAll(/^create function public\.(\w+)/gm)].map(m=>m[1]).sort()).toEqual([
      "set_payment_projection_admission_v1","payment_projection_history_valid_v1","payment_appointment_truth_v1","project_payment_obligation_v1",
      "project_payment_appointment_cache_v1","project_payment_invoice_settlement_v1","project_payment_customer_payment_events_v1","project_payment_receipt_v1","read_payment_observability_v1"].sort());
    expect([...sql.matchAll(/^create or replace function public\.(\w+)/gm)].map(m=>m[1])).toEqual(["commit_manual_payment_attempt_v1"]);
    expect([...sql.matchAll(/^create table public\.(\w+)/gm)].map(m=>m[1])).toEqual(["commerce_receipt_sequences","commerce_projection_admission"]);
  });
  it("preserves exact R1a header, pre-ACCEPTED checks and new-money suffix",()=>{
    const extract=(text:string)=>text.slice(text.indexOf("public.commit_manual_payment_attempt_v1("),text.indexOf("end $$;",text.indexOf("public.commit_manual_payment_attempt_v1("))+7);
    const before=extract(old),after=extract(sql);
    const accepted="  if attempt.execution_state = 'ACCEPTED' then", requested="  if attempt.execution_state <> 'REQUESTED'";
    expect(after.slice(0,after.indexOf(accepted))).toBe(before.slice(0,before.indexOf(accepted)));
    expect(after.slice(after.indexOf(requested))).toBe(before.slice(before.indexOf(requested)));
    const replay=after.slice(after.indexOf(accepted),after.indexOf(requested));
    expect(replay).not.toMatch(/\b(insert|update|delete|perform)\b/i);
    expect(replay).toContain("'REPLAY'::text, attempt.id, ledger.id, true, 'PENDING'::text");
    expect(replay).toContain("public.payment_projection_history_valid_v1");
    expect(sql).not.toMatch(/(?:grant|revoke|drop|alter)[^;]*commit_manual_payment_attempt_v1/i);
  });
  it("pins invoker and safe search_path on every function; no browser grants",()=>{
    const definitions=sql.split(/create (?:or replace )?function public\./).slice(1);
    for(const definition of definitions){ const header=definition.slice(0,definition.indexOf("as $$"));expect(header).toMatch(/security invoker/);expect(header).toMatch(/set search_path = pg_catalog, pg_temp/);expect(definition).toContain("current_user <> 'service_role'"); }
    expect(sql).not.toMatch(/security definer|disable row level|create policy|alter default privileges/i);
    expect(sql).toContain("from public,anon,authenticated,service_role");
  });
  it("pins exact projection vocabulary and latest event coherence",()=>{
    const helper=sql.slice(sql.indexOf("create function public.payment_projection_history_valid_v1"),sql.indexOf("-- Existing-function replacement"));
    expect(helper).toContain("(select count(*) from e)=2 +");
    expect(helper).toContain("event_sequence desc");expect(helper).toContain("when o.state='PENDING' then l.id is null");
    expect(helper).toContain("o.projection_kind='appointment_cache' then l.id is null");
    expect(helper).toContain("l.failure_code is not distinct from o.failure_code");
    expect(helper).toContain("money_state='RECORDED'");expect(helper).toContain("failure_class='PROJECTION'");
    expect(sql).not.toMatch(/'PROJECTION_CHANGED','RECORDED',p_kind,'PENDING'/);
  });
  it("retains cascade semantics and introduces no historical backfill",()=>{
    expect(sql).toMatch(/commerce_receipts_projection_tenant_fk[\s\S]*?on delete cascade/);
    expect(sql).toMatch(/customer_payment_events_projection_tenant_fk[\s\S]*?on delete cascade/);
    expect(sql).not.toMatch(/drop constraint|on delete restrict|invoice.*appointment.*foreign key/i);
    expect(sql).toContain("where transaction_id is not null");expect(sql).toContain("where appointment_id is not null");
  });
  it("only updates three appointment cache fields and recomputes sum by ID rows",()=>{
    const mutation=sql.match(/update public.appointments set[\s\S]*?;/)?.[0];
    expect(mutation).toContain("amount_paid_cents=");expect(mutation).toContain("amount_refunded_cents=0");expect(mutation).toContain("payment_status=");
    expect(mutation).not.toMatch(/price_cents=|tax_cents=|deposit_cents=/);
    expect(sql).toContain("sum(amount_cents::bigint)");expect(sql).not.toContain("sum(distinct");
    expect(sql).toContain("public.commerce_refunds");expect(sql.slice(sql.indexOf("create function public.payment_appointment_truth_v1"),sql.indexOf("create function public.project_payment_obligation_v1"))).not.toContain("public.services");
  });
  it("pins distinct advisory first-row sequence namespaces and zero email delivery",()=>{
    for(const kind of ["invoice","receipt"]){const lock=sql.indexOf(`hashtextextended('${kind}-sequence:`);const insert=sql.indexOf(`insert into public.commerce_${kind}_sequences`);expect(lock).toBeGreaterThan(-1);expect(lock).toBeLessThan(insert);}
    expect(sql).toContain("'not_sent'");expect(sql).not.toMatch(/background_jobs|enqueue|http_post|net\./);
  });
  it.each([
    ["invoice_settlement", "customer_payment_events"],
    ["receipt", null],
  ])("pins four-digit minimum at the %s allocation assignment", (kind, nextKind) => {
    const start = sql.indexOf(`    elsif p_kind='${kind}' then`);
    expect(start).toBeGreaterThan(-1);
    const end = nextKind
      ? sql.indexOf(`    elsif p_kind='${nextKind}' then`, start)
      : sql.indexOf("    if not coalesce(target_valid,false)", start);
    expect(end).toBeGreaterThan(start);
    const allocation = sql.slice(start, end);
    const assignments = [...allocation.matchAll(/document_number\s*:=([^;]+);/g)]
      .map(match => match[1].replace(/\s+/g, ""));
    expect(assignments).toEqual([
      "prefix_value||'-'||lpad(number_value::text,greatest(4,length(number_value::text)),'0')",
    ]);
  });
  it("preserves terminal states and rolls back target failures before event",()=>{
    expect(sql).toContain("terminal:=o.state in ('COMPLETE','NOT_REQUIRED')");expect(sql).toContain("if failure is not null and not terminal then");
    expect(sql).toContain("VERIFICATION_MISMATCH");expect(sql).toContain("exception\n    when sqlstate 'P1331'");
  });
});

describe("future proof package safety, no positive execution",()=>{
  const verifier=readFileSync("scripts/verify-issue133-payment-projection-postgres.mjs","utf8");
  const proof=readFileSync("tests/postgres/issue-133-payment-projection-observability-contract.sql","utf8");
  it("requires exact confirmation before process setup or filesystem allocation",()=>{
    expect(verifier.indexOf('args.length !== 1')).toBeLessThan(verifier.indexOf('const pgBin'));
    expect(verifier).toContain('args[0] !== "--confirm-disposable-local"');
    expect(verifier).toContain('process.exit(2)');
    expect(verifier).toContain('Refusing a dirty proof candidate');
  });
  it("binds only owned loopback, sanitizes inherited environment, and fences deletion",()=>{
    for(const text of ['listen_addresses=127.0.0.1','realpathSync(observedDataDir) !== realpathSync(dataDir)',
      'PGSERVICEFILE: privateServiceFile','PGSYSCONFDIR: privateHome','SUPABASE_SERVICE_ROLE_KEY',
      'if (!innerOwned || !outerOwned)','Refusing PGDATA cleanup without confirmed stop','status.status === 3','sourceIdentityMatched']) expect(verifier).toContain(text);
  });
  it("runs unchanged historical R1a proof against replacement and requires both sentinels",()=>{
    expect(createHash("sha256").update(readFileSync("tests/postgres/issue-134-r1a-manual-kernel-contract.sql")).digest("hex")).toBe("7d343b902711e264c3c2bbc15695ba092f983b88b84d9bdf9a4580b1652f2f23");
    expect(proof.indexOf("\\ir issue-134-r1a-manual-kernel-contract.sql")).toBeGreaterThan(proof.indexOf("\\ir ../../supabase/migrations/20261008210359_issue_133_payment_projection_observability.sql"));
    expect(verifier).toContain('!contract.stdout.includes("ISSUE133_SQL_CONTRACT_PASS")');expect(verifier).toContain('!contract.stdout.includes("ISSUE133_FIXTURE_READY")');
  });
  it("authors forced overlapping workers and retained lost-response evidence",()=>{
    expect(verifier).toContain('type === "Lock"');expect(verifier).toContain('type==="Lock"');
    expect(verifier).toContain('captureConcurrency(`sequence:${kind}`,results)');
    expect(verifier).toContain('Lost-response identity changed');expect(verifier).toContain('Failed migration left partial schema');
  });
});
