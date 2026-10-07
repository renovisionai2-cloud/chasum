import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationPath =
  "supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql";
const migration = readFileSync(resolve(root, migrationPath), "utf8");
const sql = migration.replace(/--[^\n]*/g, "");
const foundation = readFileSync(
  resolve(
    root,
    "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql",
  ),
);
const r1a = readFileSync(
  resolve(
    root,
    "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql",
  ),
);
const design = readFileSync(
  resolve(root, "docs/reviews/issue-134-next-runtime-contract.md"),
);
const updateMutation = readFileSync(
  resolve(root, "lib/booking-engine/mutations/update.ts"),
  "utf8",
);
const verifier = readFileSync(
  resolve(
    root,
    "scripts/verify-issue134-appointment-financial-attribution-postgres.mjs",
  ),
  "utf8",
);
const postgresContract = readFileSync(
  resolve(
    root,
    "tests/postgres/issue-134-appointment-financial-attribution-contract.sql",
  ),
  "utf8",
);
const fkName =
  "commerce_transactions_appt_business_customer_financial_fk";

describe("Issue #134 appointment financial-attribution migration", () => {
  it("preserves the accepted foundation, R1a, and reviewed design bytes", () => {
    expect(createHash("sha256").update(foundation).digest("hex")).toBe(
      "dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47",
    );
    expect(createHash("sha256").update(r1a).digest("hex")).toBe(
      "4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7",
    );
    expect(createHash("sha256").update(design).digest("hex")).toBe(
      "33af6e34083c43730137f2fa0b748ed735de6c985980ffffe53ccb6c08961f0f",
    );
  });

  it("uses the explicit coordinator-corrected FK name without truncation", () => {
    expect(Buffer.byteLength(fkName)).toBe(57);
    expect(sql).toContain(`add constraint ${fkName}`);
    expect(updateMutation).toContain(`"${fkName}"`);
    expect(sql).not.toContain(
      "commerce_transactions_appointment_business_customer_financial_fk",
    );
  });

  it("installs exactly the approved unique key and immediate composite FK", () => {
    expect(sql).toContain(
      "add constraint appointments_id_business_customer_financial_key\n  unique (id, business_id, customer_id)",
    );
    expect(sql).toContain(
      `add constraint ${fkName}\n  foreign key (appointment_id, business_id, customer_id)`,
    );
    expect(sql).toContain(
      "references public.appointments(id, business_id, customer_id)",
    );
    expect(sql).toMatch(
      /match simple\s+on update restrict\s+on delete no action\s+not deferrable;/,
    );
    expect(sql.match(/\badd constraint\b/g)).toHaveLength(2);
  });

  it("adds one invoker legacy guard after the accepted guard alphabetically", () => {
    const functionName =
      "guard_legacy_commerce_transaction_appointment_attribution_v1";
    const triggerName =
      "commerce_transactions_legacy_appointment_attribution_guard";
    expect(sql.match(/\bcreate function public\./g)).toHaveLength(1);
    expect(sql).toContain(`create function public.${functionName}()`);
    expect(sql).toContain("language plpgsql\nsecurity invoker");
    expect(sql).toContain("set search_path = pg_catalog, pg_temp");
    expect(sql).toContain(`create trigger ${triggerName}`);
    expect(sql).toContain(
      "before update or delete on public.commerce_transactions",
    );
    expect("commerce_transactions_attempt_guard" < triggerName).toBe(true);
    expect(sql).toContain(
      "if old.payment_attempt_id is not null or old.appointment_id is null then",
    );
    expect(sql).toContain(
      "LEGACY_APPOINTMENT_LEDGER_ATTRIBUTION_IMMUTABLE",
    );
    expect(sql).toContain("LEGACY_APPOINTMENT_LEDGER_DELETE_FORBIDDEN");
    expect(sql.match(/using errcode = '23514'/g)).toHaveLength(3);
  });

  it("revokes all direct execution and introduces no grant, policy, or RLS change", () => {
    expect(sql).toContain(
      "from public, anon, authenticated, service_role;",
    );
    expect(sql).not.toMatch(/\bgrant\b/i);
    expect(sql).not.toMatch(
      /\bcreate policy\b|\benable row level security\b|\bforce row level security\b|\bdefault privileges\b/i,
    );
  });

  it("is atomic, timeout-bounded, and stops on schema, collision, or tuple drift", () => {
    expect(sql.trimStart().startsWith("begin;")).toBe(true);
    expect(sql.trimEnd().endsWith("commit;")).toBe(true);
    expect(sql).toContain("set local lock_timeout = '5s'");
    expect(sql).toContain("set local statement_timeout = '30s'");
    expect(sql).toContain("ISSUE_134_ATTRIBUTION_SCHEMA_MISMATCH");
    expect(sql).toContain("ISSUE_134_ATTRIBUTION_OBJECT_COLLISION");
    expect(sql).toContain("ISSUE_134_ATTRIBUTION_EXISTING_TUPLE_MISMATCH");
    expect(sql).toContain("ISSUE_134_ATTRIBUTION_OLD_APPOINTMENT_FK_MISMATCH");
    expect(sql).toContain("ISSUE_134_ATTRIBUTION_ACCEPTED_GUARD_MISMATCH");
  });

  it("contains no DML, backfill, destructive DDL, privilege widening, or hosted command", () => {
    expect(sql).not.toMatch(
      /\binsert\s+into\b|\bupdate\s+public\.|\bdelete\s+from\b|\btruncate\b/i,
    );
    expect(sql).not.toMatch(
      /\bdrop\s+(table|column|constraint|function|trigger|policy)\b/i,
    );
    expect(migration).not.toMatch(
      /supabase\s+(link|db|start|migration|apply)|apply_migration|database_url/i,
    );
  });

  it("pins canonical cascade rejection without accepting arbitrary permission errors", () => {
    expect(postgresContract).toContain(
      "expect_canonical_appointment_delete_failure",
    );
    expect(postgresContract).toContain(
      "sqlstate = '42501'\n        and position('PAYMENT_ATTEMPT_SERVER_ONLY'",
    );
    expect(postgresContract).toContain(
      "PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH",
    );
    expect(postgresContract).toContain(
      "commerce_payment_attempts_appointment_fk",
    );
    expect(postgresContract).not.toContain(
      "sqlstate not in ('23503', '23514', '42501')",
    );
  });

  it("pins distinct canonical update role oracles and preservation checks", () => {
    const nonServiceOracle = postgresContract.indexOf(
      "'PAYMENT_ATTEMPT_SERVER_ONLY',\n  '42501'",
    );
    const serviceRole = postgresContract.indexOf(
      "set local role service_role;",
      nonServiceOracle,
    );
    const serviceOracle = postgresContract.indexOf(
      "'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',\n  '23514'",
    );
    const restoredRole = postgresContract.indexOf(
      "canonical role restoration mismatch",
    );

    expect(nonServiceOracle).toBeGreaterThan(0);
    expect(serviceRole).toBeGreaterThan(nonServiceOracle);
    expect(serviceOracle).toBeGreaterThan(serviceRole);
    expect(restoredRole).toBeGreaterThan(serviceOracle);
    expect(postgresContract).toContain(
      "current_user is distinct from session_user",
    );
    expect(postgresContract).toContain("current_user <> 'service_role'");
    expect(
      postgresContract.match(/select pg_temp\.expect_exact_failure\(/g),
    ).toHaveLength(2);
    expect(postgresContract).toContain(
      "if sqlerrm is distinct from p_message then",
    );
    expect(
      postgresContract.match(
        /select pg_temp\.assert_canonical_financial_fixture_preserved\(\);/g,
      ),
    ).toHaveLength(3);
    expect(postgresContract).not.toContain(
      "sqlstate in ('42501', '23514')",
    );
  });

  it("compares the exact trigger order with aligned text-array element types", () => {
    expect(postgresContract).toContain(
      "array_agg(\n      trigger_row.tgname::text order by trigger_row.tgname\n    )",
    );
    expect(postgresContract).not.toContain(
      "array_agg(trigger_row.tgname order by trigger_row.tgname)",
    );
    expect(postgresContract).toContain(
      `) is distinct from array[
    'commerce_transactions_attempt_guard',
    'commerce_transactions_legacy_appointment_attribution_guard'
  ] then
    raise exception 'commerce guard trigger order/set mismatch';`,
    );
  });

  it("models the claimed non-key edits only in the disclosed local contract", () => {
    for (const column of ["service_id", "staff_id", "location_id"]) {
      expect(postgresContract).toContain(`add column ${column} uuid`);
    }
    expect(postgresContract).toContain(
      "minimal-local status/time/notes/service/staff/location edits remain mutable",
    );
  });

  it("keeps verifier ownership, environment, and cleanup fail-closed", () => {
    expect(verifier).not.toContain("shared_memory_type=mmap");
    expect(verifier).toContain("current_setting('data_directory')");
    expect(verifier).toContain(
      "realpathSync(observedDataDirectory) !== realpathSync(dataDir)",
    );
    expect(verifier).toContain("PGPASSFILE: privatePgpass");
    expect(verifier).toContain("PGSERVICEFILE: privateServiceFile");
    expect(verifier).toContain("STRIPE_SECRET_KEY");
    expect(verifier).toContain(
      "Refusing PGDATA removal without confirmed server stop",
    );
    expect(verifier).toContain("originalFailure");
    expect(verifier).toContain("cleanupFailure");
    expect(verifier.indexOf("if (!stopConfirmed)")).toBeLessThan(
      verifier.indexOf("rmSync(dataDir"),
    );
  });

  it("records immutable source identity and private SQL phase evidence", () => {
    for (const path of [
      "scripts/verify-issue134-appointment-financial-attribution-postgres.mjs",
      "tests/postgres/issue-134-appointment-financial-attribution-contract.sql",
      "supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql",
      "tests/postgres/issue-134-payment-attempt-foundation-fixture.sql",
      "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql",
      "tests/postgres/issue-134-r1a-manual-kernel-fixture.sql",
      "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql",
      "tests/postgres/issue-134-r1a-manual-kernel-contract.sql",
    ]) {
      expect(verifier).toContain(`"${path}"`);
    }
    expect(verifier).toContain('spawnSync("/usr/bin/git"');
    expect(verifier).toContain("sourceIdentityBefore = captureSourceIdentity()");
    expect(verifier).toContain("evidence.sourceIdentityAfter = captureSourceIdentity()");
    expect(verifier).toContain("evidence.sourceIdentityMatched");
    expect(verifier).toContain("Verifier source identity changed during execution");
    expect(
      verifier.indexOf("sourceIdentityBeforePath,\n    `${JSON.stringify"),
    ).toBeLessThan(verifier.indexOf("command(binaries.initdb"));
    expect(verifier).toContain('join(evidenceDir, "phases.jsonl")');
    expect(verifier).toContain('join(evidenceDir, "sql.stdout.log")');
    expect(verifier).toContain('join(evidenceDir, "sql.stderr.log")');
    expect(verifier).toContain(
      'join(evidenceDir, "source-identity-before.json")',
    );
    expect(verifier).toContain(
      'join(evidenceDir, "source-identity-after.json")',
    );
    expect(verifier).toContain("recordPhase(");
    expect(verifier).toContain("mode: 0o600");
    expect(verifier).not.toContain('.stdout.includes("RECORDED")');
    expect(verifier).toContain(
      'hasExactOutputLine(paymentFirstResult.stdout, "RECORDED")',
    );
    expect(postgresContract).toContain(
      "EXPECTED_FAILURE sqlstate=% mechanism=%",
    );
    expect(postgresContract).toContain(
      "EXPECTED_INTEGRITY_FAILURE sqlstate=% mechanism=%",
    );
    expect(postgresContract).toContain(
      "EXPECTED_EXACT_FAILURE sqlstate=% mechanism=%",
    );
  });

  it("normalizes only the PostgreSQL inet display while keeping identity checks strict", () => {
    expect(verifier).toContain(
      "pg_catalog.host(pg_catalog.inet_server_addr())",
    );
    expect(verifier).not.toContain("inet_server_addr()::text");
    expect(verifier).toContain('listenAddresses !== "127.0.0.1"');
    expect(verifier).toContain('serverAddress !== "127.0.0.1"');
    expect(verifier).toContain("serverPort !== String(port)");
    expect(verifier).toContain('isPostgres17 !== "t"');
    expect(verifier).toContain(
      "realpathSync(observedDataDirectory) !== realpathSync(dataDir)",
    );

    const humanRunFields =
      "127.0.0.1|127.0.0.1/32|57017|t|/tmp/owned/pgdata".split("|");
    expect(humanRunFields).toHaveLength(5);
    expect(humanRunFields[1]).not.toBe("127.0.0.1");
    expect(humanRunFields[1]?.split("/")[0]).toBe("127.0.0.1");
  });
});
