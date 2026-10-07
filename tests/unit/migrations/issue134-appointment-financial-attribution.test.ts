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
});
