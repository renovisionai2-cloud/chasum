import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

function readMigration(name: string): string {
  return readFileSync(join(MIGRATIONS_DIR, name), "utf8");
}

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
}

function appointmentsStatements(sql: string): string[] {
  const stripped = stripSqlComments(sql).toLowerCase();
  return stripped
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.includes("appointments"));
}

describe("appointments RLS schema posture", () => {
  it("enables appointments RLS in 001 and never disables it later", () => {
    const initial = readMigration("001_booking_engine.sql").toLowerCase();
    expect(initial).toContain(
      "alter table appointments enable row level security",
    );

    for (const file of migrationFiles()) {
      const statements = appointmentsStatements(readMigration(file));
      for (const statement of statements) {
        expect(statement).not.toMatch(
          /alter table appointments[\s\S]*disable row level security/,
        );
      }
    }
  });

  it("drops the original public appointments insert policy in 003", () => {
    const hardening = readMigration("003_rls_hardening.sql");
    expect(hardening).toContain(
      'drop policy if exists "Public can create appointments" on appointments',
    );
    expect(hardening).toContain(
      'drop policy if exists "Public can view appointments for availability" on appointments',
    );
  });

  it("does not add a later permissive appointments policy for anon/public", () => {
    const later = migrationFiles().filter(
      (name) => name !== "001_booking_engine.sql",
    );
    for (const file of later) {
      const stripped = stripSqlComments(readMigration(file)).toLowerCase();
      expect(stripped).not.toMatch(
        /create policy[\s\S]*on appointments[\s\S]*for insert/,
      );
      expect(stripped).not.toMatch(
        /create policy[\s\S]*on appointments[\s\S]*to anon/,
      );
      expect(stripped).not.toMatch(
        /create policy[\s\S]*on appointments[\s\S]*using\s*\(\s*true\s*\)/,
      );
    }
  });

  it("keeps 040 additive: no appointments RLS, FORCE RLS, or table grant changes", () => {
    const sql = stripSqlComments(
      readMigration("040_book_public_appointment.sql"),
    ).toLowerCase();

    expect(sql).not.toContain("alter table appointments");
    expect(sql).not.toContain("create policy");
    expect(sql).not.toContain("alter policy");
    expect(sql).not.toContain("drop policy");
    expect(sql).not.toContain("disable row level security");
    expect(sql).not.toContain("force row level security");
    expect(sql).not.toMatch(/grant\s+[\s\S]*on table appointments/);
    expect(sql).not.toMatch(/revoke\s+[\s\S]*on table appointments/);
    expect(sql).not.toContain("alter default privileges");
    expect(sql).not.toContain("drop function if exists create_public_appointment");
  });

  it("requires a compatible SECURITY DEFINER writer if appointments FORCE RLS is introduced", () => {
    const files = migrationFiles();
    const forceFiles = files.filter((file) => {
      const statements = appointmentsStatements(readMigration(file));
      return statements.some((statement) =>
        statement.includes("force row level security"),
      );
    });

    if (forceFiles.length === 0) {
      expect(forceFiles).toEqual([]);
      return;
    }

    const rpc = readMigration("040_book_public_appointment.sql").toLowerCase();
    expect(rpc).toContain("security definer");
    expect(rpc).toContain("book_public_appointment");
    expect(rpc).toContain("set search_path = public");
  });
});
