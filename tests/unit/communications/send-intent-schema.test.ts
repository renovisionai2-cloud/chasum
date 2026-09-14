import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Source contract checks only. These do not execute SQL or substitute for the
// separately authorized PostgreSQL / Supabase privilege and concurrency checks.
const directory = join(process.cwd(), "supabase/migrations");
const migrations = readdirSync(directory).filter((name) =>
  /^\d+_communication_send_intents\.sql$/.test(name),
);
const sql = migrations.length === 1
  ? readFileSync(join(directory, migrations[0]), "utf8")
      .replace(/--[^\n]*/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  : "";

describe("prepared send-intent migration security contract", () => {
  it("contains one isolated ledger migration and does not alter existing tables", () => {
    expect(migrations).toHaveLength(1);
    expect(sql).toMatch(/^begin;/);
    expect(sql).toMatch(/create table public\.communication_send_intents\s*\(/);
    expect(sql).toMatch(/commit;$/);
    expect([...sql.matchAll(/\bcreate table\b/g)]).toHaveLength(1);
    const alteredTables = [...sql.matchAll(/alter table\s+([\w.]+)/g)]
      .map((match) => match[1]);
    expect(alteredTables).toEqual([
      "public.communication_send_intents",
      "public.communication_send_intents",
    ]);
    expect(sql).not.toMatch(/(?:^|;)\s*(?:drop|truncate|delete)\b/);
    expect(sql).not.toMatch(/\bcreate\s+(?:function|policy|trigger)\b/);
  });

  it("resolves duplicate reservations within the business boundary", () => {
    expect(sql).toMatch(/id uuid primary key default gen_random_uuid\(\)/);
    expect(sql).toMatch(/business_id uuid not null references public\.businesses\s*\(id\) on delete cascade/);
    expect(sql).toMatch(/intent_key text not null/);
    expect(sql).toMatch(/unique\s*\(business_id, intent_key\)/);
    expect(sql).not.toMatch(/unique\s*\(intent_key\)/);
  });

  it("requires ownership, positive attempts and explicit finite states", () => {
    expect(sql).toMatch(/owner_id uuid not null/);
    expect(sql).toMatch(/attempt integer not null/);
    expect(sql).toMatch(/check\s*\(attempt > 0\)/);
    expect(sql).toMatch(/channel text not null check\s*\(channel in\s*\('email', 'sms'\)\)/);
    expect(sql).toMatch(/state text not null check\s*\(state in\s*\('sending', 'accepted', 'rejected', 'unknown'\)\)/);
    expect(sql).toMatch(/source text not null check\s*\(source in\s*\('inline', 'worker'\)\)/);
  });

  it("stores bounded correlation and result fields without raw communications", () => {
    expect(sql).toMatch(/recipient_hash text not null/);
    expect(sql).toContain("check (recipient_hash ~ '^[0-9a-f]{64}$')");
    expect(sql).toMatch(/failure_code text/);
    expect(sql).toContain(
      "check (failure_code ~ '^[a-zA-Z][a-zA-Z0-9_]{0,63}$')".toLowerCase(),
    );
    expect(sql).toMatch(/provider_message_id text/);
    expect(sql).toMatch(/accepted_at timestamptz/);
    expect(sql).not.toMatch(/\b(?:recipient|payload|body|metadata|provider_response|error_message)\s+(?:text|jsonb?|varchar)\b/);
  });

  it("preserves paired domain and job correlation without lifecycle dependencies", () => {
    expect(sql).toMatch(/first_job_id uuid\s*,/);
    expect(sql).toMatch(/last_job_id uuid\s*,/);
    expect(sql).toMatch(/entity_type text check\s*\(entity_type in\s*\('appointment', 'receipt'\)\)/);
    expect(sql).toMatch(/entity_id uuid\s*,/);
    expect(sql).toMatch(/check\s*\(\(entity_type is null\)\s*=\s*\(entity_id is null\)\)/);
    expect(sql).not.toMatch(/references\s+(?:public\.)?background_jobs/);
    expect(sql).not.toMatch(/references\s+(?:public\.)?(?:appointments|commerce_receipts)/);
    expect(sql).toMatch(/created_at timestamptz not null default now\(\)/);
    expect(sql).toMatch(/updated_at timestamptz not null default now\(\)/);
  });

  it("forces default-deny RLS and grants the service role only required DML", () => {
    expect(sql).toContain("alter table public.communication_send_intents enable row level security;");
    expect(sql).toContain("alter table public.communication_send_intents force row level security;");
    expect(sql).toContain("revoke all privileges on table public.communication_send_intents from public, anon, authenticated, service_role;");
    expect(sql).toContain("grant select, insert, update on table public.communication_send_intents to service_role;");
    expect([...sql.matchAll(/\bgrant\b/g)]).toHaveLength(1);
    expect(sql).not.toMatch(/\bgrant\s+(?:all|delete|truncate|trigger|references)\b/);
  });
});
