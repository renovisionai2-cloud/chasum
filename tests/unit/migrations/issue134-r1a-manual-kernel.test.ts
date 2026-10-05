import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationPath =
  "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql";
const migration = readFileSync(resolve(root, migrationPath), "utf8");
const sql = migration.replace(/--[^\n]*/g, "");
const verifier = readFileSync(
  resolve(root, "scripts/verify-issue134-r1a-disposable-postgres.mjs"),
  "utf8",
);
const foundation = readFileSync(
  resolve(
    root,
    "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql",
  ),
);

describe("Issue #134 R1a prepared-only migration contract", () => {
  it("preserves the accepted foundation bytes", () => {
    expect(createHash("sha256").update(foundation).digest("hex")).toBe(
      "dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47",
    );
  });

  it("creates exactly two SECURITY INVOKER functions and no other schema object", () => {
    expect(
      [...sql.matchAll(/create function public\.(\w+)/g)].map(
        (match) => match[1],
      ),
    ).toEqual([
      "admit_payment_attempt_v1",
      "commit_manual_payment_attempt_v1",
    ]);
    expect(sql.match(/language plpgsql\s+security invoker/g)).toHaveLength(2);
    expect(
      sql.match(/set search_path = pg_catalog, pg_temp/g),
    ).toHaveLength(2);
    expect(sql).not.toMatch(
      /\bcreate\s+(table|index|trigger|policy|sequence|extension)\b/i,
    );
    expect(sql).not.toMatch(
      /\balter\s+(table|default privileges|sequence)\b|\bdrop\s+/i,
    );
    expect(sql).not.toMatch(/security definer|execute\s+format|execute\s+['"]/i);
  });

  it("has bounded service-role-only execution and no existing privilege changes", () => {
    expect(sql.match(/revoke all on function/g)).toHaveLength(2);
    expect(sql.match(/grant execute on function/g)).toHaveLength(2);
    expect(sql.match(/to service_role;/g)).toHaveLength(2);
    expect(sql).not.toMatch(
      /grant\s+(select|insert|update|delete|usage|all)|revoke\s+all\s+on\s+(table|sequence)/i,
    );
    expect(sql.match(/current_user <> 'service_role'/g)).toHaveLength(2);
    expect(sql).not.toMatch(/from\s+public,\s*anon,\s*authenticated,\s*service_role/i);
  });

  it("uses effective apply timeouts and restores session defaults", () => {
    expect(sql).toContain("set lock_timeout = '5s'");
    expect(sql).toContain("set statement_timeout = '30s'");
    expect(sql).toContain("ISSUE_134_R1A_TIMEOUT_ASSERTION_FAILED");
    expect(sql).not.toMatch(/set\s+local\s+(lock_timeout|statement_timeout)/i);
    expect(sql.trimEnd()).toMatch(
      /reset lock_timeout;\s*reset statement_timeout;$/,
    );
  });

  it("compares stored financial columns and uses the hash only as supplied metadata", () => {
    expect(sql).toContain("p_request_fingerprint");
    expect(sql).not.toContain("winner.request_fingerprint");
    expect(sql).toContain("winner.payment_kind");
    expect(sql).toContain("winner.amount_cents");
    expect(sql).toContain("winner.currency");
    expect(sql).toContain("winner.method");
    expect(sql).toContain("winner.provider_route");
    expect(sql).toContain("winner.gift_card_id");
    expect(sql).not.toMatch(
      /(?:digest|md5)\s*\([^;]*request_fingerprint|request_fingerprint\s*:=/i,
    );
  });

  it("refuses nonlocal or overridden PostgreSQL targets and strips every PG variable", () => {
    expect(verifier).toContain('url.search === ""');
    expect(verifier).toContain('url.hash === ""');
    expect(verifier).toContain('!value.includes("?")');
    expect(verifier).toContain('!value.includes("#")');
    expect(verifier).toContain("/^PG/i.test(key)");
    for (const value of [
      "postgresql://local@127.0.0.1/db?host=evil.example.com",
      "postgresql://local@127.0.0.1/db?hostaddr=203.0.113.1",
      "postgresql://local@localhost/db?service=evil",
      "postgresql://local@localhost/db#anything",
    ]) {
      expect(verifier).toContain(value);
      expect(verifier.indexOf(value)).toBeLessThan(
        verifier.indexOf('run(["--version"])'),
      );
    }
    expect(verifier).not.toContain("scripts/verify-commerce-engine.mjs");
    expect(verifier.match(/env: psqlEnv/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("commits conflict evidence with a stable identity and verifies duplicate races", () => {
    expect(sql).toContain("'chasum.payment-attempt.key-conflict'");
    expect(sql).toContain("on conflict (id) do nothing");
    expect(sql).toContain(
      "conflict_event.business_id is distinct from winner.business_id",
    );
    expect(sql).toContain(
      "conflict_event.attempt_id is distinct from winner.id",
    );
    expect(sql).toContain(
      "conflict_event.event_type is distinct from 'KEY_CONFLICT'",
    );
    expect(sql).toContain("select 'KEY_CONFLICT'::text");
    expect(sql).not.toMatch(
      /set\s+(failure_class|failure_code)[\s\S]*KEY_CONFLICT/i,
    );
  });

  it("takes no caller money fields in commit and writes all obligations atomically", () => {
    const commitSource = sql.split(
      "create function public.commit_manual_payment_attempt_v1(",
    )[1] ?? "";
    const signature = commitSource.split(") returns table")[0];
    expect(signature?.trim()).toBe(
      "p_business_id uuid,\n  p_attempt_id uuid",
    );
    expect(commitSource.indexOf("set execution_state = 'ACCEPTED'")).toBeLessThan(
      commitSource.indexOf("insert into public.commerce_transactions"),
    );
    expect(
      commitSource.indexOf("insert into public.commerce_transactions"),
    ).toBeLessThan(
      commitSource.indexOf("insert into public.commerce_payment_attempt_events"),
    );
    expect(
      commitSource.indexOf("insert into public.commerce_payment_attempt_events"),
    ).toBeLessThan(
      commitSource.indexOf("insert into public.commerce_payment_reconciliation"),
    );
    for (const kind of [
      "appointment_cache",
      "invoice_settlement",
      "customer_payment_events",
      "receipt",
    ]) {
      expect(sql).toContain(`'${kind}'`);
    }
    expect(sql).toContain("'NOT_REQUIRED'");
    expect(sql).toContain("'PENDING'");
    expect(sql).not.toMatch(/\bcommit\s*;/i);
  });

  it("keeps the server module unwired, server-only, and default-off", () => {
    const directory = resolve(root, "lib/commerce/payment-attempts");
    for (const file of ["types.ts", "normalize.ts", "mappers.ts", "kernel.ts"]) {
      const source = readFileSync(resolve(directory, file), "utf8");
      expect(source).toContain('import "server-only"');
      expect(source).not.toContain('"use server"');
      expect(source).not.toContain("'use server'");
    }
    const kernel = readFileSync(resolve(directory, "kernel.ts"), "utf8");
    expect(kernel).toContain("admissionEnabled: false");
    expect(kernel).not.toContain("recordCommercePayment");
  });
});
