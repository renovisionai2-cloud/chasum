import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationPath = "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql";
const migration = readFileSync(resolve(root, migrationPath), "utf8");
const sql = migration.replace(/--[^\n]*/g, "");
const design = () => readFileSync(resolve(root, "docs/reviews/issue-134-payment-attempt-foundation.md"), "utf8");
const tables = ["commerce_payment_attempts", "commerce_payment_attempt_events", "commerce_payment_reconciliation"];
const table = (name: string) => sql.split(`create table public.${name} (`)[1]?.split("\n);")[0] ?? "";

describe("Issue #134 prepared-only foundation contract (offline)", () => {
  it("has only three bounded new tables and balanced function bodies", () => {
    expect([...sql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1])).toEqual(tables);
    expect(sql.match(/as \$\$/g)).toHaveLength(3);
    expect(sql.match(/end \$\$;/g)).toHaveLength(3);
    expect(sql).not.toMatch(/^\s*\$;\s*$/m);
    expect(sql).toContain("set local lock_timeout = '5s'");
    expect(sql).toContain("set local statement_timeout = '30s'");
  });

  it("requires immutable versioned fingerprint and opaque attempt key", () => {
    expect(table(tables[0])).toMatch(/attempt_key uuid not null/);
    expect(table(tables[0])).toMatch(/request_fingerprint text not null/);
    expect(sql).toContain("'^v1:[0-9a-f]{64}$'");
    expect(sql).toContain("unique (business_id, attempt_key)");
    expect(sql).toContain("new.request_fingerprint");
    expect(sql).toContain("old.request_fingerprint");
    expect(sql).toContain("PAYMENT_ATTEMPT_REQUEST_IMMUTABLE");
    expect(sql).toContain("PAYMENT_ATTEMPT_APPOINTMENT_IMMUTABLE");
  });

  it("has explicit currency with no default and null-safe instrument identity", () => {
    expect(table(tables[0])).toMatch(/currency text not null check \(currency ~ '\^\[a-z\]\{3\}\$'\)/);
    expect(sql).not.toMatch(/currency[^,;\n]*default/i);
    expect(sql).not.toMatch(/\bdefault\s+'usd'/i);
    expect(sql).toContain("(method is not distinct from 'gift_card') = (gift_card_id is not null)");
    expect(sql).toContain("payment_kind <> 'none' and amount_cents > 0");
  });

  it("allows equal-value second attempts and forbids amount/session dedupe keys", () => {
    const uniqueDefinitions = [...sql.matchAll(/\bunique\s*\(([^)]+)\)/gi)].map((m) => m[1]);
    expect(uniqueDefinitions.length).toBeGreaterThan(0);
    for (const definition of uniqueDefinitions) {
      expect(definition).not.toMatch(/amount|currency|method|description|session|occurred|created_at/);
    }
    expect(table(tables[0])).not.toMatch(/description|session_id|metadata|jsonb/);
  });

  it("makes ledger linkage nullable, unique, tenant-bound and unreassignable", () => {
    expect(sql).toContain("add column payment_attempt_id uuid,");
    expect(sql).toContain("unique (payment_attempt_id)");
    expect(sql).toContain("foreign key (payment_attempt_id, business_id)");
    expect(sql).toContain("references public.commerce_payment_attempts(id, business_id) on delete restrict");
    expect(sql).toContain("new.payment_attempt_id is distinct from old.payment_attempt_id");
    expect(sql).toContain("old.payment_attempt_id is not null and new.id is distinct from old.id");
    expect(sql).toContain("PAYMENT_ATTEMPT_LEDGER_DELETE_FORBIDDEN");
    expect(sql).toContain("if new.payment_attempt_id is null then return new; end if;");
    expect(sql).toContain("if current_user <> 'service_role' then");
    expect(sql).toContain("PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH");
  });

  it("uses same-Business FKs for customer, appointment, instrument and event/obligation links", () => {
    for (const [column, target] of [["customer_id", "customers"], ["appointment_id", "appointments"], ["gift_card_id", "gift_cards"]]) {
      expect(table(tables[0])).toContain(`foreign key (${column}, business_id)`);
      expect(table(tables[0])).toContain(`references public.${target}(id, business_id) on delete restrict`);
    }
    expect(table(tables[1])).toContain("foreign key (attempt_id, business_id)");
    expect(table(tables[2])).toContain("references public.commerce_transactions(payment_attempt_id, business_id) on delete restrict");
    expect(sql).not.toMatch(/on delete (cascade|set null)/i);
  });

  it("separates execution, historical money observations and reconciliation state", () => {
    expect(table(tables[0])).toContain("execution_state text not null default 'REQUESTED'");
    expect(table(tables[0])).toContain("recovery_disposition text not null default 'RECOVER'");
    expect(table(tables[0])).not.toContain("money_state");
    expect(table(tables[1])).toContain("money_state text not null check");
    expect(table(tables[2])).toContain("state text not null default 'PENDING'");
    expect(table(tables[2])).toContain("primary key (attempt_id, projection_kind)");
    expect(design()).toContain("Missing obligations mean UNKNOWN");
    expect(design()).toContain("Receipt failure never changes recorded money or financial synchronization");
  });

  it("keeps evidence append-only and privacy-safe with no arbitrary payload or raw error", () => {
    expect(sql).toContain("before update or delete on public.commerce_payment_attempt_events");
    expect(sql).toContain("PAYMENT_ATTEMPT_HISTORY_IMMUTABLE");
    for (const name of tables) {
      expect(table(name)).not.toMatch(/jsonb?|payload|form_data|email|phone|description|message|client_secret/);
      expect(table(name)).toMatch(/failure_code text check/);
    }
  });

  it("enables RLS and revokes inherited public/client privileges on every new table", () => {
    for (const name of tables) {
      expect(sql).toContain(`alter table public.${name} enable row level security;`);
      expect(sql).toContain(`revoke all on table public.${name} from public, anon, authenticated, service_role;`);
    }
    for (const grant of sql.match(/\bgrant\b[\s\S]*?;/gi) ?? []) {
      expect(grant).toMatch(/to service_role;$/);
      expect(grant).not.toMatch(/delete|truncate|references|trigger|all privileges/i);
    }
    expect(sql).not.toMatch(/create policy|security definer|disable row level|force row level/i);
    expect(sql.match(/security invoker set search_path = pg_catalog, pg_temp/g)).toHaveLength(3);
    expect(sql.match(/revoke all on function/g)).toHaveLength(3);
  });

  it("contains no data writes/backfill, destructive DDL, external network or apply commands", () => {
    expect(sql).not.toMatch(/\binsert\s+into\b|\bupdate\s+public\.|\bdelete\s+from\b|\btruncate\s+(?:table\s+)?public\./i);
    expect(sql).not.toMatch(/\bdrop\s+(table|column|constraint|policy|function)|\bexecute\s+['"]|\bnet\.|\bhttp\w*\s*\(/i);
    expect(migration).not.toMatch(/supabase\s+(migration|db|link)|psql\s|apply_migration/i);
    expect(sql).not.toMatch(/alter\s+table\s+public\.\w+[\s\S]*?alter\s+column/i);
  });

  it("preserves the current weak booking lookup byte for byte until runtime replacement", () => {
    const source = readFileSync(resolve(root, "lib/actions/appointments.ts"), "utf8");
    const block = source.slice(source.indexOf("        const existing = await listTransactions({"), source.indexOf("        const appointmentTotalForKind ="));
    expect(Buffer.byteLength(block)).toBe(435);
    expect(createHash("sha256").update(block).digest("hex")).toBe("7ef95c88162e09eff801a036e60013e43521bd2a1ed596dfda5b579ec243396e");
  });

  it("keeps this prepared candidate free of runtime/config/manifest or older-migration changes", () => {
    // A prepared-gate assertion, deliberately retired/re-scoped only with authorized runtime work.
    const baseline = "31115e6a51b71fc097c279d205065d80e0be3573";
    const protectedPaths = ["app", "components", "lib", "public", "package.json", "package-lock.json", ".github", "release", "vercel.json", "docs/runtime/ENVIRONMENT_MANIFEST.md"];
    expect(execFileSync("git", ["diff", "--name-only", baseline, "--", ...protectedPaths], { cwd: root, encoding: "utf8" }).trim()).toBe("");
    const migrationChanges = execFileSync("git", ["diff", "--name-only", baseline, "--", "supabase"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
    expect(migrationChanges.filter((name) => name !== migrationPath)).toEqual([]);
    expect(design()).toContain("PREPARED ONLY / NOT APPLIED");
  });
});
