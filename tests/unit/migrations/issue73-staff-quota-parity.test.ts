import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PLAN_STAFF_LIMITS, STAFF_LIMIT_REACHED_CODE } from "@/lib/billing/plan-entitlements";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260923152046_issue_73_staff_quota_hardening.sql"), "utf8");

describe("Issue #73 Staff DB/application parity", () => {
  it("matches the executable canonical seed values to every application plan", () => {
    const seed = migration.match(/select \* from \(values([\s\S]*?)\) as canonical\(plan_key, max_staff\)/)?.[1];
    expect(seed).toBeDefined();
    const entries = [...seed!.matchAll(/\('([^']+)',\s*(\d+|NULL)(?:::integer)?\)/g)];
    expect(entries).toHaveLength(Object.keys(PLAN_STAFF_LIMITS).length);
    expect(Object.fromEntries(entries.map(([, key, value]) => [key, value === "NULL" ? null : Number(value)]))).toEqual(PLAN_STAFF_LIMITS);
  });

  it("uses the controlled quota error contract", () => {
    expect(migration).toContain(`raise exception '${STAFF_LIMIT_REACHED_CODE}' using errcode = 'P0001'`);
  });
});
