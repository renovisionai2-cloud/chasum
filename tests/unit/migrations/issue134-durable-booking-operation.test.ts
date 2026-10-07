import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

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

describe("Issue #134 durable booking-operation migration contract", () => {
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
