// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Package A artifact boundary", () => {
  const target = readFileSync("supabase/migrations/026_availability_engine.sql", "utf8");
  const forward = readFileSync("sql/recovery/A_production_availability_engine_realign.sql", "utf8");
  const rollback = readFileSync("sql/recovery/A_production_availability_engine_rollback.sql", "utf8");
  it("changes only the existing-appointment branch of historical 026", () => {
    const stripBranch = (text: string) => text.replace(/  -- Staff appointments[\s\S]*?  -- External calendar/, "  -- External calendar");
    const packaged = forward.slice(forward.indexOf("-- Chasum Phase 5.1"), forward.lastIndexOf("\nCOMMIT;"));
    expect(stripBranch(packaged).trim()).toBe(stripBranch(target).trim());
    expect(forward).toMatch(/^--[\s\S]*?\nBEGIN;/);
    expect(forward.trim()).toMatch(/COMMIT;\s+NOTIFY pgrst, 'reload schema';$/);
    expect((target.match(/create or replace function/gi) ?? []).length).toBe(4);
    expect((forward.match(/create or replace function/gi) ?? []).length).toBe(4);
  });
  it("rollback drops only the derived new function with RESTRICT and reloads after commit", () => {
    expect(rollback).toContain("DROP FUNCTION public.availability_block_reason(p_business_id uuid, p_location_id uuid, p_staff_id uuid, p_service_id uuid, p_block_start timestamp with time zone, p_block_end timestamp with time zone, p_exclude_appointment_id uuid, p_allow_double_booking boolean) RESTRICT;");
    expect(rollback).not.toMatch(/CASCADE/i);
    expect(rollback.trim()).toMatch(/COMMIT;\s+NOTIFY pgrst, 'reload schema';$/);
  });
});
