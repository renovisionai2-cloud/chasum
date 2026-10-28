import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();
const migrationPath =
  "supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql";
const migration = readFileSync(resolve(root, migrationPath), "utf8");
const sql = migration.replace(/--[^\n]*/g, "");
const verifier = readFileSync(
  resolve(root, "scripts/verify-issue134-durable-booking-operation-postgres.mjs"),
  "utf8",
);

const acceptedSources = {
  "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql":
    "dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47",
  "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql":
    "4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7",
  "supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql":
    "fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524",
} as const;

const functionNames = [
  "guard_commerce_booking_operation_v1",
  "guard_appointment_booking_operation_link_v1",
  "bootstrap_booking_operation_v1",
  "persist_booking_operation_appointment_v1",
  "bind_booking_operation_appointment_v1",
  "close_booking_operation_v1",
  "commit_booking_operation_manual_payment_v1",
  "read_booking_operations_v1",
] as const;

// Scoped source regression guard for the bind function's two UPDATEs.
// This is not a PL/pgSQL parser or a substitute for a database proof.
const bindBody = sql.match(
  /create function public\.bind_booking_operation_appointment_v1\([\s\S]*?as \$\$([\s\S]*?)end \$\$;/,
)?.[1];
if (!bindBody) throw new Error("Binding function body missing");

function bindingWrites(source: string) {
  return [...source.matchAll(
    /\bupdate\s+public\.(\w+)(?:\s+as\s+(\w+))?\s+set\s+([\s\S]*?)\s+where\s+([\s\S]*?);/gi,
  )].map(([, table, alias, assignments, predicates]) => ({
    table,
    alias,
    assignments: assignments.replace(/\s+/g, " ").trim(),
    predicates: predicates.replace(/\s+/g, " ").trim(),
  }));
}

const expectedBindingWrites = [
  {
    table: "commerce_payment_attempts",
    alias: "attempt_target",
    // SET targets must be bare columns; expression references must be qualified.
    assignments: "appointment_id = appointment_row.id, updated_at = pg_catalog.now()",
    predicates: "attempt_target.id = attempt_row.id and attempt_target.business_id = p_business_id and attempt_target.appointment_id is null",
  },
  {
    table: "commerce_booking_operations",
    alias: "operation_target",
    assignments: "lifecycle_state = 'APPOINTMENT_CREATED', updated_at = pg_catalog.now()",
    predicates: "operation_target.id = operation_row.id and operation_target.business_id = p_business_id and operation_target.lifecycle_state = 'OPEN'",
  },
];

// Protect the complete history ledger summary, not merely a cast anywhere in SQL.
const readerBody = sql.split("create function public.read_booking_operations_v1(")[1]
  ?.split("end $$;")[0];
if (!readerBody) throw new Error("Reader function body missing");
const ledgerSummary = readerBody.match(
  /left join lateral \(([\s\S]*?)\) ledger_summary on true/,
)?.[1].replace(/\s+/g, " ").trim();
const expectedLedgerSummary =
  'select count(*)::integer as ledger_count, min(transaction_row.id::text collate "C")::uuid as transaction_id ' +
  "from public.commerce_transactions transaction_row " +
  "where transaction_row.business_id = attempt_row.business_id " +
  "and transaction_row.payment_attempt_id = attempt_row.id";
const directUuidMinMax = /\b(?:min|max)\s*\(\s*(?:\w+\.)?(?:id|\w+_id)\s*\)/i;

describe("Issue #134 durable booking-operation migration contract", () => {
  it("uses a deterministic text minimum cast back to UUID without filtering the ledger count", () => {
    expect(ledgerSummary).toBe(expectedLedgerSummary);
    expect(sql).not.toMatch(directUuidMinMax);
    expect([...sql.matchAll(/\b(?:min|max)\s*\([^\n]+/gi)].map(([expression]) => expression))
      .toEqual(['min(transaction_row.id::text collate "C")::uuid as transaction_id']);
  });

  it.each(["min", "max"])("rejects unsupported direct UUID %s in the ledger summary", (aggregate) => {
    const mutant = expectedLedgerSummary.replace(
      'min(transaction_row.id::text collate "C")::uuid',
      `${aggregate}(transaction_row.id)`,
    );
    expect(mutant).toMatch(directUuidMinMax);
    expect(mutant).not.toBe(ledgerSummary);
  });

  it("keeps recorded history states gated on exactly one ledger and otherwise UNKNOWN", () => {
    const operatorState = readerBody.match(/'operator_state', case([\s\S]*?)end,/)?.[1];
    if (!operatorState) throw new Error("History operator-state case missing");
    const recordedBranches = [...operatorState.matchAll(
      /when([\s\S]*?)then '(RECORDED(?:_BUT_NOT_FULLY_SYNCHRONIZED)?)'/g,
    )];
    expect(recordedBranches).toHaveLength(2);
    for (const [, condition] of recordedBranches) {
      expect(condition).toContain("visible_row.ledger_count = 1");
    }
    expect(operatorState.trim()).toMatch(/else 'UNKNOWN'$/);
  });

  it("binds only the locked tenant attempt and OPEN operation using qualified target predicates", () => {
    expect(bindingWrites(bindBody)).toEqual(expectedBindingWrites);
    expect(bindBody.match(/\bupdate\s+public\./g)).toHaveLength(2);
    expect(bindBody).not.toMatch(/#variable_conflict|plpgsql\.variable_conflict/i);
  });

  it.each([
    "attempt_target.id",
    "attempt_target.business_id",
    "attempt_target.appointment_id",
    "operation_target.id",
    "operation_target.business_id",
    "operation_target.lifecycle_state",
  ])("rejects reintroducing an unqualified %s target predicate", (qualified) => {
    const mutant = bindBody.replace(qualified, qualified.split(".")[1]);
    expect(mutant).not.toBe(bindBody);
    expect(bindingWrites(mutant)).not.toEqual(expectedBindingWrites);
  });

  it("requires qualified bind expressions while allowing PostgreSQL's bare SET targets", () => {
    const expressions = bindBody
      .replace(/'([^']|'')*'/g, "''")
      .replace(/\bset\s+appointment_id\s*=/gi, "set =");
    expect(expressions).not.toMatch(
      /(?<![\w.])(?:id|business_id|operation_id|appointment_id|attempt_id|outcome)\b/i,
    );
    expect(bindingWrites(bindBody.replace("set appointment_id = appointment_row.id,", "set appointment_id = appointment_id,")))
      .not.toEqual(expectedBindingWrites);
  });

  it("preserves every accepted migration byte-for-byte", () => {
    for (const [path, expected] of Object.entries(acceptedSources)) {
      expect(
        createHash("sha256")
          .update(readFileSync(resolve(root, path)))
          .digest("hex"),
      ).toBe(expected);
    }
  });

  it("contains exactly the approved 23 schema deltas", () => {
    expect(
      [...sql.matchAll(/create table public\.(\w+)/g)].map((match) => match[1]),
    ).toEqual(["commerce_booking_operations"]);
    expect(sql.match(/add column booking_operation_id uuid;/g)).toHaveLength(1);
    const constraints = [...sql.matchAll(/\bconstraint\s+(\w+)/gi)].map(
      (match) => match[1],
    );
    expect(constraints).toEqual([
      "commerce_booking_operations_pkey",
      "commerce_booking_operations_id_business_key",
      "commerce_booking_operations_business_fk",
      "commerce_booking_operations_customer_fk",
      "commerce_booking_operations_request_check",
      "commerce_booking_operations_lifecycle_check",
      "appointments_booking_operation_fk",
      "commerce_payment_attempts_booking_operation_fk",
    ]);
    expect(
      [...sql.matchAll(/create (?:unique )?index\s+(\w+)/gi)].map(
        (match) => match[1],
      ),
    ).toEqual([
      "commerce_booking_operations_actor_recovery_idx",
      "appointments_booking_operation_key",
      "commerce_payment_attempts_booking_operation_key",
    ]);
    expect(
      [...sql.matchAll(/create function public\.(\w+)/g)].map(
        (match) => match[1],
      ),
    ).toEqual(functionNames);
    expect(
      [...sql.matchAll(/create trigger\s+(\w+)/gi)].map((match) => match[1]),
    ).toEqual([
      "commerce_booking_operations_guard",
      "appointments_booking_operation_guard",
    ]);
    expect(1 + 1 + constraints.length + 3 + functionNames.length + 2).toBe(23);
  });

  it("pins the exact function signatures and 37-argument bootstrap order", () => {
    const bootstrap = sql
      .split("create function public.bootstrap_booking_operation_v1(")[1]
      ?.split(") returns table")[0]
      .match(/p_\w+\s+(?:timestamptz|boolean|integer|uuid\[\]|uuid|text)/g);
    expect(bootstrap).toEqual([
      "p_business_id uuid",
      "p_operation_id uuid",
      "p_attempt_key uuid",
      "p_actor_id uuid",
      "p_source text",
      "p_booking_fingerprint text",
      "p_payment_fingerprint text",
      "p_customer_input_fingerprint text",
      "p_customer_origin text",
      "p_existing_customer_id uuid",
      "p_inline_customer_id uuid",
      "p_inline_name text",
      "p_inline_email text",
      "p_inline_phone text",
      "p_location_id uuid",
      "p_service_id uuid",
      "p_staff_id uuid",
      "p_requested_start timestamptz",
      "p_requested_end timestamptz",
      "p_requested_status text",
      "p_duration_minutes integer",
      "p_room_id uuid",
      "p_resource_ids uuid[]",
      "p_package_id uuid",
      "p_package_name text",
      "p_subtotal_cents integer",
      "p_tax_cents integer",
      "p_deposit_required_cents integer",
      "p_payment_mode text",
      "p_appointment_notes text",
      "p_payment_note text",
      "p_receipt_requested boolean",
      "p_payment_kind text",
      "p_payment_amount_cents integer",
      "p_currency text",
      "p_method text",
      "p_provider_route text",
    ]);
    expect(bootstrap).toHaveLength(37);
    expect(sql).toContain(
      "create function public.persist_booking_operation_appointment_v1(",
    );
    expect(sql).toContain(
      "create function public.bind_booking_operation_appointment_v1(",
    );
    expect(sql).toContain(
      "create function public.close_booking_operation_v1(",
    );
    expect(sql).toContain(
      "create function public.commit_booking_operation_manual_payment_v1(",
    );
    expect(sql).toContain("create function public.read_booking_operations_v1(");
  });

  it("is additive, transactional, bounded, and has no fixture or backfill DML", () => {
    expect(sql.trimStart()).toMatch(/^begin;/);
    expect(sql.trimEnd()).toMatch(/commit;$/);
    expect(sql).toContain("set local lock_timeout = '5s'");
    expect(sql).toContain("set local statement_timeout = '30s'");
    const ddlPrefix = sql.split(
      "create function public.guard_commerce_booking_operation_v1()",
    )[0];
    expect(ddlPrefix).not.toMatch(
      /\binsert\s+into\b|\bupdate\s+public\.|\bdelete\s+from\b|\btruncate\b/i,
    );
    expect(sql).not.toMatch(
      /\bdrop\s+(table|column|constraint|index|function|trigger|policy)\b/i,
    );
    expect(sql).not.toMatch(
      /create\s+or\s+replace|alter\s+default\s+privileges|force\s+row\s+level|disable\s+row\s+level/i,
    );
    expect(sql).not.toMatch(/\bnet\.|\bhttp\w*\s*\(|supabase\s+db\s+push/i);
  });

  it("uses invoker functions, fixed search paths, private ACLs, and no browser policy", () => {
    expect(sql.match(/language plpgsql\s+(?:stable\s+)?security invoker/g)).toHaveLength(8);
    expect(
      sql.match(/set search_path = pg_catalog, pg_temp/g),
    ).toHaveLength(8);
    expect(sql.match(/current_user <> 'service_role'/g)).toHaveLength(7);
    expect(sql).toContain(
      "alter table public.commerce_booking_operations enable row level security",
    );
    expect(sql).not.toMatch(/create policy|to anon|to authenticated/);
    expect(sql.match(/grant execute on function/g)).toHaveLength(8);
    expect(sql.match(/revoke all on function/g)).toHaveLength(8);
    expect(sql).not.toMatch(/security definer/i);
  });

  it("preserves legacy NULL-operation writes before privileged guard checks", () => {
    const guard = sql.split(
      "create function public.guard_appointment_booking_operation_link_v1()",
    )[1] ?? "";
    expect(guard.indexOf("new.booking_operation_id is null")).toBeLessThan(
      guard.indexOf("current_user <> 'service_role'"),
    );
    expect(guard).toContain("old.booking_operation_id is null");
    expect(guard).toContain("new.booking_operation_id is null");
    expect(sql).toContain("commerce_payment_attempts_booking_idx");
    expect(sql).not.toMatch(/drop\s+index/i);
  });

  it("implements operation-first replay, canonical fingerprints, no-payment, and fenced recovery", () => {
    expect(sql).toContain("order by lock_key");
    expect(sql).toContain("'booking-operation:' || p_operation_id::text");
    expect(
      sql.indexOf("where stored_operation.id = p_operation_id"),
    ).toBeLessThan(
      sql.indexOf("from public.customers customer_row"),
    );
    expect(sql).toContain("pg_catalog.sha256");
    expect(sql).toContain("BOOKING_OPERATION_FINGERPRINT_MISMATCH");
    expect(sql).toContain("'SKIPPED'");
    expect(sql).toContain("'DO_NOT_RETRY'");
    expect(sql).toContain("'PAYMENT_RECOVERY_REQUIRED'");
    expect(sql).toContain("APPOINTMENT_LEDGER_CUSTOMER_REASSIGNMENT_FORBIDDEN");
    expect(sql).toContain("p_expected_current_customer_id");
    expect(sql).toContain("replacement_customer_id = case");
    expect(sql).toContain("operation_row.lifecycle_state = 'CLOSED'");
  });

  it("keeps the prepared backend unwired/default-off and fixes source in private entrypoints", () => {
    const kernel = readFileSync(
      resolve(root, "lib/commerce/booking-operations/kernel.ts"),
      "utf8",
    );
    expect(kernel).toContain("admissionEnabled: false");
    expect(kernel).toContain('runPreparedForSource("booking_sheet"');
    expect(kernel).toContain('runPreparedForSource("quick_appointment"');
    expect(kernel).not.toContain("recordCommercePayment");
    for (const path of [
      "components/booking-sheet/booking-sheet.tsx",
      "components/reception/quick-appointment.tsx",
      "lib/actions/appointments.ts",
    ]) {
      expect(readFileSync(resolve(root, path), "utf8")).not.toContain(
        "booking-operations",
      );
    }
  });

  it("hardens the human-operated verifier inputs, evidence, concurrency capture, and cleanup", () => {
    expect(verifier).toContain("/opt/homebrew/opt/postgresql@17/bin");
    expect(verifier).toContain("createChildEnv");
    expect(verifier).toContain("NODE_OPTIONS");
    expect(verifier).toContain("DYLD_INSERT_LIBRARIES");
    expect(verifier).toContain("sourceIdentityBefore");
    expect(verifier).toContain("sourceIdentityAfter");
    expect(verifier).toContain("phases.jsonl");
    expect(verifier).toContain("concurrency-responses.json");
    expect(verifier).toContain("waitForActivity");
    expect(verifier).toContain("stopConfirmed");
    expect(verifier).toContain("ownership marker");
    expect(verifier).toContain("pgdataRemoved");
    expect(verifier).not.toMatch(
      /readFileSync\([^)]*["'][^"']*(?:\.env|\.supabase)/,
    );
    expect(verifier).not.toMatch(
      /^\s*["'][^"']*(?:\.env|\.supabase)[^"']*["'],?\s*$/m,
    );
  });
});

// Execute only extracted helper definitions with an inert process stub.
// Never import the executable verifier or start psql/PostgreSQL in these tests.
function verifierHelper(name: string) {
  const source = verifier.match(new RegExp(`^function ${name}\\([^]*?^}`, "m"))?.[0];
  if (!source) throw new Error(`Verifier helper missing: ${name}`);
  return source;
}

function verifierParser(stdout: string, status = 0) {
  const recordPhase = vi.fn();
  const spawnSync = vi.fn(() => ({ stdout, stderr: "", status }));
  const context = {
    spawnSync, recordPhase, childEnv: {}, binaries: { psql: "inert-psql-stub" },
    psqlArgs: (args: string[]) => args,
    process: { stdout: { write: vi.fn() }, stderr: { write: vi.fn() } },
  };
  const helpers = ["command", "sql", "finalRow"].map(verifierHelper).join("\n");
  const parser = runInNewContext(`${helpers}; ({ sql, finalRow });`, context, { timeout: 1000 }) as {
    sql: (statement: string, options: { quiet: boolean; phase: string }) => string;
    finalRow: (result: { stdout: string }) => string;
  };
  return { ...parser, recordPhase, spawnSync };
}

describe("Issue #158 verifier semantic result parsing (offline)", () => {
  it.each([
    ["ADMITTED", true],
    ["SET\nADMITTED\n", true],
    ["SET\r\nBEGIN\r\nUPDATE 1\r\nADMITTED\r\nRESET\r\nCOMMIT\r\n", true],
    ["SET\nEXISTING\n", false],
    ["SET\nBEGIN\nUNKNOWN\nCOMMIT\n", false],
    ["SET\nADMITTED\nWRONG\nCOMMIT\n", false],
    ["SET\nNOT_ADMITTED\n", false],
    ["SET\nADMITTED|extra\n", false],
    ["SET\nBEGIN\nUPDATE 2\nRESET\nCOMMIT\n", false],
    ["", false],
  ])("requires exact ADMITTED after normalizing %j", (stdout, admitted) => {
    const parser = verifierParser(stdout);
    const result = parser.sql("inert statement", { quiet: true, phase: "offline:admission" });
    expect(result === "ADMITTED").toBe(admitted);
    expect(result).toBe(parser.finalRow({ stdout }));
    expect(parser.recordPhase).toHaveBeenCalledWith("offline:admission", 0, undefined, stdout, "");
  });

  it.each([
    "EXISTING",
    "EXISTING|appointment-id",
    "REPLAY|transaction-id",
    "true|REQUESTED|0|0|",
    "true|REQUESTED|1|0|",
    "true|ACCEPTED|1|1|appointment-id",
  ])("preserves exact synchronous replay/recovery fields: %s", (row) => {
    const parser = verifierParser(`SET\n${row}\n`);
    expect(parser.sql("inert statement", { quiet: true, phase: "offline:recovery" })).toBe(row);
  });

  it("parses the NULL-staff transaction result before trailing sleep/COMMIT output", () => {
    const stdout = "SET\nSET\nBEGIN\nSET\nCREATED|appointment-id\n\nCOMMIT\n";
    expect(verifierParser(stdout).finalRow({ stdout })).toBe("CREATED|appointment-id");
  });

  it("does not accept business output from a failed psql process", () => {
    const parser = verifierParser("SET\nADMITTED\n", 3);
    expect(() => parser.sql("inert statement", { quiet: true, phase: "offline:failure" }))
      .toThrow("exited 3");
    expect(parser.recordPhase).toHaveBeenCalledWith("offline:failure", 3, undefined, "SET\nADMITTED\n", "");
  });

  it.each([
    ["closeAfterCreate", "createFirstResults", "RECOVERY_REQUIRED|", "RECOVERY_REQUIRED|appointment-id|f"],
    ["cancelAfterCommit", "commitFirstResults", "|t", "CLOSED|t"],
    ["commitAfterClose", "closeBeforeCommitResults", "NOT_COMMITTABLE|", "NOT_COMMITTABLE|f"],
  ])("reads the settled sibling result for %s", (promiseName, resultsName, expected, row) => {
    const checks = [...verifier.matchAll(/if \(!(?<check>finalRow\([^)]+\)\.(?:startsWith|endsWith)\("(?<expected>[^"]+)"\))\)/g)];
    const check = checks.find((match) => match.groups?.expected === expected)?.groups?.check;
    if (!check) throw new Error(`Result check missing: ${expected}`);
    const parser = verifierParser("");
    for (const [stdout, accepted] of [[`SET\n${row}\n`, true], ["SET\nWRONG\n", false]] as const) {
      const result = { stdout };
      expect(runInNewContext(check, {
        finalRow: parser.finalRow,
        [promiseName]: Promise.resolve(result),
        [resultsName]: [{ stdout: "ignored holder output" }, result],
      }, { timeout: 1000 })).toBe(accepted);
    }
  });
});

// These guard SQL source ordering/evidence requirements, not PostgreSQL execution.
describe("Issue #158 terminal commit evidence ordering", () => {
  const body = migration.split("create function public.commit_booking_operation_manual_payment_v1(")[1]
    .split("create function public.read_booking_operations_v1(")[0];
  const terminalStart = body.indexOf("  if attempt_row.execution_state in ('FAILED', 'SKIPPED') then");
  const tenderStart = body.indexOf("  if attempt_row.payment_kind not in");
  const acceptedStart = body.indexOf("  if attempt_row.execution_state = 'ACCEPTED' then");
  const lifecycleStart = body.indexOf("  if operation_row.lifecycle_state <> 'APPOINTMENT_CREATED'");
  const writeStart = body.indexOf("  update public.commerce_payment_attempts");
  const terminal = body.slice(terminalStart, tenderStart);

  it("loads and locks exact tenant/operation/attempt identity before terminal evidence", () => {
    for (const clause of [
      "attempt_source.id = p_attempt_id", "attempt_source.business_id = p_business_id",
      "attempt_source.booking_operation_id = p_operation_id",
      "appointment_source.id = attempt_row.appointment_id",
      "operation_source.id = p_operation_id", "operation_source.business_id = p_business_id",
      "if operation_row.actor_id <> p_actor_id", "into ledger_count",
      "transaction_row.payment_attempt_id = attempt_row.id",
    ]) {
      expect(body.indexOf(clause)).toBeGreaterThan(-1);
      expect(body.indexOf(clause)).toBeLessThan(terminalStart);
    }
    expect(body.slice(0, terminalStart).match(/for update;/g)).toHaveLength(3);
  });

  it.each(["FAILED", "SKIPPED"])("certifies %s zero-ledger truth before lifecycle/tender rejection", (state) => {
    expect(terminalStart).toBeGreaterThan(-1);
    expect(terminalStart).toBeLessThan(tenderStart);
    expect(tenderStart).toBeLessThan(acceptedStart);
    expect(acceptedStart).toBeLessThan(lifecycleStart);
    expect(terminal).toContain(`attempt_row.execution_state = '${state}'`);
    expect(terminal).toMatch(/if ledger_count <> 0[\s\S]*?'UNKNOWN'::text[\s\S]*?return;[\s\S]*?'NOT_COMMITTABLE'::text,\s*attempt_row.id,\s*null::uuid,\s*false/);
  });

  it("rejects nonzero/duplicate ledger, missing or contradictory events and obligations before NOT_COMMITTABLE", () => {
    for (const guard of ["ledger_count <> 0", "requested_event_count <> 1", "accepted_event_count <> 0",
      "obligation_count <> 0", "terminal_event_count <> 1", "lifecycle_event_count <> 2"]) {
      expect(terminal).toContain(guard);
      expect(terminal.indexOf(guard)).toBeLessThan(terminal.indexOf("'UNKNOWN'::text"));
    }
    expect(terminal).toContain("event_row.event_type = attempt_row.execution_state");
    expect(terminal).toContain("event_row.money_state = 'NOT_RECORDED'");
    expect(terminal).toContain("event_row.failure_class is not distinct from attempt_row.failure_class");
    expect(terminal).toContain("event_row.failure_code is not distinct from attempt_row.failure_code");
    expect(terminal).toContain("event_row.event_type in ('REQUESTED', 'ACCEPTED', 'FAILED', 'SKIPPED')");
  });

  it("requires resolved DO_NOT_RETRY and canonical FAILED/SKIPPED metadata", () => {
    expect(terminal).toContain("attempt_row.recovery_disposition is distinct from 'DO_NOT_RETRY'");
    expect(terminal).toContain("attempt_row.resolved_at is null");
    expect(terminal).toContain("is not distinct from row('CONFLICT'::text, 'KEY_CONFLICT'::text)");
    expect(terminal).toContain("is not distinct from row('VALIDATION'::text, 'INVALID_REQUEST'::text)");
    expect(terminal).toContain("and not coalesce(");
    expect(terminal).toContain("and attempt_row.provider_route = 'manual'");
    expect(terminal).toContain("'none'::text, 0, null::text, null::text, null::uuid, null::text, null::text");
  });

  it("preserves the exact ACCEPTED ledger/event/obligation replay block before mutable cancellation checks", () => {
    const accepted = body.slice(acceptedStart, body.indexOf("  -- Replay above", acceptedStart));
    expect(createHash("sha256").update(accepted).digest("hex")).toBe("6f4a0dfe4ed6318b812b62356437e19a3ef36de39106931b5eec61d7693ab669");
    expect(accepted).toContain("ledger_count = 1");
    expect(accepted).toContain("and requested_event_count = 1");
    expect(accepted).toContain("and accepted_event_count = 1");
    expect(accepted).toContain("and obligation_count = 4");
    expect(accepted).toContain("select 'REPLAY'::text, attempt_row.id, ledger_row.id, true");
    expect(acceptedStart).toBeLessThan(lifecycleStart);
  });

  it("leaves CLOSED/cancelled REQUESTED and uncertain counts UNKNOWN before any new money write", () => {
    expect(lifecycleStart).toBeGreaterThan(terminalStart);
    const gate = body.slice(lifecycleStart, writeStart);
    expect(gate).toContain("or appointment_row.status::text = 'cancelled'");
    expect(gate).toContain("if attempt_row.execution_state <> 'REQUESTED'");
    for (const guard of ["ledger_count <> 0", "requested_event_count <> 1", "accepted_event_count <> 0", "obligation_count <> 0"]) expect(gate).toContain(guard);
    expect(gate.match(/select 'UNKNOWN'::text/g)).toHaveLength(2);
    expect(gate).not.toContain("NOT_COMMITTABLE");
  });

  it("returns terminal/replay outcomes without a new write, transition, attempt or retry", () => {
    expect(writeStart).toBeGreaterThan(lifecycleStart);
    expect(body.slice(0, writeStart).replace(/--[^\n]*/g, "")).not.toMatch(/\b(insert into|update public|delete from)\b/i);
    expect(terminal).not.toContain("NEW_ATTEMPT_ALLOWED");
  });
});
