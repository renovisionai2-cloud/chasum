// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
const migration = "supabase/migrations/20260923210000_issue_73_package_b2_core.sql";
it("dedicated import dependency graph excludes booking, event, communications, job and provider paths", () => {
  const paths = ["lib/server/import-writer.ts", ...readdirSync("lib/imports").map(f => `lib/imports/${f}`)];
  for (const path of paths) {
    const source = readFileSync(path, "utf8");
    expect(source).not.toMatch(/createBooking|resolveBookingFinancials|emitBookingEvent|enqueueReminderJobs|appointment\.created/);
    expect(source).not.toMatch(/(?:from|import\()\s*["'][^"']*(?:booking-engine|communications|notifications|providers|jobs|invoices|payments|refunds)/);
  }
  const sql = readFileSync(migration, "utf8");
  expect(sql).not.toMatch(/(?:insert into|update)\s+(?:public\.)?(?:background_jobs|communication_send_intents|booking_events|invoices|payment_transactions|refunds)\b/i);
  expect(sql).not.toMatch(/delete\s+from\s+(?:public\.)?data_import_entity_refs/i);
  expect(sql).not.toMatch(/import_unreconciled|createBooking|emitBookingEvent|enqueueReminderJobs/);
});
it("has no exposed route or use-server bulk mutation; B1 carries audit and only hashes are added", () => {
  const source = readFileSync("lib/server/import-writer.ts", "utf8");
  expect(source).toContain('import "server-only"');
  expect(source).not.toContain('"use server"');
  const sql = readFileSync(migration, "utf8");
  expect(sql).not.toMatch(/create\s+table/i);
  expect(sql).not.toMatch(/add column\s+\w+\s+jsonb/i);
  expect(sql).not.toMatch(/grant\s+(?:all|insert|update|delete)\s+on\s+(?:public\.)?data_import/i);
});
